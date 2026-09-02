import { existsSync } from 'node:fs'
import path from 'node:path'
import compression from 'compression'
import cors from 'cors'
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express'
import helmet from 'helmet'
import { createClient } from '@supabase/supabase-js'
import { createAdminRoutes } from './admin/routes.js'
import { createApplicationRoutes } from './applications/routes.js'
import type { ApplicationsRepository } from './applications/repository.js'
import { asyncHandler } from './asyncHandler.js'
import type { AppConfig } from './config.js'
import { createDealerRoutes } from './dealers/routes.js'
import { createCloudflareEmbeddings } from './faq/embeddings.js'
import { createFaqAdminRoutes } from './faq/adminRoutes.js'
import { createFaqPublicRoutes } from './faq/routes.js'
import {
  createFaqService,
  createMemoryFaqService,
  type FaqService,
} from './faq/service.js'
import { createPortalRoutes } from './portal/routes.js'
import { createProductMediaAdminRoutes } from './productMedia/adminRoutes.js'

export interface CreateAppOptions {
  config: AppConfig
  repository: ApplicationsRepository
  /** Absolute path to the built client. Static serving is skipped if absent. */
  clientDir?: string
  enableRateLimit?: boolean
  faq?: FaqService
}

export function createApp({
  config,
  repository,
  clientDir,
  enableRateLimit = true,
  faq,
}: CreateAppOptions): Express {
  const app = express()
  const faqService = faq ?? createDefaultFaqService(config)

  app.disable('x-powered-by')
  // One hop: the app is expected to sit behind a single reverse proxy in production.
  app.set('trust proxy', 1)

  const supabaseOrigin = config.supabase?.url

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', ...(supabaseOrigin ? [supabaseOrigin] : [])],
          mediaSrc: ["'self'", ...(supabaseOrigin ? [supabaseOrigin] : [])],
          connectSrc: ["'self'", ...(supabaseOrigin ? [supabaseOrigin] : [])],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          ...(config.upgradeInsecureRequests
            ? { upgradeInsecureRequests: [] }
            : {}),
        },
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  )
  app.use(compression())

  // Only enabled when the client is served from a different origin.
  if (config.corsOrigins.length > 0) {
    app.use(
      cors({
        origin: config.corsOrigins,
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      }),
    )
  }

  app.use(express.json({ limit: '16kb' }))

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      uptime: Math.round(process.uptime()),
      environment: config.nodeEnv,
    })
  })

  app.get(
    '/api/health/ready',
    asyncHandler(async (_req: Request, res: Response) => {
      const database = await repository.checkConnectivity()
      const ready = database !== 'unreachable'
      res.status(ready ? 200 : 503).json({
        status: ready ? 'ok' : 'degraded',
        database,
      })
    }),
  )

  app.use('/api', createApplicationRoutes({ repository, config, enableRateLimit }))
  app.use(
    '/api',
    createFaqPublicRoutes({ config, faq: faqService, enableRateLimit }),
  )
  app.use('/api', createDealerRoutes(config))
  app.use('/api', createPortalRoutes(config))
  app.use('/api', createAdminRoutes(config, repository))
  app.use('/api', createProductMediaAdminRoutes(config))
  app.use('/api', createFaqAdminRoutes(config, faqService))

  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'not_found', message: 'Unknown API endpoint.' })
  })

  if (config.serveStatic && clientDir && existsSync(clientDir)) {
    const indexHtml = path.join(clientDir, 'index.html')

    app.use(
      express.static(clientDir, {
        index: false,
        setHeaders: (res, filePath) => {
          // Vite fingerprints everything under /assets, so it can be cached hard.
          const cacheable = filePath.includes(`${path.sep}assets${path.sep}`)
          res.setHeader(
            'Cache-Control',
            cacheable ? 'public, max-age=31536000, immutable' : 'no-cache',
          )
        },
      }),
    )

    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        next()
        return
      }
      res.setHeader('Cache-Control', 'no-cache')
      res.sendFile(indexHtml, (error) => {
        if (error) next(error)
      })
    })
  }

  app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
    // body-parser rejections carry their own HTTP status and a `type` discriminator.
    const bodyError = error as { type?: string; status?: number } | null

    if (bodyError?.type === 'entity.too.large') {
      res.status(413).json({
        error: 'payload_too_large',
        message: 'Request body is too large.',
      })
      return
    }

    if (bodyError?.type === 'entity.parse.failed') {
      res.status(400).json({
        error: 'invalid_json',
        message: 'Request body must be valid JSON.',
      })
      return
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[api] ${req.method} ${req.originalUrl} failed: ${message}`)

    res.status(500).json({
      error: 'internal_error',
      message:
        'Something went wrong on our side. Please retry, or email dealer-relations@amptron.co.in.',
    })
  })

  return app
}

function createDefaultFaqService(config: AppConfig): FaqService {
  if (config.store === 'memory' || !config.supabase) {
    return createMemoryFaqService()
  }
  const client = createClient(config.supabase.url, config.supabase.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const embeddings = config.cloudflare
    ? createCloudflareEmbeddings(config.cloudflare)
    : null
  return createFaqService(config, client, embeddings)
}
