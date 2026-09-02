import 'dotenv/config'
import { z } from 'zod'

const optionalString = (min: number) =>
  z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().min(min).optional(),
  )

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
    HOST: z.string().default('0.0.0.0'),

    /** `memory` exists so E2E runs and smoke checks need no live credentials. */
    APPLICATIONS_STORE: z.enum(['supabase', 'memory']).default('supabase'),

    SUPABASE_URL: optionalString(1),
    SUPABASE_SERVICE_ROLE_KEY: optionalString(20),
    SUPABASE_PUBLISHABLE_KEY: optionalString(20),

    RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
    RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(100_000).default(10),

    CORS_ORIGINS: optionalString(1),
    CSP_UPGRADE_INSECURE_REQUESTS: z
      .preprocess(
        (value) => (value === undefined ? undefined : value === 'true'),
        z.boolean(),
      )
      .optional(),
    IP_HASH_SALT: optionalString(16),
    ADMIN_API_KEY: optionalString(24),
    CLOUDFLARE_ACCOUNT_ID: optionalString(16),
    CLOUDFLARE_API_TOKEN: optionalString(20),
    FAQ_MIN_SIMILARITY: z.coerce.number().min(0).max(1).default(0.58),
    FAQ_MIN_MARGIN: z.coerce.number().min(0).max(1).default(0.04),
    SERVE_STATIC: z
      .preprocess(
        (value) => (value === undefined ? undefined : value === 'true'),
        z.boolean(),
      )
      .optional(),
  })
  .superRefine((env, ctx) => {
    if (env.APPLICATIONS_STORE !== 'supabase') return

    if (!env.SUPABASE_URL || !z.url().safeParse(env.SUPABASE_URL).success) {
      ctx.addIssue({
        code: 'custom',
        path: ['SUPABASE_URL'],
        message:
          'Set SUPABASE_URL to your project URL, e.g. https://your-project.supabase.co',
      })
    }

    if (!env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_PUBLISHABLE_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['SUPABASE_SERVICE_ROLE_KEY'],
        message:
          'Set SUPABASE_SERVICE_ROLE_KEY (recommended) or SUPABASE_PUBLISHABLE_KEY so the API can reach Supabase.',
      })
    }
  })

export interface SupabaseConfig {
  url: string
  key: string
  /** Service-role keys bypass RLS, which is what allows reading applications back. */
  canRead: boolean
}

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production'
  isProduction: boolean
  port: number
  host: string
  store: 'supabase' | 'memory'
  supabase: SupabaseConfig | null
  rateLimit: { windowMs: number; max: number }
  corsOrigins: string[]
  /**
   * Off by default: the directive forces every subresource onto HTTPS, which
   * breaks deployments (and local production runs) served over plain HTTP.
   * Enable it once the site is reachable only over HTTPS.
   */
  upgradeInsecureRequests: boolean
  ipHashSalt: string | null
  adminApiKey: string | null
  serveStatic: boolean
  cloudflare: { accountId: string; apiToken: string } | null
  faq: { minSimilarity: number; minMargin: number }
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(source)

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('\n')
    throw new ConfigError(
      `Invalid server environment. Copy .env.example to .env and fill in the values.\n${details}`,
    )
  }

  const env = parsed.data
  const isProduction = env.NODE_ENV === 'production'
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

  return {
    nodeEnv: env.NODE_ENV,
    isProduction,
    port: env.PORT,
    host: env.HOST,
    store: env.APPLICATIONS_STORE,
    supabase:
      env.APPLICATIONS_STORE === 'supabase'
        ? {
            url: env.SUPABASE_URL!,
            key: serviceRoleKey ?? env.SUPABASE_PUBLISHABLE_KEY!,
            canRead: Boolean(serviceRoleKey),
          }
        : null,
    rateLimit: {
      windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
      max: env.RATE_LIMIT_MAX,
    },
    corsOrigins:
      env.CORS_ORIGINS?.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean) ?? [],
    upgradeInsecureRequests: env.CSP_UPGRADE_INSECURE_REQUESTS ?? false,
    ipHashSalt: env.IP_HASH_SALT ?? null,
    adminApiKey: env.ADMIN_API_KEY ?? null,
    // Vercel serves the Vite `dist` output from the CDN. Express static
    // serving is ignored there and would only add work to the function.
    serveStatic: env.SERVE_STATIC ?? (isProduction && source.VERCEL !== '1'),
    cloudflare:
      env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN
        ? {
            accountId: env.CLOUDFLARE_ACCOUNT_ID,
            apiToken: env.CLOUDFLARE_API_TOKEN,
          }
        : null,
    faq: {
      minSimilarity: env.FAQ_MIN_SIMILARITY,
      minMargin: env.FAQ_MIN_MARGIN,
    },
  }
}
