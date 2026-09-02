import { Router, type Request, type Response } from 'express'
import { rateLimit } from 'express-rate-limit'
import { toFieldErrors } from '../../../shared/applicationSchema.js'
import { faqMatchSchema, supportQuerySchema } from '../../../shared/faqSchema.js'
import { asyncHandler } from '../asyncHandler.js'
import type { AppConfig } from '../config.js'
import { FaqStoreUnavailableError, type FaqService } from './service.js'

export function createFaqPublicRoutes(options: {
  config: AppConfig
  faq: FaqService
  enableRateLimit?: boolean
}): Router {
  const router = Router()
  const enableRateLimit = options.enableRateLimit ?? true

  const matchLimiter = rateLimit({
    windowMs: options.config.rateLimit.windowMs,
    limit: Math.max(options.config.rateLimit.max * 4, 20),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: 'rate_limited',
        message: 'Too many questions from this network. Please try again shortly.',
      })
    },
  })

  const supportLimiter = rateLimit({
    windowMs: options.config.rateLimit.windowMs,
    limit: options.config.rateLimit.max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: 'rate_limited',
        message:
          'Too many follow-up requests from this network. Please try again shortly.',
      })
    },
  })

  const matchGuards = enableRateLimit ? [matchLimiter] : []
  const supportGuards = enableRateLimit ? [supportLimiter] : []

  router.get(
    '/faq/suggestions',
    asyncHandler(async (_req: Request, res: Response) => {
      const suggestions = await options.faq.suggestions()
      res.json({ suggestions })
    }),
  )

  router.post(
    '/faq/match',
    ...matchGuards,
    asyncHandler(async (req: Request, res: Response) => {
      const parsed = faqMatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(422).json({
          error: 'validation_failed',
          message: 'Enter a short question.',
          fieldErrors: toFieldErrors(parsed.error),
        })
        return
      }

      try {
        const result = await options.faq.match(parsed.data.query)
        res.json(result)
      } catch (error) {
        if (error instanceof FaqStoreUnavailableError) {
          res.status(503).json({
            error: 'unavailable',
            message: error.message,
          })
          return
        }
        throw error
      }
    }),
  )

  router.post(
    '/support-queries',
    ...supportGuards,
    asyncHandler(async (req: Request, res: Response) => {
      const parsed = supportQuerySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(422).json({
          error: 'validation_failed',
          message: 'Please correct the highlighted fields and try again.',
          fieldErrors: toFieldErrors(parsed.error),
        })
        return
      }

      try {
        const created = await options.faq.submitSupport(parsed.data)
        res.status(201).json({
          id: created.id,
          message: 'Amptron has your question. A teammate will follow up.',
        })
      } catch (error) {
        if (error instanceof FaqStoreUnavailableError) {
          res.status(503).json({
            error: 'unavailable',
            message: error.message,
          })
          return
        }
        throw error
      }
    }),
  )

  return router
}
