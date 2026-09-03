import { describe, expect, it } from 'vitest'
import { FAQ_SEED } from '../../../shared/faqSeed.js'
import {
  detectModel,
  detectTopic,
  normalizeTokens,
  pickLexicalMatch,
  rankLexical,
} from './ranking.js'

const faqs = FAQ_SEED.map((item, index) => ({
  id: String(index),
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
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}))

// ---------------------------------------------------------------------------
// normalizeTokens
// ---------------------------------------------------------------------------

describe('normalizeTokens', () => {
  it('removes stopwords and maps synonyms', () => {
    const tokens = normalizeTokens('What is the cost of the scooter?')
    expect(tokens).toContain('price')
    expect(tokens).not.toContain('what')
    expect(tokens).not.toContain('is')
    expect(tokens).not.toContain('the')
    expect(tokens).not.toContain('scooter')
  })

  it('folds charging -> charge', () => {
    expect(normalizeTokens('charging time')).toContain('charge')
  })

  it('folds warrenty -> warranty via typo tolerance in scoring', () => {
    // The token "warrenty" itself survives (not a known synonym) but tokensMatch
    // will match it against "warranty" in the FAQ corpus during scoring.
    // normalizeTokens should at least not discard it.
    const tokens = normalizeTokens('warrenty claim')
    expect(tokens.length).toBeGreaterThan(0)
  })

  it('handles Hinglish price tokens', () => {
    const tokens = normalizeTokens('storm ka price kitna hai')
    expect(tokens).toContain('storm')
    expect(tokens).toContain('price')
  })
})

// ---------------------------------------------------------------------------
// detectModel / detectTopic
// ---------------------------------------------------------------------------

describe('detectModel', () => {
  it('detects volt', () => expect(detectModel('volt range')).toBe('volt'))
  it('detects storm', () => expect(detectModel('how fast is storm')).toBe('storm'))
  it('detects cruise', () => expect(detectModel('cruise charging time')).toBe('cruise'))
  it('returns null for no model', () => expect(detectModel('range of scooter')).toBeNull())
})

describe('detectTopic', () => {
  it('detects range', () => expect(detectTopic(normalizeTokens('how far does it go'))).toBe('range'))
  it('detects charge from charging', () => expect(detectTopic(normalizeTokens('charging time'))).toBe('charge'))
  it('detects price from cost', () => expect(detectTopic(normalizeTokens('cost kitna'))).toBe('price'))
  it('detects battery from kwh', () => expect(detectTopic(normalizeTokens('kwh battery'))).toBe('battery'))
})

// ---------------------------------------------------------------------------
// Resolver: model + topic → direct slug hit
// ---------------------------------------------------------------------------

describe('resolver (model + topic)', () => {
  it('resolves storm range directly', () => {
    const match = pickLexicalMatch('storm range', faqs)
    expect(match).not.toBeNull()
    expect(match?.faq.slug).toBe('storm-range')
    expect(match?.via).toBe('resolver')
  })

  it('resolves volt charge directly', () => {
    const match = pickLexicalMatch('volt charging time', faqs)
    expect(match?.faq.slug).toBe('volt-charge')
    expect(match?.via).toBe('resolver')
  })

  it('resolves cruise speed directly', () => {
    const match = pickLexicalMatch('cruise speed', faqs)
    expect(match?.faq.slug).toBe('cruise-speed')
    expect(match?.via).toBe('resolver')
  })

  it('resolves model-less range to range-all-models', () => {
    const match = pickLexicalMatch('what is the range', faqs)
    expect(match?.faq.slug).toBe('range-all-models')
  })

  it('resolves model-less charging to charge-time-all-models', () => {
    const match = pickLexicalMatch('how long to charge', faqs)
    expect(match?.faq.slug).toBe('charge-time-all-models')
  })
})

// ---------------------------------------------------------------------------
// Natural phrasings that previously required embeddings
// ---------------------------------------------------------------------------

describe('natural phrasing (previously embedding-only)', () => {
  it('answers "What is the range of Storm?"', () => {
    const match = pickLexicalMatch('What is the range of Storm?', faqs)
    expect(match).not.toBeNull()
    expect(match?.faq.slug).toBe('storm-range')
  })

  it('answers "storm price?"', () => {
    const match = pickLexicalMatch('storm price?', faqs)
    expect(match).not.toBeNull()
    expect(match?.faq.slug).toBe('model-pricing')
  })

  it('answers "how long to charge cruise"', () => {
    const match = pickLexicalMatch('how long to charge cruise', faqs)
    expect(match?.faq.slug).toBe('cruise-charge')
  })

  it('answers "how much does amptron cost"', () => {
    const match = pickLexicalMatch('how much does amptron cost', faqs)
    expect(match).not.toBeNull()
    expect(['model-pricing', 'model-pricing']).toContain(match?.faq.slug)
  })

  it('answers "where can I service my scooter"', () => {
    const match = pickLexicalMatch('where can I service my scooter', faqs)
    expect(match).not.toBeNull()
    expect(match?.faq.slug).toBe('service-locations')
  })

  it('answers "volt battery size"', () => {
    const match = pickLexicalMatch('volt battery size', faqs)
    expect(match?.faq.slug).toBe('volt-battery')
  })
})

// ---------------------------------------------------------------------------
// Typo tolerance
// ---------------------------------------------------------------------------

describe('typo tolerance', () => {
  it('matches "warrenty" to warranty FAQ', () => {
    const match = pickLexicalMatch('warrenty claim', faqs)
    expect(match).not.toBeNull()
    expect(['warranty', 'warranty-claim'].some((s) => match?.faq.slug.includes('warrant'))).toBe(true)
  })

  it('matches "chrging time volt" to volt-charge', () => {
    const match = pickLexicalMatch('chrging time volt', faqs)
    expect(match).not.toBeNull()
    expect(match?.faq.slug).toBe('volt-charge')
  })
})

// ---------------------------------------------------------------------------
// Hinglish / Telugu
// ---------------------------------------------------------------------------

describe('Hinglish / Telugu', () => {
  it('answers "storm ka price kitna hai"', () => {
    const match = pickLexicalMatch('storm ka price kitna hai', faqs)
    expect(match).not.toBeNull()
    expect(match?.faq.slug).toBe('model-pricing')
  })

  it('answers "kitna range hai" via range-all-models', () => {
    const match = pickLexicalMatch('kitna range hai', faqs)
    expect(match?.faq.slug).toBe('range-all-models')
  })

  it('answers "dealer kahan hai" via find-showroom', () => {
    const match = pickLexicalMatch('dealer kahan hai', faqs)
    expect(match?.faq.slug).toBe('find-showroom')
  })

  it('answers "test ride book karna hai"', () => {
    const match = pickLexicalMatch('test ride book karna hai', faqs)
    expect(match?.faq.slug).toBe('test-ride')
  })
})

// ---------------------------------------------------------------------------
// Model disambiguation
// ---------------------------------------------------------------------------

describe('model disambiguation', () => {
  it('"storm range" does not return volt-range', () => {
    const match = pickLexicalMatch('storm range', faqs)
    expect(match?.faq.slug).not.toBe('volt-range')
    expect(match?.faq.slug).not.toBe('cruise-range')
    expect(match?.faq.slug).toBe('storm-range')
  })

  it('"volt speed" does not return storm-speed or cruise-speed', () => {
    const match = pickLexicalMatch('volt speed', faqs)
    expect(match?.faq.slug).toBe('volt-speed')
  })

  it('"cruise battery" does not return volt-battery', () => {
    const match = pickLexicalMatch('cruise battery', faqs)
    expect(match?.faq.slug).toBe('cruise-battery')
  })

  it('model-less "range" does not pick a specific model range slug', () => {
    const match = pickLexicalMatch('what is the range', faqs)
    expect(match?.faq.slug).toBe('range-all-models')
  })
})

// ---------------------------------------------------------------------------
// Stored answer fidelity
// ---------------------------------------------------------------------------

describe('stored answer fidelity', () => {
  it('returns the exact Storm range answer', () => {
    const match = pickLexicalMatch('What is the certified range of Amptron Storm?', faqs)
    expect(match?.faq.answer).toBe('Amptron Storm has a certified range of 120 km per charge.')
  })

  it('does not invent an answer for unrelated questions', () => {
    expect(pickLexicalMatch('What is the weather in Hyderabad?', faqs)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// New ranking test corpus (previously missing)
// ---------------------------------------------------------------------------

describe('new FAQ corpus coverage', () => {
  it('returns pricing guidance for cost questions', () => {
    const match = pickLexicalMatch('How much do Amptron scooters cost?', faqs)
    expect(match?.faq.slug).toBe('model-pricing')
    expect(match?.faq.answer).toMatch(/79,990/)
  })

  it('returns model selection guidance for comparison questions', () => {
    // More natural phrasings that survive stopword removal
    const match1 = pickLexicalMatch('help me choose a scooter model', faqs)
    expect(match1).not.toBeNull()
    expect(match1?.faq.slug).toBe('which-model-to-choose')

    const match2 = pickLexicalMatch('recommend a model', faqs)
    expect(match2).not.toBeNull()
    expect(match2?.faq.answer).toMatch(/Most Popular/)
  })

  it('returns service guidance for maintenance questions', () => {
    const match = pickLexicalMatch('Where can I service my Amptron scooter?', faqs)
    expect(match?.faq.slug).toBe('service-locations')
    expect(match?.faq.answer).toMatch(/Find a Showroom/)
  })
})

// ---------------------------------------------------------------------------
// rankLexical: top result ordering
// ---------------------------------------------------------------------------

describe('why-buy resolver', () => {
  it('answers "Why I need to buy" with why-buy-amptron', () => {
    const match = pickLexicalMatch('Why I need to buy', faqs)
    expect(match?.faq.slug).toBe('why-buy-amptron')
    expect(match?.via).toBe('resolver')
  })

  it('answers "Why I have to buy from you" with why-buy-direct', () => {
    const match = pickLexicalMatch('Why I have to buy from you', faqs)
    expect(match?.faq.slug).toBe('why-buy-direct')
    expect(match?.via).toBe('resolver')
  })

  it('answers "what this company is about" via what-is-amptron', () => {
    const match = pickLexicalMatch('What this company is about', faqs)
    expect(match?.faq.slug).toBe('what-is-amptron')
  })
})

describe('rankLexical ordering', () => {
  it('places resolver hits at score >= 0.9', () => {
    const ranked = rankLexical('storm range', faqs)
    expect(ranked[0]?.score).toBeGreaterThanOrEqual(0.9)
    expect(ranked[0]?.via).toBe('resolver')
  })
})
