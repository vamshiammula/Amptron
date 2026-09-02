import { randomUUID } from 'node:crypto'
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
  pickConfidentMatch,
  pickLexicalMatch,
  type FaqRecord,
} from './ranking.js'
import { matchSmallTalk, smallTalkReply } from './smallTalk.js'

export type MatchResult =
  | {
      matched: true
      source: 'smalltalk'
      answer: string
    }
  | {
      matched: true
      source: 'faq'
      answer: string
      faqId: string
      question: string
      cta: FaqCta | null
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
  embedding: number[] | string | null
  created_at: string
  updated_at: string
}

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
    hasEmbedding: row.embedding != null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function createFaqService(
  config: AppConfig,
  client: SupabaseClient | null,
  embeddings: EmbeddingsClient | null,
): FaqService {
  const minScore = config.faq.minSimilarity
  const minMargin = config.faq.minMargin

  const requireClient = (): SupabaseClient => {
    if (!client) {
      throw new FaqStoreUnavailableError()
    }
    return client
  }

  async function listActive(): Promise<FaqRow[]> {
    const db = requireClient()
    const { data, error } = await db
      .from('faq_entries')
      .select(
        'id, slug, question, answer, audience, category, aliases, cta, is_active, is_seed, embedding, created_at, updated_at',
      )
      .eq('is_active', true)
    if (error) throw new Error(`Could not load FAQs: ${error.message}`)
    return (data ?? []) as FaqRow[]
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

  async function matchByEmbedding(query: string): Promise<MatchResult> {
    if (!embeddings) {
      return { matched: false, reason: 'unmatched' }
    }
    const [vector] = await embeddings.embed([query])
    if (!vector) return { matched: false, reason: 'unmatched' }

    const db = requireClient()
    const { data, error } = await db.rpc('match_faq_entries', {
      query_embedding: vector,
      match_count: MATCH_COUNT,
    })

    if (error) throw new Error(`Could not match FAQs: ${error.message}`)
    const ranked = (data ?? []).map(
      (row: {
        id: string
        slug: string
        question: string
        answer: string
        audience: string
        category: string
        cta: string | null
        similarity: number
      }) => ({
        faq: {
          id: row.id,
          slug: row.slug,
          question: row.question,
          answer: row.answer,
          audience: row.audience,
          category: row.category,
          cta: row.cta,
        },
        score: Number(row.similarity),
      }),
    )
    const picked = pickConfidentMatch(ranked, minScore, minMargin)
    if (!picked) return { matched: false, reason: 'unmatched' }
    return {
      matched: true,
      source: 'faq',
      answer: picked.faq.answer,
      faqId: picked.faq.id,
      question: picked.faq.question,
      cta: asCta(picked.faq.cta),
    }
  }

  return {
    async match(query) {
      const intent = matchSmallTalk(query)
      if (intent) {
        return {
          matched: true,
          source: 'smalltalk',
          answer: smallTalkReply(intent),
        }
      }

      if (!client) {
        return { matched: false, reason: 'unmatched' }
      }

      const rows = await listActive()
      const faqs = rows.length > 0 ? rows.map(mapFaq) : seedFaqRecords()
      const lexical = pickLexicalMatch(query, faqs)
      if (lexical) {
        return {
          matched: true,
          source: 'faq',
          answer: lexical.faq.answer,
          faqId: lexical.faq.id,
          question: lexical.faq.question,
          cta: asCta(lexical.faq.cta),
        }
      }

      try {
        return await matchByEmbedding(query)
      } catch (error) {
        if (error instanceof EmbeddingQuotaError) {
          return {
            matched: false,
            reason: 'quota',
            message: QUOTA_UNAVAILABLE_MESSAGE,
          }
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
      if (error || !data) {
        throw new Error(error?.message ?? 'Could not store your details.')
      }
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
      if (error)
        return FAQ_SEED.slice(0, 6).map((item) => ({ question: item.question }))
      const questions = (data ?? [])
        .map((row) => String(row.question ?? ''))
        .filter(Boolean)
      return questions.length > 0
        ? questions.map((question) => ({ question }))
        : FAQ_SEED.slice(0, 6).map((item) => ({ question: item.question }))
    },

    async listFaqs() {
      const db = requireClient()
      const { data, error } = await db
        .from('faq_entries')
        .select(
          'id, slug, question, answer, audience, category, aliases, cta, is_active, is_seed, embedding, created_at, updated_at',
        )
        .order('updated_at', { ascending: false })
      if (error) throw new Error(`Could not load FAQs: ${error.message}`)
      return ((data ?? []) as FaqRow[]).map((row) =>
        mapFaq({ ...row, embedding: row.embedding ? [1] : null }),
      )
    },

    async upsertFaq(input, accountId) {
      const db = requireClient()
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
        .select(
          'id, slug, question, answer, audience, category, aliases, cta, is_active, is_seed, embedding, created_at, updated_at',
        )
        .single()
      if (error || !data) throw new Error(error?.message ?? 'Could not save FAQ.')
      const row = data as FaqRow
      try {
        await embedAndStore(row.id, embeddingText(input))
        return { ...mapFaq(row), hasEmbedding: Boolean(embeddings) }
      } catch (embedError) {
        if (
          embedError instanceof EmbeddingQuotaError ||
          embedError instanceof EmbeddingUnavailableError
        ) {
          return mapFaq({ ...row, embedding: null })
        }
        throw embedError
      }
    },

    async patchFaq(id, input) {
      const db = requireClient()
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
        .select(
          'id, slug, question, answer, audience, category, aliases, cta, is_active, is_seed, embedding, created_at, updated_at',
        )
        .single()
      if (error || !data) throw new Error(error?.message ?? 'Could not update FAQ.')
      const row = data as FaqRow
      const shouldReembed =
        input.question !== undefined || input.aliases !== undefined
      if (shouldReembed) {
        try {
          await embedAndStore(
            row.id,
            embeddingText({
              question: row.question,
              aliases: row.aliases ?? [],
            }),
          )
          return { ...mapFaq(row), hasEmbedding: Boolean(embeddings) }
        } catch (embedError) {
          if (
            embedError instanceof EmbeddingQuotaError ||
            embedError instanceof EmbeddingUnavailableError
          ) {
            return mapFaq({ ...row, embedding: null })
          }
          throw embedError
        }
      }
      return mapFaq(row)
    },

    async deleteFaq(id) {
      const db = requireClient()
      const { error } = await db.from('faq_entries').delete().eq('id', id)
      if (error) throw new Error(`Could not delete FAQ: ${error.message}`)
    },

    async seedFaqs() {
      const db = requireClient()
      let upserted = 0
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
        if (error || !data) {
          throw new Error(error?.message ?? `Could not seed ${item.slug}.`)
        }
        upserted += 1
        try {
          await embedAndStore(String(data.id), embeddingText(item))
        } catch (embedError) {
          if (
            !(embedError instanceof EmbeddingQuotaError) &&
            !(embedError instanceof EmbeddingUnavailableError)
          ) {
            throw embedError
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
      if (error || !data)
        throw new Error(error?.message ?? 'Could not update query.')
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

export function createMemoryFaqService(): FaqService {
  const faqs: FaqRecord[] = seedFaqRecords()
  const queries: SupportQueryRecord[] = []

  return {
    async match(query) {
      const intent = matchSmallTalk(query)
      if (intent) {
        return {
          matched: true,
          source: 'smalltalk',
          answer: smallTalkReply(intent),
        }
      }
      const lexical = pickLexicalMatch(query, faqs)
      if (!lexical) return { matched: false, reason: 'unmatched' }
      return {
        matched: true,
        source: 'faq',
        answer: lexical.faq.answer,
        faqId: lexical.faq.id,
        question: lexical.faq.question,
        cta: asCta(lexical.faq.cta),
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
        Object.assign(existing, {
          ...input,
          updatedAt: new Date().toISOString(),
        })
        return existing
      }
      const created: FaqRecord = {
        id: randomUUID(),
        slug: input.slug,
        question: input.question,
        answer: input.answer,
        audience: input.audience,
        category: input.category,
        aliases: input.aliases,
        cta: input.cta,
        isActive: input.isActive,
        isSeed: false,
        hasEmbedding: false,
        createdAt: new Date().toISOString(),
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
  if (
    value === 'buy' ||
    value === 'test_ride' ||
    value === 'showroom' ||
    value === 'stock'
  ) {
    return value
  }
  return null
}
