import { createClient } from '@supabase/supabase-js'
import { Router, type Response } from 'express'
import {
  canonicalObjectPath,
  indexesAreContiguous,
  matchingSequenceDimensions,
  PRODUCT_MEDIA_MAX_BYTES,
  sanitizeStateKey,
  validateUploadMeta,
  type ProductMediaMode,
} from '../../../shared/productMedia.js'
import {
  productMediaAssetFinalizeSchema,
  productMediaSetCreateSchema,
  productMediaSetPatchSchema,
  productMediaUploadTargetSchema,
} from '../../../shared/productMediaSchema.js'
import { asyncHandler } from '../asyncHandler.js'
import { createActorResolver, type AuthedRequest } from '../auth.js'
import type { AppConfig } from '../config.js'

function normalizeId(param: string | string[] | undefined): string | null {
  if (Array.isArray(param)) return param[0] ?? null
  return param ?? null
}

export function createProductMediaAdminRoutes(config: AppConfig): Router {
  const router = Router()
  const resolveActor = createActorResolver(config)
  const hasSupabase = Boolean(config.supabase)
  const client = createClient(
    config.supabase?.url ?? 'https://invalid.local',
    config.supabase?.key ?? 'invalid',
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  const requireClient = (res: Response): boolean => {
    if (hasSupabase) return true
    res.status(503).json({
      error: 'unavailable',
      message: 'Supabase is not configured on the server.',
    })
    return false
  }

  router.get(
    '/admin/product-media',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      if (!requireClient(res)) return

      const { data, error } = await client
        .from('product_media_sets')
        .select(
          'id, mode, version, label, lifecycle, start_key, direction, published_at, created_at, scooter_models!inner ( slug, name ), product_media_assets ( id, object_path, original_filename, state_key, sequence_index, width, height, mime_type, byte_size, checksum, alt, approval )',
        )
        .order('created_at', { ascending: false })
      if (error) throw new Error(`Could not load product media: ${error.message}`)

      res.json({ sets: data ?? [], count: (data ?? []).length })
    }),
  )

  router.post(
    '/admin/product-media/sets',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      if (!requireClient(res)) return
      const parsed = productMediaSetCreateSchema.safeParse(req.body)
      if (!parsed.success) {
        res
          .status(422)
          .json({ error: 'validation_failed', message: 'Invalid media set.' })
        return
      }

      const { data: model, error: modelError } = await client
        .from('scooter_models')
        .select('id, slug, name')
        .eq('slug', parsed.data.modelSlug)
        .maybeSingle()
      if (modelError) throw new Error(modelError.message)
      if (!model) {
        res
          .status(404)
          .json({ error: 'not_found', message: 'Unknown scooter model.' })
        return
      }

      const { data: existing } = await client
        .from('product_media_sets')
        .select('version')
        .eq('model_id', model.id)
        .eq('mode', parsed.data.mode)
        .order('version', { ascending: false })
        .limit(1)
      const version = (existing?.[0]?.version ?? 0) + 1

      const { data, error } = await client
        .from('product_media_sets')
        .insert({
          model_id: model.id,
          mode: parsed.data.mode,
          version,
          label: parsed.data.label,
          lifecycle: 'draft',
        })
        .select('id, mode, version, label, lifecycle')
        .single()
      if (error) throw new Error(`Could not create media set: ${error.message}`)
      res.status(201).json({ set: data, model })
    }),
  )

  router.post(
    '/admin/product-media/sets/:id/upload-targets',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      if (!requireClient(res)) return
      const parsed = productMediaUploadTargetSchema.safeParse(req.body)
      const setId = normalizeId(req.params.id)
      if (!parsed.success || !setId) {
        res
          .status(422)
          .json({ error: 'validation_failed', message: 'Invalid upload list.' })
        return
      }

      const { data: set, error } = await client
        .from('product_media_sets')
        .select('id, mode, lifecycle, scooter_models!inner ( slug )')
        .eq('id', setId)
        .maybeSingle()
      if (error) throw new Error(error.message)
      if (!set || set.lifecycle !== 'draft') {
        res
          .status(404)
          .json({ error: 'not_found', message: 'Draft media set not found.' })
        return
      }

      const related = set.scooter_models as { slug?: string } | { slug?: string }[]
      const modelSlug = Array.isArray(related) ? related[0]?.slug : related?.slug
      if (!modelSlug) {
        res
          .status(400)
          .json({ error: 'validation_failed', message: 'Set is missing a model.' })
        return
      }

      try {
        const targets = parsed.data.files.map((file) => {
          if (file.byteSize > PRODUCT_MEDIA_MAX_BYTES) {
            throw new Error('File is larger than 50 MB.')
          }
          const objectPath = canonicalObjectPath({
            modelSlug,
            mode: set.mode as ProductMediaMode,
            setId: set.id,
            stateKey: sanitizeStateKey(file.stateKey),
            sequenceIndex: file.sequenceIndex,
            mimeType: file.mimeType,
          })
          return {
            originalFilename: file.originalFilename,
            stateKey: sanitizeStateKey(file.stateKey),
            sequenceIndex: file.sequenceIndex,
            mimeType: file.mimeType,
            objectPath,
            bucket: 'site-media',
          }
        })
        res.json({ targets })
      } catch (pathError) {
        res.status(422).json({
          error: 'validation_failed',
          message:
            pathError instanceof Error
              ? pathError.message
              : 'Could not name files.',
        })
      }
    }),
  )

  router.post(
    '/admin/product-media/sets/:id/assets',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      if (!requireClient(res)) return
      const parsed = productMediaAssetFinalizeSchema.safeParse(req.body)
      const setId = normalizeId(req.params.id)
      if (!parsed.success || !setId) {
        res
          .status(422)
          .json({ error: 'validation_failed', message: 'Invalid asset list.' })
        return
      }

      const { data: set, error: setError } = await client
        .from('product_media_sets')
        .select('id, mode, lifecycle')
        .eq('id', setId)
        .maybeSingle()
      if (setError) throw new Error(setError.message)
      if (!set || set.lifecycle !== 'draft') {
        res
          .status(404)
          .json({ error: 'not_found', message: 'Draft media set not found.' })
        return
      }

      const checksums = new Set<string>()
      for (const asset of parsed.data.assets) {
        const invalid = validateUploadMeta(asset)
        if (invalid) {
          res.status(422).json({ error: 'validation_failed', message: invalid })
          return
        }
        if (checksums.has(asset.checksum)) {
          res.status(422).json({
            error: 'validation_failed',
            message: 'Duplicate image checksum in this set.',
          })
          return
        }
        checksums.add(asset.checksum)
        if (
          !asset.objectPath.startsWith(`products/`) ||
          !asset.objectPath.includes(`/${set.id}/`)
        ) {
          res.status(422).json({
            error: 'validation_failed',
            message: 'Object path does not belong to this set.',
          })
          return
        }
      }

      if (
        (set.mode === '360' || set.mode === 'exterior') &&
        !matchingSequenceDimensions(parsed.data.assets)
      ) {
        res.status(422).json({
          error: 'validation_failed',
          message: 'Rotation frames must share the same dimensions.',
        })
        return
      }

      if (
        !indexesAreContiguous(
          parsed.data.assets.map((asset) => asset.sequenceIndex),
        )
      ) {
        res.status(422).json({
          error: 'validation_failed',
          message: 'Sequence indexes must be contiguous starting at 0 or 1.',
        })
        return
      }

      const rows = parsed.data.assets.map((asset) => ({
        set_id: Number(setId),
        object_path: asset.objectPath,
        original_filename: asset.originalFilename,
        state_key: sanitizeStateKey(asset.stateKey),
        sequence_index: asset.sequenceIndex,
        width: asset.width,
        height: asset.height,
        mime_type: asset.mimeType,
        byte_size: asset.byteSize,
        checksum: asset.checksum,
        alt: asset.alt,
        approval: asset.approval,
      }))

      const { data, error } = await client
        .from('product_media_assets')
        .upsert(rows, { onConflict: 'object_path' })
        .select('id, object_path, state_key, sequence_index, approval')
      if (error) throw new Error(`Could not save assets: ${error.message}`)
      res.status(201).json({ assets: data ?? [] })
    }),
  )

  router.patch(
    '/admin/product-media/sets/:id',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      if (!requireClient(res)) return
      const parsed = productMediaSetPatchSchema.safeParse(req.body)
      const setId = normalizeId(req.params.id)
      if (!parsed.success || !setId) {
        res
          .status(422)
          .json({ error: 'validation_failed', message: 'Invalid update.' })
        return
      }

      const patch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }
      if (parsed.data.startKey) patch.start_key = parsed.data.startKey
      if (parsed.data.direction !== undefined)
        patch.direction = parsed.data.direction
      if (parsed.data.label) patch.label = parsed.data.label

      const { error } = await client
        .from('product_media_sets')
        .update(patch)
        .eq('id', setId)
      if (error) throw new Error(error.message)

      if (parsed.data.assetOrder) {
        const { data: existing, error: existingError } = await client
          .from('product_media_assets')
          .select('id')
          .eq('set_id', setId)
        if (existingError) throw new Error(existingError.message)
        const known = new Set((existing ?? []).map((asset) => Number(asset.id)))
        const order = parsed.data.assetOrder
        if (order.length !== known.size || order.some((id) => !known.has(id))) {
          res.status(422).json({
            error: 'validation_failed',
            message: 'Asset order must include every image in the set once.',
          })
          return
        }
        for (const [index, id] of order.entries()) {
          const { error: bumpError } = await client
            .from('product_media_assets')
            .update({ sequence_index: index + 1000 })
            .eq('id', id)
            .eq('set_id', setId)
          if (bumpError) throw new Error(bumpError.message)
        }
        for (const [index, id] of order.entries()) {
          const { error: orderError } = await client
            .from('product_media_assets')
            .update({ sequence_index: index })
            .eq('id', id)
            .eq('set_id', setId)
          if (orderError) throw new Error(orderError.message)
        }
      }

      for (const asset of parsed.data.assets ?? []) {
        const assetPatch: Record<string, unknown> = {}
        if (asset.sequenceIndex !== undefined)
          assetPatch.sequence_index = asset.sequenceIndex
        if (asset.approval) assetPatch.approval = asset.approval
        if (asset.alt) assetPatch.alt = asset.alt
        if (asset.stateKey) assetPatch.state_key = sanitizeStateKey(asset.stateKey)
        if (Object.keys(assetPatch).length === 0) continue
        const { error: assetError } = await client
          .from('product_media_assets')
          .update(assetPatch)
          .eq('id', asset.id)
          .eq('set_id', setId)
        if (assetError) throw new Error(assetError.message)
      }

      res.json({ message: 'Media set updated.' })
    }),
  )

  router.post(
    '/admin/product-media/sets/:id/publish',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      if (!requireClient(res)) return
      const setId = normalizeId(req.params.id)
      if (!setId) {
        res
          .status(400)
          .json({ error: 'validation_failed', message: 'Missing set id.' })
        return
      }

      const { data: set, error } = await client
        .from('product_media_sets')
        .select(
          'id, model_id, mode, lifecycle, start_key, product_media_assets ( approval, sequence_index, width, height )',
        )
        .eq('id', setId)
        .maybeSingle()
      if (error) throw new Error(error.message)
      if (!set) {
        res
          .status(404)
          .json({ error: 'not_found', message: 'Media set not found.' })
        return
      }

      const assets = set.product_media_assets ?? []
      const approved = assets.filter((asset) => asset.approval === 'approved')
      if (approved.length === 0) {
        res.status(422).json({
          error: 'validation_failed',
          message: 'Publish requires at least one approved image.',
        })
        return
      }
      if (
        !indexesAreContiguous(approved.map((asset) => Number(asset.sequence_index)))
      ) {
        res.status(422).json({
          error: 'validation_failed',
          message: 'Approved images must form a contiguous sequence.',
        })
        return
      }

      await client
        .from('product_media_sets')
        .update({ lifecycle: 'archived', updated_at: new Date().toISOString() })
        .eq('model_id', set.model_id)
        .eq('mode', set.mode)
        .eq('lifecycle', 'published')
        .neq('id', set.id)

      const { error: publishError } = await client
        .from('product_media_sets')
        .update({
          lifecycle: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', set.id)
      if (publishError) throw new Error(publishError.message)
      res.json({ message: 'Media set published.' })
    }),
  )

  router.post(
    '/admin/product-media/sets/:id/archive',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      if (!requireClient(res)) return
      const setId = normalizeId(req.params.id)
      if (!setId) {
        res
          .status(400)
          .json({ error: 'validation_failed', message: 'Missing set id.' })
        return
      }
      const { error } = await client
        .from('product_media_sets')
        .update({ lifecycle: 'archived', updated_at: new Date().toISOString() })
        .eq('id', setId)
      if (error) throw new Error(error.message)
      res.json({ message: 'Media set archived.' })
    }),
  )

  router.delete(
    '/admin/product-media/sets/:id',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      if (!requireClient(res)) return
      const setId = normalizeId(req.params.id)
      if (!setId) {
        res
          .status(400)
          .json({ error: 'validation_failed', message: 'Missing set id.' })
        return
      }
      const { data: set } = await client
        .from('product_media_sets')
        .select('id, lifecycle')
        .eq('id', setId)
        .maybeSingle()
      if (!set || set.lifecycle !== 'draft') {
        res.status(409).json({
          error: 'conflict',
          message: 'Only draft sets can be deleted.',
        })
        return
      }
      const { error } = await client
        .from('product_media_sets')
        .delete()
        .eq('id', setId)
      if (error) throw new Error(error.message)
      res.json({ message: 'Draft media set deleted.' })
    }),
  )

  return router
}
