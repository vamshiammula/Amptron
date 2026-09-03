import { createHash, randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  QUOTA_UNAVAILABLE_MESSAGE,
  type FaqCta,
} from '../../../shared/faqConstants.js'
import type { FaqWriteInput, SupportQueryInput } from '../../../shared/faqSchema.js'
import { FAQ_SEED } from '../../../shared/faqSeed.js'
import type { AppConfig } from '../config.js'
import {
  EmbeddingQuotaError,
  EmbeddingUnavailableError,
  type EmbeddingsClient,
} from './embeddings.js'
import {
  embeddingText,
  normalizeTokens,
  pickConfidentMatch,
  pickLexicalMatch,
  reRankByModel,
  detectModel,
  type FaqRecord,
} from './ranking.js'
import { matchSmallTalk, smallTalkReply, normalizeSmallTalk } from './smallTalk.js'

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export type MatchVia = 'smalltalk' | 'cache' | 'resolver' | 'lexical' | 'embedding'

export type MatchResult =
  | {
      matched: true
      source: 'smalltalk'
      answer: string
      via: MatchVia
    }
  | {
      matched: true
      source: 'faq'
      answer: string
      faqId: string
      question: string
      cta: FaqCta | null
      via: MatchVia
    }
  | {
      matched: false
      reason: 'unmatched' | 'quota'
      message?: string
    }

export interface SupportQueryRecord {
  id: string
  question: string
  name: string
  phone: string | null
  email: string | null
  preferredLanguage: string
  reason: string
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface FaqService {
  match(query: string): Promise<MatchResult>
  submitSupport(input: SupportQueryInput): Promise<{ id: string }>
  suggestions(): Promise<Array<{ question: string }>>
  listFaqs(): Promise<FaqRecord[]>
  upsertFaq(input: FaqWriteInput, accountId: string | null): Promise<FaqRecord>
  patchFaq(id: string, input: Partial<FaqWriteInput>): Promise<FaqRecord>
  deleteFaq(id: string): Promise<void>
  seedFaqs(): Promise<{ upserted: number }>
  listSupportQueries(): Promise<SupportQueryRecord[]>
  updateSupportQuery(
    id: string,
    patch: { status: string; notes?: string },
  ): Promise<SupportQueryRecord>
}

// ---------------------------------------------------------------------------
// In-memory LRU cache
// ---------------------------------------------------------------------------

const LRU_MAX = 500
const LRU_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

interface LruEntry {
  faqId: string | null
  ts: number
}

class LruCache {
  private readonly map = new Map<string, LruEntry>()

  get(key: string): LruEntry | undefined {
    const entry = this.map.get(key)
    if (!entry) return undefined
    if (Date.now() - entry.ts > LRU_TTL_MS) {
      this.map.delete(key)
      return undefined
    }
    // Move to end (most recently used)
    this.map.delete(key)
    this.map.set(key, entry)
    return entry
  }

  set(key: string, faqId: string | null): void {
    if (this.map.size >= LRU_MAX) {
      // Evict oldest
      const firstKey = this.map.keys().next().value
      if (firstKey !== undefined) this.map.delete(firstKey)
    }
    this.map.set(key, { faqId, ts: Date.now() })
  }

  invalidate(faqId: string): void {
    for (const [key, entry] of this.map) {
      if (entry.faqId === faqId) this.map.delete(key)
    }
  }

  clear(): void {
    this.map.clear()
  }
}

// Shared LRU across requests in the same process
const lru = new LruCache()

// ---------------------------------------------------------------------------
// FAQ list in-memory cache (avoid fetching embedding column on every query)
// ---------------------------------------------------------------------------

const FAQ_LIST_TTL_MS = 5 * 60 * 1000 // 5 minutes

interface FaqListCache {
  rows: FaqRow[]
  ts: number
}

let faqListCache: FaqListCache | null = null

function bustFaqListCache(): void {
  faqListCache = null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface FaqRow {
  id: string
  slug: string
  question: string
  answer: string
  audience: string
  category: string
  aliases: string[] | null
  cta: string | null
  is_active: boolean
  is_seed: boolean
  has_embedding: boolean
  created_at: string
  updated_at: string
}

interface FaqRowWithEmbedding extends Omit<FaqRow, 'has_embedding'> {
  embedding?: number[] | string | null
}

/** Match path: no embedding column (avoids ~4 KB per row over the wire). */
const FAQ_MATCH_SELECT =
  'id, slug, question, answer, audience, category, aliases, cta, is_active, is_seed, created_at, updated_at'

/** Admin path: embedding included only to derive hasEmbedding. */
const FAQ_ADMIN_SELECT = `${FAQ_MATCH_SELECT}, embedding`

const MATCH_COUNT = 5

function seedFaqRecords(): FaqRecord[] {
  const now = new Date().toISOString()
  return FAQ_SEED.map((item) => ({
    id: `seed:${item.slug}`,
    slug: item.slug,
    question: item.question,
    answer: item.answer,
    audience: item.audience,
    category: item.category,
    aliases: item.aliases,
    cta: item.cta,
    isActive: true,
    isSeed: true,
    hasEmbedding: false,
    createdAt: now,
    updatedAt: now,
  }))
}

function mapFaq(row: FaqRow): FaqRecord {
  return {
    id: row.id,
    slug: row.slug,
    question: row.question,
    answer: row.answer,
    audience: row.audience,
    category: row.category,
    aliases: row.aliases ?? [],
    cta: row.cta,
    isActive: row.is_active,
    isSeed: row.is_seed,
    hasEmbedding: row.has_embedding,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapActiveFaq(row: Omit<FaqRow, 'has_embedding'>): FaqRecord {
  return mapFaq({ ...row, has_embedding: false })
}

function mapAdminFaq(row: FaqRowWithEmbedding): FaqRecord {
  const { embedding, ...rest } = row
  return mapFaq({ ...rest, has_embedding: embedding != null })
}

function queryHash(query: string): string {
  // Hash the normalized token string for cache-key stability
  const key = normalizeTokens(query).join(' ')
  return createHash('sha256').update(key).digest('hex')
}

function logMatch(
  query: string,
  result: MatchResult,
  via: MatchVia,
  slug?: string,
  score?: number,
): void {
  if (result.matched) {
    console.log(
      JSON.stringify({
        event: 'faq_match',
        via,
        slug: slug ?? (result.source === 'faq' ? result.faqId : undefined),
        score: score !== undefined ? Math.round(score * 1000) / 1000 : undefined,
        qlen: query.length,
      }),
    )
  } else {
    console.log(
      JSON.stringify({ event: 'faq_unmatched', reason: result.reason, qlen: query.length }),
    )
  }
}

// ---------------------------------------------------------------------------
// Supabase service
// ---------------------------------------------------------------------------

export function createFaqService(
  config: AppConfig,
  client: SupabaseClient | null,
  embeddings: EmbeddingsClient | null,
): FaqService {
  const minScore = config.faq.minSimilarity
  const minMargin = config.faq.minMargin

  const requireClient = (): SupabaseClient => {
    if (!client) throw new FaqStoreUnavailableError()
    return client
  }

  // Fetch active FAQ rows WITHOUT the embedding column (trimmed fetch)
  async function listActive(): Promise<FaqRow[]> {
    if (faqListCache && Date.now() - faqListCache.ts < FAQ_LIST_TTL_MS) {
      return faqListCache.rows
    }
    const db = requireClient()
    const { data, error } = await db
      .from('faq_entries')
      .select(FAQ_MATCH_SELECT)
      .eq('is_active', true)
    if (error) throw new Error(`Could not load FAQs: ${error.message}`)
    const rows = (data ?? []) as Omit<FaqRow, 'has_embedding'>[]
    faqListCache = { rows: rows as FaqRow[], ts: Date.now() }
    return rows as FaqRow[]
  }

  async function embedAndStore(id: string, text: string): Promise<void> {
    if (!embeddings) return
    const [vector] = await embeddings.embed([text])
    if (!vector) return
    const db = requireClient()
    const { error } = await db
      .from('faq_entries')
      .update({ embedding: vector })
      .eq('id', id)
    if (error) throw new Error(`Could not store FAQ embedding: ${error.message}`)
  }

  // Read cache entry from Supabase (cold-function path)
  async function readDbCache(hash: string): Promise<string | null | undefined> {
    if (!client) return undefined
    const { data } = await client
      .from('faq_match_cache')
      .select('faq_id')
      .eq('query_hash', hash)
      .maybeSingle()
    if (!data) return undefined // cache miss
    // Touch last_hit_at async (don't await)
    void client
      .from('faq_match_cache')
      .update({ last_hit_at: new Date().toISOString() })
      .eq('query_hash', hash)
    return data.faq_id as string | null
  }

  // Write cache entry to Supabase (only after embedding resolution)
  async function writeDbCache(hash: string, faqId: string | null): Promise<void> {
    if (!client) return
    await client.from('faq_match_cache').upsert(
      { query_hash: hash, faq_id: faqId, hit_count: 1, last_hit_at: new Date().toISOString() },
      { onConflict: 'query_hash' },
    )
  }

  // Invalidate DB cache for a specific faq_id
  async function invalidateDbCache(faqId: string): Promise<void> {
    if (!client) return
    await client.from('faq_match_cache').delete().eq('faq_id', faqId)
  }

  // Truncate entire DB cache (used on seedFaqs)
  async function truncateDbCache(): Promise<void> {
    if (!client) return
    await client.from('faq_match_cache').delete().neq('query_hash', '')
  }

  async function matchByEmbedding(
    query: string,
    faqs: FaqRecord[],
  ): Promise<{ result: MatchResult; faqId: string | null; score?: number }> {
    if (!embeddings) {
      return { result: { matched: false, reason: 'unmatched' }, faqId: null }
    }
    const [vector] = await embeddings.embed([query])
    if (!vector) return { result: { matched: false, reason: 'unmatched' }, faqId: null }

    const db = requireClient()
    const { data, error } = await db.rpc('match_faq_entries', {
      query_embedding: vector,
      match_count: MATCH_COUNT,
    })
    if (error) throw new Error(`Could not match FAQs: ${error.message}`)

    const normalizedRaw = normalizeSmallTalk(query)
    const model = detectModel(normalizedRaw)

    let ranked = (data ?? []).map(
      (row: {
        id: string; slug: string; question: string; answer: string
        audience: string; category: string; cta: string | null; similarity: number
      }) => ({ faq: { id: row.id, slug: row.slug, question: row.question, answer: row.answer, audience: row.audience, category: row.category, cta: row.cta }, score: Number(row.similarity) }),
    )

    // Model-aware re-rank on embedding results too
    if (model) {
      ranked = reRankByModel(ranked, model)
    }

    const picked = pickConfidentMatch(ranked, minScore, minMargin)
    if (!picked) {
      return { result: { matched: false, reason: 'unmatched' }, faqId: null }
    }
    return {
      result: {
        matched: true,
        source: 'faq',
        answer: picked.faq.answer,
        faqId: picked.faq.id,
        question: picked.faq.question,
        cta: asCta(picked.faq.cta),
        via: 'embedding',
      },
      faqId: picked.faq.id,
      score: picked.score,
    }
  }

  return {
    async match(query) {
      // 1. Small talk (free, local)
      const intent = matchSmallTalk(query)
      if (intent) {
        const result: MatchResult = {
          matched: true, source: 'smalltalk',
          answer: smallTalkReply(intent), via: 'smalltalk',
        }
        logMatch(query, result, 'smalltalk')
        return result
      }

      if (!client) {
        return { matched: false, reason: 'unmatched' }
      }

      // 2. In-memory LRU cache
      const hash = queryHash(query)
      const lruEntry = lru.get(hash)
      if (lruEntry !== undefined) {
        if (lruEntry.faqId === null) {
          logMatch(query, { matched: false, reason: 'unmatched' }, 'cache')
          return { matched: false, reason: 'unmatched' }
        }
        const rows = await listActive()
        const faqs = rows.length > 0 ? rows.map(mapActiveFaq) : seedFaqRecords()
        const found = faqs.find((f) => f.id === lruEntry.faqId)
        if (found) {
          const result: MatchResult = {
            matched: true, source: 'faq',
            answer: found.answer, faqId: found.id,
            question: found.question, cta: asCta(found.cta), via: 'cache',
          }
          logMatch(query, result, 'cache', found.slug)
          return result
        }
      }

      // 3. Supabase DB cache (cold-function path)
      const dbHit = await readDbCache(hash).catch(() => undefined)
      if (dbHit !== undefined) {
        lru.set(hash, dbHit) // warm up LRU
        if (dbHit === null) {
          logMatch(query, { matched: false, reason: 'unmatched' }, 'cache')
          return { matched: false, reason: 'unmatched' }
        }
        const rows = await listActive()
        const faqs = rows.length > 0 ? rows.map(mapActiveFaq) : seedFaqRecords()
        const found = faqs.find((f) => f.id === dbHit)
        if (found) {
          const result: MatchResult = {
            matched: true, source: 'faq',
            answer: found.answer, faqId: found.id,
            question: found.question, cta: asCta(found.cta), via: 'cache',
          }
          logMatch(query, result, 'cache', found.slug)
          return result
        }
      }

      // 4. Free lexical tier (resolver + weighted IDF)
      const rows = await listActive()
      const faqs = rows.length > 0 ? rows.map(mapActiveFaq) : seedFaqRecords()
      const lexical = pickLexicalMatch(query, faqs)
      if (lexical) {
        const via = lexical.via === 'resolver' ? 'resolver' : 'lexical'
        const result: MatchResult = {
          matched: true, source: 'faq',
          answer: lexical.faq.answer, faqId: lexical.faq.id,
          question: lexical.faq.question, cta: asCta(lexical.faq.cta), via,
        }
        logMatch(query, result, via, lexical.faq.slug, lexical.score)
        return result
      }

      // 5. Embedding fallback (costs neurons)
      try {
        const { result, faqId, score } = await matchByEmbedding(query, faqs)
        // Cache embedding results to avoid repeat calls
        lru.set(hash, faqId)
        await writeDbCache(hash, faqId)
        logMatch(query, result, 'embedding', faqId ?? undefined, score)
        return result
      } catch (error) {
        if (error instanceof EmbeddingQuotaError) {
          return { matched: false, reason: 'quota', message: QUOTA_UNAVAILABLE_MESSAGE }
        }
        if (error instanceof EmbeddingUnavailableError) {
          return { matched: false, reason: 'unmatched' }
        }
        throw error
      }
    },

    async submitSupport(input) {
      const db = requireClient()
      const { data, error } = await db
        .from('support_queries')
        .insert({
          question: input.question,
          name: input.name,
          phone: input.phone,
          email: input.email,
          preferred_language: input.preferredLanguage,
          reason: input.reason,
          status: 'new',
        })
        .select('id')
        .single()
      if (error || !data) throw new Error(error?.message ?? 'Could not store your details.')
      return { id: String(data.id) }
    },

    async suggestions() {
      if (!client) {
        return FAQ_SEED.slice(0, 6).map((item) => ({ question: item.question }))
      }
      const { data, error } = await client
        .from('faq_entries')
        .select('question')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(6)
      if (error) return FAQ_SEED.slice(0, 6).map((item) => ({ question: item.question }))
      const questions = (data ?? []).map((row) => String(row.question ?? '')).filter(Boolean)
      return questions.length > 0
        ? questions.map((question) => ({ question }))
        : FAQ_SEED.slice(0, 6).map((item) => ({ question: item.question }))
    },

    async listFaqs() {
      const db = requireClient()
      const { data, error } = await db
        .from('faq_entries')
        .select(FAQ_ADMIN_SELECT)
        .order('updated_at', { ascending: false })
      if (error) throw new Error(`Could not load FAQs: ${error.message}`)
      return ((data ?? []) as FaqRowWithEmbedding[]).map(mapAdminFaq)
    },

    async upsertFaq(input, accountId) {
      const db = requireClient()
      bustFaqListCache()
      const payload = {
        slug: input.slug,
        question: input.question,
        answer: input.answer,
        audience: input.audience,
        category: input.category,
        aliases: input.aliases,
        cta: input.cta,
        is_active: input.isActive,
        created_by: accountId,
      }
      const { data, error } = await db
        .from('faq_entries')
        .upsert(payload, { onConflict: 'slug' })
        .select(FAQ_ADMIN_SELECT)
        .single()
      if (error || !data) throw new Error(error?.message ?? 'Could not save FAQ.')
      const row = data as FaqRowWithEmbedding
      try {
        await embedAndStore(row.id, embeddingText(input))
        // Invalidate cache entries for this FAQ
        lru.invalidate(row.id)
        await invalidateDbCache(row.id)
        return { ...mapAdminFaq(row), hasEmbedding: Boolean(embeddings) }
      } catch (embedError) {
        if (
          embedError instanceof EmbeddingQuotaError ||
          embedError instanceof EmbeddingUnavailableError
        ) {
          return mapAdminFaq({ ...row, embedding: null })
        }
        throw embedError
      }
    },

    async patchFaq(id, input) {
      const db = requireClient()
      bustFaqListCache()
      const payload: Record<string, unknown> = {}
      if (input.slug !== undefined) payload.slug = input.slug
      if (input.question !== undefined) payload.question = input.question
      if (input.answer !== undefined) payload.answer = input.answer
      if (input.audience !== undefined) payload.audience = input.audience
      if (input.category !== undefined) payload.category = input.category
      if (input.aliases !== undefined) payload.aliases = input.aliases
      if (input.cta !== undefined) payload.cta = input.cta
      if (input.isActive !== undefined) payload.is_active = input.isActive

      const { data, error } = await db
        .from('faq_entries')
        .update(payload)
        .eq('id', id)
        .select(FAQ_ADMIN_SELECT)
        .single()
      if (error || !data) throw new Error(error?.message ?? 'Could not update FAQ.')
      const row = data as FaqRowWithEmbedding
      lru.invalidate(row.id)
      await invalidateDbCache(row.id)
      const shouldReembed = input.question !== undefined || input.aliases !== undefined
      if (shouldReembed) {
        try {
          await embedAndStore(
            row.id,
            embeddingText({ question: row.question, aliases: row.aliases ?? [] }),
          )
          return { ...mapAdminFaq(row), hasEmbedding: Boolean(embeddings) }
        } catch (embedError) {
          if (
            embedError instanceof EmbeddingQuotaError ||
            embedError instanceof EmbeddingUnavailableError
          ) {
            return mapAdminFaq({ ...row, embedding: null })
          }
          throw embedError
        }
      }
      return mapAdminFaq(row)
    },

    async deleteFaq(id) {
      const db = requireClient()
      bustFaqListCache()
      lru.invalidate(id)
      await invalidateDbCache(id)
      const { error } = await db.from('faq_entries').delete().eq('id', id)
      if (error) throw new Error(`Could not delete FAQ: ${error.message}`)
    },

    async seedFaqs() {
      const db = requireClient()
      bustFaqListCache()
      lru.clear()
      await truncateDbCache()

      // Load existing rows to skip unchanged embeddings
      const { data: existing } = await db
        .from('faq_entries')
        .select('slug, question, aliases, embedding')
      const existingMap = new Map<string, { question: string; aliases: string[]; hasEmbedding: boolean }>()
      for (const row of (existing ?? []) as Array<{ slug: string; question: string; aliases: string[] | null; embedding: unknown }>) {
        existingMap.set(row.slug, {
          question: row.question,
          aliases: row.aliases ?? [],
          hasEmbedding: row.embedding != null,
        })
      }

      let upserted = 0
      const toEmbed: Array<{ id: string; text: string }> = []

      for (const item of FAQ_SEED) {
        const { data, error } = await db
          .from('faq_entries')
          .upsert(
            {
              slug: item.slug,
              question: item.question,
              answer: item.answer,
              audience: item.audience,
              category: item.category,
              aliases: item.aliases,
              cta: item.cta,
              is_active: true,
              is_seed: true,
            },
            { onConflict: 'slug' },
          )
          .select('id, question, aliases')
          .single()
        if (error || !data) throw new Error(error?.message ?? `Could not seed ${item.slug}.`)
        upserted++

        const prior = existingMap.get(item.slug)
        const unchanged =
          prior?.hasEmbedding &&
          prior.question === item.question &&
          JSON.stringify(prior.aliases) === JSON.stringify(item.aliases)
        if (!unchanged) {
          toEmbed.push({ id: String(data.id), text: embeddingText(item) })
        }
      }

      // Batch-embed in groups of 20 (embeddings.embed accepts an array)
      if (embeddings && toEmbed.length > 0) {
        const BATCH = 20
        for (let i = 0; i < toEmbed.length; i += BATCH) {
          const batch = toEmbed.slice(i, i + BATCH)
          try {
            const vectors = await embeddings.embed(batch.map((b) => b.text))
            for (let j = 0; j < batch.length; j++) {
              const vector = vectors[j]
              if (!vector) continue
              await db
                .from('faq_entries')
                .update({ embedding: vector })
                .eq('id', batch[j]!.id)
            }
          } catch (embedError) {
            if (
              !(embedError instanceof EmbeddingQuotaError) &&
              !(embedError instanceof EmbeddingUnavailableError)
            ) {
              throw embedError
            }
          }
        }
      }

      return { upserted }
    },

    async listSupportQueries() {
      const db = requireClient()
      const { data, error } = await db
        .from('support_queries')
        .select(
          'id, question, name, phone, email, preferred_language, reason, status, notes, created_at, updated_at',
        )
        .order('created_at', { ascending: false })
      if (error) throw new Error(`Could not load support queries: ${error.message}`)
      return (data ?? []).map((row) => ({
        id: String(row.id),
        question: String(row.question),
        name: String(row.name),
        phone: row.phone ? String(row.phone) : null,
        email: row.email ? String(row.email) : null,
        preferredLanguage: String(row.preferred_language),
        reason: String(row.reason),
        status: String(row.status),
        notes: row.notes ? String(row.notes) : null,
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      }))
    },

    async updateSupportQuery(id, patch) {
      const db = requireClient()
      const { data, error } = await db
        .from('support_queries')
        .update({
          status: patch.status,
          ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
        })
        .eq('id', id)
        .select(
          'id, question, name, phone, email, preferred_language, reason, status, notes, created_at, updated_at',
        )
        .single()
      if (error || !data) throw new Error(error?.message ?? 'Could not update query.')
      return {
        id: String(data.id),
        question: String(data.question),
        name: String(data.name),
        phone: data.phone ? String(data.phone) : null,
        email: data.email ? String(data.email) : null,
        preferredLanguage: String(data.preferred_language),
        reason: String(data.reason),
        status: String(data.status),
        notes: data.notes ? String(data.notes) : null,
        createdAt: String(data.created_at),
        updatedAt: String(data.updated_at),
      }
    },
  }
}

// ---------------------------------------------------------------------------
// In-memory service (dev / test)
// ---------------------------------------------------------------------------

export function createMemoryFaqService(): FaqService {
  const faqs: FaqRecord[] = seedFaqRecords()
  const queries: SupportQueryRecord[] = []
  // Simple map-based cache for the memory service
  const memCache = new Map<string, string | null>()

  return {
    async match(query) {
      const intent = matchSmallTalk(query)
      if (intent) {
        return { matched: true, source: 'smalltalk', answer: smallTalkReply(intent), via: 'smalltalk' }
      }
      // Check memory cache
      const hash = queryHash(query)
      if (memCache.has(hash)) {
        const faqId = memCache.get(hash)!
        if (faqId === '__unmatched__') return { matched: false, reason: 'unmatched' }
        const found = faqs.find((f) => f.id === faqId)
        if (found) {
          return { matched: true, source: 'faq', answer: found.answer, faqId: found.id, question: found.question, cta: asCta(found.cta), via: 'cache' }
        }
      }
      const lexical = pickLexicalMatch(query, faqs)
      if (!lexical) {
        memCache.set(hash, '__unmatched__')
        return { matched: false, reason: 'unmatched' }
      }
      const via: MatchVia = lexical.via === 'resolver' ? 'resolver' : 'lexical'
      return {
        matched: true, source: 'faq',
        answer: lexical.faq.answer, faqId: lexical.faq.id,
        question: lexical.faq.question, cta: asCta(lexical.faq.cta), via,
      }
    },
    async submitSupport(input) {
      const record: SupportQueryRecord = {
        id: randomUUID(),
        question: input.question,
        name: input.name,
        phone: input.phone,
        email: input.email,
        preferredLanguage: input.preferredLanguage,
        reason: input.reason,
        status: 'new',
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      queries.unshift(record)
      return { id: record.id }
    },
    async suggestions() {
      return faqs.slice(0, 6).map((item) => ({ question: item.question }))
    },
    async listFaqs() {
      return faqs
    },
    async upsertFaq(input) {
      const existing = faqs.find((item) => item.slug === input.slug)
      if (existing) {
        Object.assign(existing, { ...input, updatedAt: new Date().toISOString() })
        return existing
      }
      const created: FaqRecord = {
        id: randomUUID(), slug: input.slug,
        question: input.question, answer: input.answer,
        audience: input.audience, category: input.category,
        aliases: input.aliases, cta: input.cta,
        isActive: input.isActive, isSeed: false,
        hasEmbedding: false, createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      faqs.unshift(created)
      return created
    },
    async patchFaq(id, input) {
      const existing = faqs.find((item) => item.id === id)
      if (!existing) throw new Error('FAQ not found.')
      Object.assign(existing, input, { updatedAt: new Date().toISOString() })
      return existing
    },
    async deleteFaq(id) {
      const index = faqs.findIndex((item) => item.id === id)
      if (index >= 0) faqs.splice(index, 1)
    },
    async seedFaqs() {
      return { upserted: faqs.length }
    },
    async listSupportQueries() {
      return queries
    },
    async updateSupportQuery(id, patch) {
      const existing = queries.find((item) => item.id === id)
      if (!existing) throw new Error('Query not found.')
      existing.status = patch.status
      if (patch.notes !== undefined) existing.notes = patch.notes
      existing.updatedAt = new Date().toISOString()
      return existing
    },
  }
}

export class FaqStoreUnavailableError extends Error {
  constructor() {
    super('FAQ storage is not configured on the server.')
    this.name = 'FaqStoreUnavailableError'
  }
}

function asCta(value: string | null): FaqCta | null {
  if (value === 'buy' || value === 'test_ride' || value === 'showroom' || value === 'stock') {
    return value
  }
  return null
}
