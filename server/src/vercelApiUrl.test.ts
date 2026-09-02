import { describe, expect, it } from 'vitest'
import { restoreVercelApiUrl } from './vercelApiUrl.js'

describe('restoreVercelApiUrl', () => {
  it('keeps a full /api path', () => {
    expect(restoreVercelApiUrl('/api/faq/match')).toBe('/api/faq/match')
  })

  it('rebuilds the path from the rewrite query', () => {
    expect(restoreVercelApiUrl('/api?__orig=faq/match')).toBe('/api/faq/match')
    expect(restoreVercelApiUrl('/api?__orig=health/ready')).toBe('/api/health/ready')
  })

  it('prefixes a stripped path so Express still sees /api', () => {
    expect(restoreVercelApiUrl('/faq/match')).toBe('/api/faq/match')
    expect(restoreVercelApiUrl('/health')).toBe('/api/health')
  })

  it('uses the forwarded URI when the rewrite lands on /api', () => {
    expect(restoreVercelApiUrl('/api', '/api/faq/suggestions')).toBe(
      '/api/faq/suggestions',
    )
  })

  it('does not let __orig or forwarded URIs leave /api', () => {
    expect(restoreVercelApiUrl('/api?__orig=../admin')).toBe('/api')
    expect(restoreVercelApiUrl('/api?__orig=/api/../admin')).toBe('/api')
    expect(restoreVercelApiUrl('/api?__orig=//example.com')).toBe('/api')
    expect(restoreVercelApiUrl('/api', '/admin')).toBe('/api')
    expect(restoreVercelApiUrl('/api?__orig=faq/match%00')).toBe('/api')
  })
})
