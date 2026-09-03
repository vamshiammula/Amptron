/**
 * Zero-token FAQ ranking.
 *
 * Pipeline (all free):
 *   1. normalizeQuery  – Unicode, stopwords, synonym map, typo-fold
 *   2. detectModel     – volt | storm | cruise | null
 *   3. detectTopic     – range | speed | charge | battery | payload |
 *                        brakes | features | price | colours | null
 *   4. If model + topic both present → resolve slug directly (score 1.0)
 *   5. Otherwise → weighted IDF lexical rank with model-aware boost/penalty
 *
 * Embeddings are only triggered by the caller (service.ts) when this
 * module returns null.
 */

import type { SeedFaq } from '../../../shared/faqSeed.js'
import { normalizeSmallTalk } from './smallTalk.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FaqRecord {
  id: string
  slug: string
  question: string
  answer: string
  audience: string
  category: string
  aliases: string[]
  cta: string | null
  isActive: boolean
  isSeed: boolean
  hasEmbedding: boolean
  createdAt: string
  updatedAt: string
}

export interface RankedFaq {
  faq: Pick<
    FaqRecord,
    'id' | 'slug' | 'question' | 'answer' | 'audience' | 'category' | 'cta'
  >
  score: number
  via: 'resolver' | 'lexical'
}

// ---------------------------------------------------------------------------
// Levenshtein (reused from smallTalk logic; kept local to avoid circular dep)
// ---------------------------------------------------------------------------

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  const curr = Array.from({ length: b.length + 1 }, () => 0)
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min((prev[j] ?? 0) + 1, (curr[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost)
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j] ?? 0
  }
  return prev[b.length] ?? b.length
}

// Two tokens match when identical, or when long enough and edit distance is small.
// Threshold: <= 1 for 5-6 char tokens, <= 2 for 7+ char tokens.
function tokensMatch(a: string, b: string): boolean {
  if (a === b) return true
  const lenA = a.length; const lenB = b.length
  if (lenA < 5 || lenB < 5) return false
  if (Math.abs(lenA - lenB) > 3) return false
  const maxLen = Math.max(lenA, lenB)
  const threshold = maxLen >= 7 ? 2 : 1
  return levenshtein(a, b) <= threshold
}

// ---------------------------------------------------------------------------
// Stopwords
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'have', 'has', 'had', 'will', 'would', 'can', 'could',
  'should', 'shall', 'may', 'might', 'must', 'need', 'dare',
  'what', 'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they',
  'them', 'their', 'this', 'that', 'these', 'those',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'about', 'from', 'by',
  'between', 'into', 'through', 'during', 'before', 'after',
  'and', 'or', 'but', 'not', 'so', 'yet', 'as', 'if', 'than', 'up', 'too',
  // Amptron-specific noise
  'amptron', 'scooter', 'scooters', 'electric', 'ev', 'vehicle',
  'tell', 'give', 'get', 'take', 'use', 'want', 'know', 'like', 'please',
  'find', 'show', 'let', 'make', 'put', 'go', 'going', 'much',
  // Hindi/Hinglish filler
  'mujhe', 'mera', 'kya', 'hai', 'hain', 'ko', 'ki', 'ka', 'ke',
  'ho', 'jo', 'aur', 'ya', 'nahi', 'bheja', 'please',
])

// ---------------------------------------------------------------------------
// Synonym map  (applied AFTER stopword removal)
// ---------------------------------------------------------------------------

const SYNONYMS: Record<string, string> = {
  // Price
  cost: 'price', pricing: 'price', rate: 'price', rates: 'price',
  daam: 'price', paisa: 'price', paise: 'price',
  amount: 'price', bhaav: 'price', bhav: 'price', rupee: 'price', rupees: 'price',
  exshowroom: 'price', emi: 'emi',
  loan: 'emi', finance: 'emi', financing: 'emi', installment: 'emi',
  instalment: 'emi', downpayment: 'emi', monthly: 'emi', kist: 'emi',
  // Range
  mileage: 'range', distance: 'range', km: 'range', kilometre: 'range',
  kilometers: 'range', kilometres: 'range',
  dur: 'range', duri: 'range', far: 'range',
  // Charging
  charging: 'charge', charger: 'charge', recharge: 'charge', recharging: 'charge',
  plug: 'charge', charged: 'charge', long: 'charge', der: 'charge',
  // Speed
  fast: 'speed', fastest: 'speed', velocity: 'speed', kmh: 'speed',
  topspeed: 'speed', maxspeed: 'speed',
  // Battery
  bat: 'battery', cell: 'battery', cells: 'battery', pack: 'battery',
  kwh: 'battery', watt: 'battery', lithium: 'battery', bms: 'battery',
  // Showroom / dealer
  dealer: 'showroom', dealership: 'showroom', showrooms: 'showroom',
  store: 'showroom', shop: 'showroom', outlet: 'showroom',
  nearest: 'showroom', near: 'showroom', dhundna: 'showroom',
  kahan: 'showroom', kaha: 'showroom',
  partners: 'showroom', partner: 'showroom',
  // Test ride
  testride: 'testride', trial: 'testride', demo: 'testride',
  ride: 'testride',
  book: 'book', booking: 'book',
  // Warranty
  warrenty: 'warranty', warenty: 'warranty', guarantee: 'warranty',
  guaranty: 'warranty', claim: 'warranty', claims: 'warranty',
  coverage: 'warranty', cover: 'warranty',
  // Service
  repair: 'service', maintenance: 'service', workshop: 'service',
  centre: 'service', center: 'service', mechanic: 'service',
  servicing: 'service', serviced: 'service',
  // Colour
  color: 'colour', colors: 'colour', colours: 'colour', paint: 'colour',
  shade: 'colour', shades: 'colour',
  // Payload / weight
  weight: 'payload', capacity: 'payload', load: 'payload', carry: 'payload',
  // Brakes
  braking: 'brakes', brake: 'brakes', cbs: 'brakes', disc: 'brakes',
  // Features
  feature: 'features', equipped: 'features', accessories: 'features',
  // Buying
  purchase: 'buy', order: 'buy',
  bought: 'buy', buying: 'buy', kharidna: 'buy', khareed: 'buy',
  // Home
  home: 'home', household: 'home', domestic: 'home',
}

// ---------------------------------------------------------------------------
// Core normalizer
// ---------------------------------------------------------------------------

/**
 * Returns a sorted, deduplicated array of meaningful content tokens.
 * Used for both query and FAQ text so scoring is symmetric.
 */
export function normalizeTokens(input: string): string[] {
  const base = normalizeSmallTalk(input) // Unicode + lowercase + trim
  const raw = base.split(' ').filter(Boolean)
  const mapped: string[] = []
  for (const tok of raw) {
    if (STOPWORDS.has(tok)) continue
    const syn = SYNONYMS[tok]
    mapped.push(syn ?? tok)
  }
  // deduplicate while preserving order
  const seen = new Set<string>()
  const result: string[] = []
  for (const t of mapped) {
    if (!seen.has(t)) { seen.add(t); result.push(t) }
  }
  return result
}

// ---------------------------------------------------------------------------
// Model + Topic detection
// ---------------------------------------------------------------------------

export type FaqModel = 'volt' | 'storm' | 'cruise'
export type FaqTopic =
  | 'range' | 'speed' | 'charge' | 'battery' | 'payload'
  | 'brakes' | 'features' | 'price' | 'colours' | 'showroom'

const MODEL_WORDS: Record<FaqModel, readonly string[]> = {
  volt:   ['volt', 'v'],
  storm:  ['storm', 's'],
  cruise: ['cruise', 'c'],
}
const TOPIC_WORDS: Record<FaqTopic, readonly string[]> = {
  range:    ['range', 'mileage', 'km', 'kilometre', 'distance', 'dur', 'duri', 'far'],
  speed:    ['speed', 'fast', 'kmh', 'topspeed', 'maxspeed', 'velocity'],
  charge:   ['charge', 'charging', 'charger', 'recharge', 'plug', 'der', 'long'],
  battery:  ['battery', 'kwh', 'bms', 'lithium', 'pack', 'cell'],
  payload:  ['payload', 'weight', 'capacity', 'load', 'carry'],
  brakes:   ['brakes', 'brake', 'braking', 'cbs', 'disc'],
  features: ['features', 'feature', 'accessories', 'equipped'],
  price:    ['price', 'cost', 'emi', 'loan', 'finance', 'daam', 'paisa'],
  colours:  ['colour', 'color', 'paint', 'shade'],
  showroom: ['showroom', 'dealer', 'dealership', 'kahan', 'kaha'],
}

// Build reverse maps for fast lookup
const WORD_TO_MODEL = new Map<string, FaqModel>()
for (const [model, words] of Object.entries(MODEL_WORDS) as Array<[FaqModel, readonly string[]]>) {
  for (const w of words) WORD_TO_MODEL.set(w, model)
}
const WORD_TO_TOPIC = new Map<string, FaqTopic>()
for (const [topic, words] of Object.entries(TOPIC_WORDS) as Array<[FaqTopic, readonly string[]]>) {
  for (const w of words) WORD_TO_TOPIC.set(w, topic)
}

// Slug overrides for model+topic combos that don't follow ${model}-${topic}
const SLUG_MAP: Partial<Record<`${FaqModel}-${FaqTopic}`, string>> = {
  'volt-price':      'model-pricing',
  'storm-price':     'model-pricing',
  'cruise-price':    'model-pricing',
  'volt-showroom':   'find-showroom',
  'storm-showroom':  'find-showroom',
  'cruise-showroom': 'find-showroom',
}

// Summary slug overrides for topic-only (no model) queries
const SUMMARY_SLUG_MAP: Partial<Record<FaqTopic, string>> = {
  price:    'model-pricing',
  showroom: 'find-showroom',
  charge:   'charge-time-all-models',
}

export function detectModel(normalized: string): FaqModel | null {
  // Run on the raw normalized string (pre-token) to catch e.g. "volt's"
  const tokens = normalized.split(' ')
  for (const tok of tokens) {
    const m = WORD_TO_MODEL.get(tok)
    if (m) return m
  }
  return null
}

function detectWhyBuySlug(normalizedRaw: string, queryTokens: string[]): string | null {
  const hasWhy = normalizedRaw.includes('why') || queryTokens.includes('why')
  if (!hasWhy) return null

  const hasBuyIntent =
    queryTokens.some((t) => ['buy', 'purchase', 'order'].includes(t)) ||
    /\bbuy\b/.test(normalizedRaw)
  if (!hasBuyIntent) return null

  const directSignals = [
    'from you',
    'from amptron',
    'have to buy',
    'must buy',
    'only from',
    'buy direct',
    'buy only',
  ]
  if (directSignals.some((signal) => normalizedRaw.includes(signal))) {
    return 'why-buy-direct'
  }
  return 'why-buy-amptron'
}

export function detectTopic(tokens: string[]): FaqTopic | null {
  for (const tok of tokens) {
    // Direct lookup
    const t = WORD_TO_TOPIC.get(tok)
    if (t) return t
    // Synonym-folded lookup
    const syn = SYNONYMS[tok]
    if (syn) {
      const t2 = WORD_TO_TOPIC.get(syn)
      if (t2) return t2
    }
  }
  return null
}

/**
 * Detect topic from a raw (pre-normalized) query string too.
 * Useful for catching words that get removed by stopwords.
 */
function detectTopicRaw(query: string): FaqTopic | null {
  const raw = query.toLowerCase().split(/[\s\W]+/).filter(Boolean)
  for (const tok of raw) {
    const t = WORD_TO_TOPIC.get(tok)
    if (t) return t
    const syn = SYNONYMS[tok]
    if (syn) {
      const t2 = WORD_TO_TOPIC.get(syn)
      if (t2) return t2
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// IDF weights
// ---------------------------------------------------------------------------

/**
 * Build inverse-document-frequency weights from the FAQ corpus.
 * Call once per process (or per FAQ cache refresh).
 */
function buildIdf(
  faqs: Array<Pick<FaqRecord, 'question' | 'aliases'>>,
): Map<string, number> {
  const df = new Map<string, number>()
  const N = faqs.length
  for (const faq of faqs) {
    const texts = [faq.question, ...faq.aliases]
    const seen = new Set<string>()
    for (const text of texts) {
      for (const tok of normalizeTokens(text)) {
        if (!seen.has(tok)) { seen.add(tok); df.set(tok, (df.get(tok) ?? 0) + 1) }
      }
    }
  }
  const idf = new Map<string, number>()
  for (const [tok, count] of df) {
    idf.set(tok, Math.log((N + 1) / (count + 1)) + 1)
  }
  return idf
}

// ---------------------------------------------------------------------------
// Weighted lexical scoring
// ---------------------------------------------------------------------------

function scoreFaqTokens(
  queryTokens: string[],
  faqTokens: string[],
  idf: Map<string, number>,
): number {
  if (queryTokens.length === 0 || faqTokens.length === 0) return 0
  let overlap = 0
  let total = 0
  for (const qTok of queryTokens) {
    const weight = idf.get(qTok) ?? 1
    total += weight
    const matched = faqTokens.some((fTok) => tokensMatch(qTok, fTok))
    if (matched) overlap += weight
  }
  // Also consider coverage from faq side (penalise very long FAQ haystacks)
  let faqTotal = 0
  for (const fTok of faqTokens) faqTotal += idf.get(fTok) ?? 1
  const precision = total > 0 ? overlap / total : 0
  const recall    = faqTotal > 0 ? overlap / faqTotal : 0
  if (precision + recall === 0) return 0
  return (2 * precision * recall) / (precision + recall) // F1-style
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function embeddingText(faq: Pick<SeedFaq, 'question' | 'aliases'>): string {
  const aliases = faq.aliases.filter(Boolean).join('. ')
  return aliases ? `${faq.question}. ${aliases}` : faq.question
}

export function pickConfidentMatch(
  ranked: Array<{ faq: Pick<FaqRecord, 'id' | 'slug' | 'question' | 'answer' | 'audience' | 'category' | 'cta'>; score: number }>,
  minScore: number,
  minMargin: number,
): (typeof ranked)[number] | null {
  const top = ranked[0]
  if (!top || top.score < minScore) return null
  const second = ranked[1]
  if (second && top.score - second.score < minMargin) return null
  return top
}

/**
 * Model-aware re-rank: when a model is detected in the query, zero-out
 * FAQs that clearly belong to a different model, and boost matching model.
 * Also used by service.ts to re-rank embedding results.
 */
export function reRankByModel(
  ranked: Array<{ faq: Pick<FaqRecord, 'id' | 'slug' | 'question' | 'answer' | 'audience' | 'category' | 'cta'>; score: number }>,
  model: FaqModel,
): typeof ranked {
  const otherModels: FaqModel[] = (['volt', 'storm', 'cruise'] as FaqModel[]).filter((m) => m !== model)
  return ranked
    .map((item) => {
      const slug = item.faq.slug
      // Boost exact-model FAQs
      const isThisModel = slug.startsWith(model + '-')
      // Penalize other-model FAQs
      const isOtherModel = otherModels.some((m) => slug.startsWith(m + '-'))
      let score = item.score
      if (isOtherModel) score = 0
      else if (isThisModel) score = Math.min(1, score * 1.3)
      return { ...item, score }
    })
    .sort((a, b) => b.score - a.score)
}

export function rankLexical(
  query: string,
  faqs: Array<
    Pick<FaqRecord, 'id' | 'slug' | 'question' | 'answer' | 'audience' | 'category' | 'cta' | 'aliases'>
  >,
): RankedFaq[] {
  const normalizedRaw = normalizeSmallTalk(query)
  const queryTokens = normalizeTokens(query)
  if (queryTokens.length === 0) return []

  const model = detectModel(normalizedRaw)
  // Use token-level detection first, fall back to raw string for words that
  // get dropped by stopwords (e.g. "long" in "how long to charge")
  const topic = detectTopic(queryTokens) ?? detectTopicRaw(query)

  // Resolver: model + topic → direct slug hit
  if (model && topic) {
    const key = `${model}-${topic}` as `${FaqModel}-${FaqTopic}`
    const targetSlug = SLUG_MAP[key] ?? key
    const match = faqs.find((f) => f.slug === targetSlug)
    if (match) {
      return [
        {
          faq: {
            id: match.id,
            slug: match.slug,
            question: match.question,
            answer: match.answer,
            audience: match.audience,
            category: match.category,
            cta: match.cta,
          },
          score: 1.0,
          via: 'resolver',
        },
      ]
    }
  }

  // For topic-only queries with no model, try model-less summary slugs
  if (!model && topic) {
    const overrideSlug = SUMMARY_SLUG_MAP[topic]
    const summarySlug = overrideSlug ?? `${topic}-all-models`
    const summary = faqs.find((f) => f.slug === summarySlug)
    if (summary) {
      return [
        {
          faq: {
            id: summary.id,
            slug: summary.slug,
            question: summary.question,
            answer: summary.answer,
            audience: summary.audience,
            category: summary.category,
            cta: summary.cta,
          },
          score: 0.95,
          via: 'resolver',
        },
      ]
    }
  }

  // Why-buy resolver: "why should I buy" beats generic how-to-buy
  const whySlug = detectWhyBuySlug(normalizedRaw, queryTokens)
  if (whySlug) {
    const match = faqs.find((f) => f.slug === whySlug)
    if (match) {
      return [
        {
          faq: {
            id: match.id,
            slug: match.slug,
            question: match.question,
            answer: match.answer,
            audience: match.audience,
            category: match.category,
            cta: match.cta,
          },
          score: 0.98,
          via: 'resolver',
        },
      ]
    }
  }

  // Build IDF over the provided corpus
  const idf = buildIdf(faqs)

  const ranked: RankedFaq[] = faqs.map((faq) => {
    const haystacks = [faq.question, ...faq.aliases]
    const faqTokens = Array.from(new Set(haystacks.flatMap((h) => normalizeTokens(h))))
    const score = scoreFaqTokens(queryTokens, faqTokens, idf)
    return {
      faq: {
        id: faq.id,
        slug: faq.slug,
        question: faq.question,
        answer: faq.answer,
        audience: faq.audience,
        category: faq.category,
        cta: faq.cta,
      },
      score,
      via: 'lexical' as const,
    }
  })

  ranked.sort((a, b) => b.score - a.score)

  // Model-aware re-rank
  if (model) {
    const reranked = reRankByModel(ranked, model)
    return reranked.map((r) => ({ ...r, via: 'lexical' as const }))
  }

  return ranked
}

const LEXICAL_THRESHOLD = 0.40

export function pickLexicalMatch(
  query: string,
  faqs: Array<
    Pick<FaqRecord, 'id' | 'slug' | 'question' | 'answer' | 'audience' | 'category' | 'cta' | 'aliases'>
  >,
): RankedFaq | null {
  const ranked = rankLexical(query, faqs)
  // Resolver hits (score 1.0 or 0.95) skip the margin check
  const top = ranked[0]
  if (!top) return null
  if (top.via === 'resolver' && top.score >= 0.9) return top
  const pick = pickConfidentMatch(ranked, LEXICAL_THRESHOLD, 0.04)
  return pick ? { ...pick, via: top.via } : null
}
