import { Router, type Response } from 'express'
import {
  faqPatchSchema,
  faqWriteSchema,
  supportStatusSchema,
} from '../../../shared/faqSchema.js'
import { asyncHandler } from '../asyncHandler.js'
import { createActorResolver, type AuthedRequest } from '../auth.js'
import type { AppConfig } from '../config.js'
import { FaqStoreUnavailableError, type FaqService } from './service.js'

function normalizeId(param: string | string[] | undefined): string | null {
  if (Array.isArray(param)) return param[0] ?? null
  return param ?? null
}

function handleStoreError(error: unknown, res: Response): boolean {
  if (error instanceof FaqStoreUnavailableError) {
    res.status(503).json({ error: 'unavailable', message: error.message })
    return true
  }
  return false
}

export function createFaqAdminRoutes(config: AppConfig, faq: FaqService): Router {
  const router = Router()
  const resolveActor = createActorResolver(config)

  router.get(
    '/admin/faqs',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      try {
        const faqs = await faq.listFaqs()
        res.json({ faqs, count: faqs.length })
      } catch (error) {
        if (handleStoreError(error, res)) return
        throw error
      }
    }),
  )

  router.post(
    '/admin/faqs',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      const parsed = faqWriteSchema.safeParse(req.body)
      if (!parsed.success) {
        res
          .status(422)
          .json({ error: 'validation_failed', message: 'Invalid FAQ payload.' })
        return
      }
      try {
        const created = await faq.upsertFaq(parsed.data, actor.accountId)
        res.status(201).json({ faq: created })
      } catch (error) {
        if (handleStoreError(error, res)) return
        throw error
      }
    }),
  )

  router.post(
    '/admin/faqs/seed',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      try {
        const result = await faq.seedFaqs()
        res.json({
          message: `Loaded ${result.upserted} test FAQs. You can edit or replace them anytime.`,
          upserted: result.upserted,
        })
      } catch (error) {
        if (handleStoreError(error, res)) return
        throw error
      }
    }),
  )

  router.patch(
    '/admin/faqs/:id',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      const id = normalizeId(req.params.id)
      if (!id) {
        res
          .status(400)
          .json({ error: 'validation_failed', message: 'Missing FAQ id.' })
        return
      }
      const parsed = faqPatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res
          .status(422)
          .json({ error: 'validation_failed', message: 'Invalid FAQ update.' })
        return
      }
      try {
        const updated = await faq.patchFaq(id, parsed.data)
        res.json({ faq: updated })
      } catch (error) {
        if (handleStoreError(error, res)) return
        throw error
      }
    }),
  )

  router.delete(
    '/admin/faqs/:id',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      const id = normalizeId(req.params.id)
      if (!id) {
        res
          .status(400)
          .json({ error: 'validation_failed', message: 'Missing FAQ id.' })
        return
      }
      try {
        await faq.deleteFaq(id)
        res.json({ message: 'FAQ deleted.' })
      } catch (error) {
        if (handleStoreError(error, res)) return
        throw error
      }
    }),
  )

  router.get(
    '/admin/support-queries',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      try {
        const queries = await faq.listSupportQueries()
        res.json({ queries, count: queries.length })
      } catch (error) {
        if (handleStoreError(error, res)) return
        throw error
      }
    }),
  )

  router.post(
    '/admin/support-queries/:id/status',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      const id = normalizeId(req.params.id)
      if (!id) {
        res
          .status(400)
          .json({ error: 'validation_failed', message: 'Missing query id.' })
        return
      }
      const parsed = supportStatusSchema.safeParse(req.body)
      if (!parsed.success) {
        res
          .status(422)
          .json({ error: 'validation_failed', message: 'Invalid status.' })
        return
      }
      try {
        const updated = await faq.updateSupportQuery(id, parsed.data)
        res.json({
          message: `Query marked ${updated.status}.`,
          query: updated,
        })
      } catch (error) {
        if (handleStoreError(error, res)) return
        throw error
      }
    }),
  )

  return router
}
