import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InMemoryApplicationsRepository } from './applications/inMemoryRepository.js'
import type { ApplicationsRepository } from './applications/repository.js'
import { createApp } from './app.js'
import type { AppConfig } from './config.js'

const ADMIN_KEY = 'admin-key-for-tests-0123456789'

function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
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
    ...overrides,
  }
}

function buildApp(
  options: { config?: Partial<AppConfig>; rateLimit?: boolean } = {},
) {
  const repository = new InMemoryApplicationsRepository()
  const app = createApp({
    config: testConfig(options.config),
    repository,
    enableRateLimit: options.rateLimit ?? false,
  })
  return { app, repository }
}

const validApplication = {
  fullName: 'Priya Raman',
  email: 'priya@raman-motors.co.in',
  phone: '+91 98765 43210',
  city: 'Pune, Maharashtra',
  profile:
    'We run two multi-brand two-wheeler showrooms in Pune with a combined 14 years of retail experience.',
}

describe('POST /api/applications', () => {
  let app: ReturnType<typeof buildApp>['app']
  let repository: InMemoryApplicationsRepository

  beforeEach(() => {
    ;({ app, repository } = buildApp())
  })

  it('stores a valid application and returns its id', async () => {
    const response = await request(app)
      .post('/api/applications')
      .send(validApplication)

    expect(response.status).toBe(201)
    expect(response.body.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(response.body.message).toMatch(/2 business days/i)

    const stored = await repository.list()
    expect(stored).toHaveLength(1)
    expect(stored[0]?.email).toBe('priya@raman-motors.co.in')
    expect(stored[0]?.source).toBe('website')
  })

  it('normalises the email before storing it', async () => {
    await request(app)
      .post('/api/applications')
      .send({ ...validApplication, email: '  PRIYA@Raman-Motors.co.in  ' })
      .expect(201)

    const stored = await repository.list()
    expect(stored[0]?.email).toBe('priya@raman-motors.co.in')
  })

  it('rejects an invalid payload with per-field messages', async () => {
    const response = await request(app).post('/api/applications').send({
      fullName: 'A',
      email: 'nope',
      phone: '12',
      city: '',
      profile: 'short',
    })

    expect(response.status).toBe(422)
    expect(response.body.error).toBe('validation_failed')
    expect(Object.keys(response.body.fieldErrors)).toEqual([
      'fullName',
      'email',
      'phone',
      'city',
      'profile',
    ])
  })

  it('rejects a missing body', async () => {
    const response = await request(app).post('/api/applications')
    expect(response.status).toBe(422)
  })

  it('rejects malformed JSON', async () => {
    const response = await request(app)
      .post('/api/applications')
      .set('Content-Type', 'application/json')
      .send('{"fullName": ')

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('invalid_json')
  })

  it('rejects an oversized body', async () => {
    const response = await request(app)
      .post('/api/applications')
      .send({ ...validApplication, profile: 'x'.repeat(20_000) })

    expect(response.status).toBe(413)
  })

  it('returns 409 when the same email applies twice', async () => {
    await request(app).post('/api/applications').send(validApplication).expect(201)

    const response = await request(app)
      .post('/api/applications')
      .send({ ...validApplication, fullName: 'Someone Else' })

    expect(response.status).toBe(409)
    expect(response.body.error).toBe('duplicate_application')
    expect(response.body.fieldErrors.email).toMatch(/already been submitted/i)
  })

  it('ignores unknown fields instead of storing them', async () => {
    await request(app)
      .post('/api/applications')
      .send({ ...validApplication, status: 'approved', isAdmin: true })
      .expect(201)

    const stored = await repository.list()
    expect(stored[0]?.status).toBe('new')
  })

  it('rate limits repeated submissions from one client', async () => {
    const limited = buildApp({ rateLimit: true })

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(limited.app)
        .post('/api/applications')
        .send({ ...validApplication, email: `dealer${attempt}@example.com` })
        .expect(201)
    }

    const response = await request(limited.app)
      .post('/api/applications')
      .send({ ...validApplication, email: 'dealer-six@example.com' })

    expect(response.status).toBe(429)
    expect(response.body.error).toBe('rate_limited')
  })
})

describe('GET /api/applications', () => {
  it('is hidden when no admin key is configured', async () => {
    const { app } = buildApp()
    const response = await request(app).get('/api/applications')
    expect(response.status).toBe(404)
  })

  it('rejects a wrong admin key', async () => {
    const { app } = buildApp({ config: { adminApiKey: ADMIN_KEY } })

    await request(app)
      .get('/api/applications')
      .set('x-admin-key', 'wrong-key-wrong-key-wrong-key')
      .expect(401)

    await request(app).get('/api/applications').expect(401)
  })

  it('returns stored applications for a valid admin key', async () => {
    const { app } = buildApp({ config: { adminApiKey: ADMIN_KEY } })

    await request(app).post('/api/applications').send(validApplication).expect(201)

    const response = await request(app)
      .get('/api/applications')
      .set('x-admin-key', ADMIN_KEY)

    expect(response.status).toBe(200)
    expect(response.body.count).toBe(1)
    expect(response.body.applications[0].email).toBe('priya@raman-motors.co.in')
  })
})

describe('unexpected repository failures', () => {
  const failing: ApplicationsRepository = {
    create: () => Promise.reject(new Error('supabase unreachable')),
    list: () => Promise.reject(new Error('supabase unreachable')),
    updateStatus: () => Promise.reject(new Error('supabase unreachable')),
    checkConnectivity: () => Promise.resolve('unreachable'),
  }

  it('returns a 500 with a safe message instead of crashing', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createApp({
      config: testConfig({ adminApiKey: ADMIN_KEY }),
      repository: failing,
      enableRateLimit: false,
    })

    const response = await request(app)
      .post('/api/applications')
      .send(validApplication)

    expect(response.status).toBe(500)
    expect(response.body.error).toBe('internal_error')
    // The upstream reason must never reach the visitor.
    expect(JSON.stringify(response.body)).not.toContain('supabase unreachable')

    consoleError.mockRestore()
  })

  it('reports readiness as degraded when the store is unreachable', async () => {
    const app = createApp({
      config: testConfig(),
      repository: failing,
      enableRateLimit: false,
    })

    const response = await request(app).get('/api/health/ready')

    expect(response.status).toBe(503)
    expect(response.body.status).toBe('degraded')
  })
})

describe('health and routing', () => {
  it('reports liveness', async () => {
    const { app } = buildApp()
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
  })

  it('reports readiness including the store', async () => {
    const { app } = buildApp()
    const response = await request(app).get('/api/health/ready')

    expect(response.status).toBe(200)
    expect(response.body.database).toBe('ok')
  })

  it('returns JSON 404 for unknown API routes', async () => {
    const { app } = buildApp()
    const response = await request(app).get('/api/nope')

    expect(response.status).toBe(404)
    expect(response.body.error).toBe('not_found')
  })

  it('sets hardening headers', async () => {
    const { app } = buildApp()
    const response = await request(app).get('/api/health')

    expect(response.headers['content-security-policy']).toContain(
      "default-src 'self'",
    )
    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['x-powered-by']).toBeUndefined()
  })

  it('leaves out upgrade-insecure-requests unless it is switched on', async () => {
    const plain = buildApp()
    const upgraded = buildApp({ config: { upgradeInsecureRequests: true } })

    const withoutUpgrade = await request(plain.app).get('/api/health')
    const withUpgrade = await request(upgraded.app).get('/api/health')

    expect(withoutUpgrade.headers['content-security-policy']).not.toContain(
      'upgrade-insecure-requests',
    )
    expect(withUpgrade.headers['content-security-policy']).toContain(
      'upgrade-insecure-requests',
    )
  })
})

describe('GET /api/admin/product-media', () => {
  it('is unavailable until the portal has a Supabase auth backend', async () => {
    const { app } = buildApp()
    const response = await request(app).get('/api/admin/product-media')
    expect(response.status).toBe(503)
  })

  it('rejects missing portal sessions', async () => {
    const { app } = buildApp({
      config: {
        supabase: {
          url: 'https://example.supabase.co',
          key: 'test-service-role-key-value',
          canRead: true,
        },
      },
    })
    const response = await request(app).get('/api/admin/product-media')
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/product-media/sets', () => {
  it('rejects missing portal sessions', async () => {
    const { app } = buildApp({
      config: {
        supabase: {
          url: 'https://example.supabase.co',
          key: 'test-service-role-key-value',
          canRead: true,
        },
      },
    })
    const response = await request(app).post('/api/admin/product-media/sets').send({
      modelSlug: 'amptron-storm',
      mode: 'exterior',
      label: 'Storm exterior',
    })
    expect(response.status).toBe(401)
  })
})
