import type { SeedFaq } from '../../../shared/faqSeed.js'
import { normalizeSmallTalk } from './smallTalk.js'

const LEXICAL_THRESHOLD = 0.88

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
}

export function embeddingText(faq: Pick<SeedFaq, 'question' | 'aliases'>): string {
  const aliases = faq.aliases.filter(Boolean).join('. ')
  return aliases ? `${faq.question}. ${aliases}` : faq.question
}

export function pickConfidentMatch(
  ranked: RankedFaq[],
  minScore: number,
  minMargin: number,
): RankedFaq | null {
  const top = ranked[0]
  if (!top || top.score < minScore) return null
  const second = ranked[1]
  if (second && top.score - second.score < minMargin) return null
  return top
}

function similarity(a: string, b: string): number {
  if (a === b) return 1
  if (a.includes(b) || b.includes(a)) {
    return Math.min(a.length, b.length) / Math.max(a.length, b.length)
  }
  const aTokens = new Set(a.split(' ').filter(Boolean))
  const bTokens = new Set(b.split(' ').filter(Boolean))
  if (aTokens.size === 0 || bTokens.size === 0) return 0
  let overlap = 0
  for (const token of aTokens) {
    if (bTokens.has(token)) overlap += 1
  }
  return (2 * overlap) / (aTokens.size + bTokens.size)
}

export function rankLexical(
  query: string,
  faqs: Array<
    Pick<
      FaqRecord,
      | 'id'
      | 'slug'
      | 'question'
      | 'answer'
      | 'audience'
      | 'category'
      | 'cta'
      | 'aliases'
    >
  >,
): RankedFaq[] {
  const normalized = normalizeSmallTalk(query)
  if (!normalized) return []
  const ranked: RankedFaq[] = faqs.map((faq) => {
    const haystacks = [faq.question, ...faq.aliases].map(normalizeSmallTalk)
    const score = Math.max(...haystacks.map((item) => similarity(normalized, item)))
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
    }
  })
  ranked.sort((left, right) => right.score - left.score)
  return ranked
}

export function pickLexicalMatch(
  query: string,
  faqs: Array<
    Pick<
      FaqRecord,
      | 'id'
      | 'slug'
      | 'question'
      | 'answer'
      | 'audience'
      | 'category'
      | 'cta'
      | 'aliases'
    >
  >,
): RankedFaq | null {
  return pickConfidentMatch(rankLexical(query, faqs), LEXICAL_THRESHOLD, 0.04)
}
