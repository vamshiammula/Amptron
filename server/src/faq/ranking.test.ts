import { describe, expect, it } from 'vitest'
import { FAQ_SEED } from '../../../shared/faqSeed.js'
import { pickLexicalMatch } from './ranking.js'

describe('pickLexicalMatch', () => {
  const faqs = FAQ_SEED.map((item, index) => ({
    id: String(index),
    slug: item.slug,
    question: item.question,
    answer: item.answer,
    audience: item.audience,
    category: item.category,
    aliases: item.aliases,
    cta: item.cta,
  }))

  it('returns the stored Storm range answer for a close English question', () => {
    const match = pickLexicalMatch(
      'What is the certified range of Amptron Storm?',
      faqs,
    )
    expect(match?.faq.answer).toBe(
      'Amptron Storm has a certified range of 120 km per charge.',
    )
  })

  it('does not invent an answer for unrelated questions', () => {
    expect(pickLexicalMatch('What is the weather in Hyderabad?', faqs)).toBeNull()
  })
})
