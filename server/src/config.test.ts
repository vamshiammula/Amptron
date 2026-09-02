import { describe, expect, it } from 'vitest'
import { ConfigError, loadConfig } from './config.js'

const SERVICE_KEY = 'service-role-key-value-1234567890'
const PUBLISHABLE_KEY = 'sb_publishable_value_1234567890'

const base = {
  NODE_ENV: 'test',
  SUPABASE_URL: 'https://example.supabase.co',
}

describe('loadConfig', () => {
  it('prefers the service-role key and enables reads', () => {
    const config = loadConfig({
      ...base,
      SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
      SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE_KEY,
    })

    expect(config.supabase?.key).toBe(SERVICE_KEY)
    expect(config.supabase?.canRead).toBe(true)
  })

  it('falls back to the publishable key as write-only', () => {
    const config = loadConfig({
      ...base,
      SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE_KEY,
    })

    expect(config.supabase?.key).toBe(PUBLISHABLE_KEY)
    expect(config.supabase?.canRead).toBe(false)
  })

  it('fails when no Supabase key is provided', () => {
    expect(() => loadConfig(base)).toThrow(ConfigError)
    expect(() => loadConfig(base)).toThrow(/SUPABASE_SERVICE_ROLE_KEY/)
  })

  it('fails when the Supabase URL is missing or malformed', () => {
    expect(() => loadConfig({ SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY })).toThrow(
      /SUPABASE_URL/,
    )

    expect(() =>
      loadConfig({
        SUPABASE_URL: 'not-a-url',
        SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
      }),
    ).toThrow(/SUPABASE_URL/)
  })

  it('does not require Supabase credentials for the memory store', () => {
    const config = loadConfig({ APPLICATIONS_STORE: 'memory' })

    expect(config.store).toBe('memory')
    expect(config.supabase).toBeNull()
  })

  it('treats blank values as unset', () => {
    const config = loadConfig({
      ...base,
      SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
      ADMIN_API_KEY: '   ',
      IP_HASH_SALT: '',
    })

    expect(config.adminApiKey).toBeNull()
    expect(config.ipHashSalt).toBeNull()
  })

  it('parses a comma-separated CORS allowlist', () => {
    const config = loadConfig({
      ...base,
      SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
      CORS_ORIGINS: 'https://amptron.co.in, https://www.amptron.co.in ,',
    })

    expect(config.corsOrigins).toEqual([
      'https://amptron.co.in',
      'https://www.amptron.co.in',
    ])
  })

  it('serves static files by default only in production', () => {
    const production = loadConfig({
      ...base,
      NODE_ENV: 'production',
      SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
    })
    const development = loadConfig({
      ...base,
      NODE_ENV: 'development',
      SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
    })

    expect(production.serveStatic).toBe(true)
    expect(development.serveStatic).toBe(false)
  })

  it('does not serve static files on Vercel unless explicitly enabled', () => {
    const vercel = loadConfig({
      ...base,
      NODE_ENV: 'production',
      SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
      VERCEL: '1',
    })
    const forced = loadConfig({
      ...base,
      NODE_ENV: 'production',
      SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
      VERCEL: '1',
      SERVE_STATIC: 'true',
    })

    expect(vercel.serveStatic).toBe(false)
    expect(forced.serveStatic).toBe(true)
  })

  it('derives the rate-limit window in milliseconds', () => {
    const defaults = loadConfig({
      ...base,
      SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
    })
    const tuned = loadConfig({
      ...base,
      SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
      RATE_LIMIT_WINDOW_MINUTES: '5',
      RATE_LIMIT_MAX: '50',
    })

    expect(defaults.rateLimit).toEqual({ windowMs: 900_000, max: 10 })
    expect(tuned.rateLimit).toEqual({ windowMs: 300_000, max: 50 })
  })

  it('keeps upgrade-insecure-requests off unless explicitly enabled', () => {
    const off = loadConfig({
      ...base,
      NODE_ENV: 'production',
      SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
    })
    const on = loadConfig({
      ...base,
      SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
      CSP_UPGRADE_INSECURE_REQUESTS: 'true',
    })

    expect(off.upgradeInsecureRequests).toBe(false)
    expect(on.upgradeInsecureRequests).toBe(true)
  })

  it('rejects an out-of-range port', () => {
    expect(() =>
      loadConfig({
        ...base,
        PORT: '99999',
        SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY,
      }),
    ).toThrow(ConfigError)
  })
})
