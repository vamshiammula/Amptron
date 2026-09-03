/**
 * Vite on Vercel is not Next.js: `api/[...path].ts` is not a catch-all.
 * `/api/*` is rewritten onto `api/index.ts`. Restore the public path so
 * Express still matches `/api/faq/match` and the other routes.
 *
 * `__orig` and `x-forwarded-uri` can be client-supplied, so the result is
 * always a single `/api/...` path with no traversal or host-absolute URLs.
 */
const SAFE_API_REST = /^[A-Za-z0-9/_-]+$/

export function restoreVercelApiUrl(
  url: string | undefined,
  forwardedUri?: string | string[],
): string {
  const raw = url ?? '/'
  const forwarded = Array.isArray(forwardedUri) ? forwardedUri[0] : forwardedUri
  const parsed = new URL(raw, 'http://localhost')
  const orig = parsed.searchParams.get('__orig')
  parsed.searchParams.delete('__orig')
  const search = parsed.searchParams.toString()
  const suffix = search ? `?${search}` : ''

  const restored =
    toSafeApiPath(orig ?? undefined) ??
    (parsed.pathname === '/api' || parsed.pathname === '/api/'
      ? toSafeApiPath(apiPrefixed(forwarded))
      : null) ??
    toSafeApiPath(parsed.pathname)

  return `${restored ?? '/api'}${suffix}`
}

function apiPrefixed(input: string | undefined): string | undefined {
  if (!input) return undefined
  try {
    const decoded = decodeURIComponent(input).trim()
    if (decoded === '/api' || decoded.startsWith('/api/')) return decoded
  } catch {
    return undefined
  }
  return undefined
}

function toSafeApiPath(input: string | undefined): string | null {
  if (!input) return null

  let decoded = input
  try {
    decoded = decodeURIComponent(input)
  } catch {
    return null
  }

  if (/[\0\r\n\\]/.test(decoded) || decoded.includes('..')) return null

  let rest = decoded.trim().replace(/^\/+/, '')
  if (rest === 'api') return '/api'
  if (rest.startsWith('api/')) rest = rest.slice(4)
  rest = rest.replace(/^\/+/, '')
  if (!rest) return '/api'
  if (!SAFE_API_REST.test(rest)) return null
  return `/api/${rest}`
}
