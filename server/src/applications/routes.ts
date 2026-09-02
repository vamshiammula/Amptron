import { createHash, timingSafeEqual } from 'node:crypto'
import { Router, type Request, type Response } from 'express'
import { rateLimit } from 'express-rate-limit'
import {
  applicationSchema,
  toFieldErrors,
} from '../../../shared/applicationSchema.js'
import { asyncHandler } from '../asyncHandler.js'
import type { AppConfig } from '../config.js'
import {
  DuplicateApplicationError,
  RepositoryPermissionError,
  type ApplicationsRepository,
} from './repository.js'

const MAX_USER_AGENT_LENGTH = 300
const DEFAULT_LIST_LIMIT = 50

function hashIp(ip: string | undefined, salt: string | null): string | null {
  if (!ip || !salt) return null
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
}

function matchesSecret(provided: string, expected: string): boolean {
  // timingSafeEqual throws on length mismatch, so compare fixed-size digests.
  return timingSafeEqual(
    createHash('sha256').update(provided).digest(),
    createHash('sha256').update(expected).digest(),
  )
}

export interface ApplicationRoutesOptions {
  repository: ApplicationsRepository
  config: AppConfig
  /** Disabled in tests so repeated submissions do not trip the limiter. */
  enableRateLimit?: boolean
}

export function createApplicationRoutes({
  repository,
  config,
  enableRateLimit = true,
}: ApplicationRoutesOptions): Router {
  const router = Router()

  const submitLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: config.rateLimit.max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      const minutes = Math.round(config.rateLimit.windowMs / 60_000)
      res.status(429).json({
        error: 'rate_limited',
        message: `Too many applications from this network. Please try again in about ${minutes} minutes.`,
      })
    },
  })

  const guards = enableRateLimit ? [submitLimiter] : []

  router.post(
    '/applications',
    ...guards,
    asyncHandler(async (req: Request, res: Response) => {
      const parsed = applicationSchema.safeParse(req.body)

      if (!parsed.success) {
        res.status(422).json({
          error: 'validation_failed',
          message: 'Please correct the highlighted fields and try again.',
          fieldErrors: toFieldErrors(parsed.error),
        })
        return
      }

      try {
        const created = await repository.create(parsed.data, {
          ipHash: hashIp(req.ip, config.ipHashSalt),
          userAgent: req.get('user-agent')?.slice(0, MAX_USER_AGENT_LENGTH) ?? null,
          source: 'website',
        })

        res.status(201).json({
          id: created.id,
          receivedAt: created.receivedAt,
          message:
            'Application received. An Amptron relationship manager will contact you within 2 business days.',
        })
      } catch (error) {
        if (error instanceof DuplicateApplicationError) {
          res.status(409).json({
            error: 'duplicate_application',
            message:
              'We already have an application for this email address. Our team will be in touch shortly.',
            fieldErrors: { email: 'This email has already been submitted.' },
          })
          return
        }
        throw error
      }
    }),
  )

  router.get(
    '/applications',
    asyncHandler(async (req: Request, res: Response) => {
      const adminApiKey = config.adminApiKey

      // Without a configured key the endpoint should not appear to exist.
      if (!adminApiKey) {
        res.status(404).json({ error: 'not_found', message: 'Not found.' })
        return
      }

      const provided = req.get('x-admin-key')
      if (!provided || !matchesSecret(provided, adminApiKey)) {
        res
          .status(401)
          .json({ error: 'unauthorized', message: 'Invalid admin key.' })
        return
      }

      const requested = Number.parseInt(String(req.query.limit ?? ''), 10)

      try {
        const applications = await repository.list({
          limit: Number.isFinite(requested) ? requested : DEFAULT_LIST_LIMIT,
        })
        res.json({ applications, count: applications.length })
      } catch (error) {
        if (error instanceof RepositoryPermissionError) {
          res
            .status(503)
            .json({ error: 'read_unavailable', message: error.message })
          return
        }
        throw error
      }
    }),
  )

  return router
}
