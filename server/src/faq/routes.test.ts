import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { QUOTA_UNAVAILABLE_MESSAGE } from '../../../shared/faqConstants.js'
import { InMemoryApplicationsRepository } from '../applications/inMemoryRepository.js'
import { createApp } from '../app.js'
import type { AppConfig } from '../config.js'
import {
  createMemoryFaqService,
  type FaqService,
  type MatchResult,
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
})
