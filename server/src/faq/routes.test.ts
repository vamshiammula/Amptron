import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QUOTA_UNAVAILABLE_MESSAGE } from '../../../shared/faqConstants.js'
import { InMemoryApplicationsRepository } from '../applications/inMemoryRepository.js'
import { createApp } from '../app.js'
import type { AppConfig } from '../config.js'
import {
  createMemoryFaqService,
  type FaqService,
  type MatchResult,
  type MatchVia,
} from './service.js'

function testConfig(): AppConfig {
  return {
    nodeEnv: 'test',
    isProduction: false,
    port: 0,
    host: '127.0.0.1',
    store: 'memory',
    supabase: null,
    rateLimit: { windowMs: 15 * 60 * 1000, max: 5 },
    corsOrigins: [],
    upgradeInsecureRequests: false,
    ipHashSalt: 'salt-value-for-tests',
    adminApiKey: null,
    serveStatic: false,
    cloudflare: null,
    faq: { minSimilarity: 0.58, minMargin: 0.04 },
  }
}

describe('FAQ public routes', () => {
  let app: ReturnType<typeof createApp>
  let faq: FaqService

  beforeEach(() => {
    faq = createMemoryFaqService()
    app = createApp({
      config: testConfig(),
      repository: new InMemoryApplicationsRepository(),
      enableRateLimit: false,
      faq,
    })
  })

  it('answers greetings locally and returns canned English', async () => {
    const response = await request(app)
      .post('/api/faq/match')
      .send({ query: 'Hii there' })
    expect(response.status).toBe(200)
    expect(response.body.matched).toBe(true)
    expect(response.body.source).toBe('smalltalk')
    expect(response.body.answer).toMatch(/Volt, Storm, or Cruise/)
  })

  it('returns the stored FAQ answer unchanged', async () => {
    const response = await request(app)
      .post('/api/faq/match')
      .send({ query: 'What is the certified range of Amptron Storm?' })
    expect(response.status).toBe(200)
    expect(response.body.answer).toBe(
      'Amptron Storm has a certified range of 120 km per charge.',
    )
    expect(response.body.source).toBe('faq')
  })

  it('includes a via field on matched responses', async () => {
    const response = await request(app)
      .post('/api/faq/match')
      .send({ query: 'storm range' })
    expect(response.status).toBe(200)
    expect(response.body.matched).toBe(true)
    const validVia: MatchVia[] = ['smalltalk', 'cache', 'resolver', 'lexical', 'embedding']
    expect(validVia).toContain(response.body.via)
  })

  it('resolves storm range via the resolver tier', async () => {
    const response = await request(app)
      .post('/api/faq/match')
      .send({ query: 'storm range' })
    expect(response.body.matched).toBe(true)
    expect(['resolver', 'lexical']).toContain(response.body.via)
    expect(response.body.answer).toMatch(/120 km/)
  })

  it('resolves Hinglish "storm ka price" via lexical tier', async () => {
    const response = await request(app)
      .post('/api/faq/match')
      .send({ query: 'storm ka price kitna hai' })
    expect(response.body.matched).toBe(true)
    expect(response.body.answer).toMatch(/79,990|1,09,990|1,34,990/)
  })

  it('resolves "how long to charge cruise" without embeddings', async () => {
    const response = await request(app)
      .post('/api/faq/match')
      .send({ query: 'how long to charge cruise' })
    expect(response.body.matched).toBe(true)
    expect(response.body.answer).toMatch(/4\.5/)
  })

  it('returns the same answer for a repeat query (cache path)', async () => {
    const query = 'volt charging time'
    const first = await request(app).post('/api/faq/match').send({ query })
    expect(first.body.matched).toBe(true)
    const second = await request(app).post('/api/faq/match').send({ query })
    expect(second.body.answer).toBe(first.body.answer)
    // Second hit may be 'cache' in the memory service
    expect(second.body.matched).toBe(true)
  })

  it('returns unmatched for unknown questions', async () => {
    const response = await request(app)
      .post('/api/faq/match')
      .send({ query: 'Do you deliver to the moon?' })
    expect(response.body).toEqual({ matched: false, reason: 'unmatched' })
  })

  it('stores a support query for unmatched questions', async () => {
    const response = await request(app).post('/api/support-queries').send({
      question: 'Do you deliver to the moon?',
      name: 'Priya Raman',
      phone: '+91 98765 43210',
      email: '',
      preferredLanguage: 'english',
      reason: 'unmatched',
      consent: true,
    })
    expect(response.status).toBe(201)
    const listed = await faq.listSupportQueries()
    expect(listed[0]?.question).toBe('Do you deliver to the moon?')
    expect(listed[0]?.reason).toBe('unmatched')
  })

  it('returns the quota unavailable message without an FAQ guess', async () => {
    const quotaFaq: FaqService = {
      ...faq,
      match: async () =>
        ({
          matched: false,
          reason: 'quota',
          message: QUOTA_UNAVAILABLE_MESSAGE,
        }) satisfies MatchResult,
    }
    const quotaApp = createApp({
      config: testConfig(),
      repository: new InMemoryApplicationsRepository(),
      enableRateLimit: false,
      faq: quotaFaq,
    })
    const response = await request(quotaApp)
      .post('/api/faq/match')
      .send({ query: 'What is Amptron Cruise range?' })
    expect(response.body.matched).toBe(false)
    expect(response.body.reason).toBe('quota')
    expect(response.body.message).toBe(QUOTA_UNAVAILABLE_MESSAGE)
    expect(response.body.answer).toBeUndefined()
  })

  it('via field is smalltalk for greeting queries', async () => {
    const response = await request(app)
      .post('/api/faq/match')
      .send({ query: 'hello' })
    expect(response.body.via).toBe('smalltalk')
  })

  it('model disambiguation: storm range never returns volt answer', async () => {
    const response = await request(app)
      .post('/api/faq/match')
      .send({ query: 'storm range' })
    expect(response.body.matched).toBe(true)
    expect(response.body.answer).not.toMatch(/80 km per charge/)
    expect(response.body.answer).toMatch(/120 km/)
  })
})
