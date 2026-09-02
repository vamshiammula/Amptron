import { z } from 'zod'
import { PRODUCT_MEDIA_MODES } from './productMedia.js'

export const productMediaSetCreateSchema = z.object({
  modelSlug: z.string().trim().min(2).max(80),
  mode: z.enum(PRODUCT_MEDIA_MODES),
  label: z.string().trim().min(2).max(80),
})

export const productMediaUploadTargetSchema = z.object({
  files: z
    .array(
      z.object({
        originalFilename: z.string().trim().min(1).max(200),
        stateKey: z.string().trim().min(1).max(80),
        sequenceIndex: z.number().int().min(0).max(360),
        mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
        byteSize: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(72),
})

export const productMediaAssetFinalizeSchema = z.object({
  assets: z
    .array(
      z.object({
        objectPath: z.string().trim().min(8).max(400),
        originalFilename: z.string().trim().min(1).max(200),
        stateKey: z.string().trim().min(1).max(80),
        sequenceIndex: z.number().int().min(0).max(360),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
        byteSize: z.number().int().positive(),
        checksum: z.string().regex(/^[a-f0-9]{64}$/),
        alt: z.string().trim().min(4).max(200),
        approval: z.enum(['approved', 'hold']).default('hold'),
      }),
    )
    .min(1)
    .max(72),
})

export const productMediaSetPatchSchema = z.object({
  startKey: z.string().trim().min(1).max(80).optional(),
  direction: z.enum(['clockwise', 'counterclockwise']).nullable().optional(),
  label: z.string().trim().min(2).max(80).optional(),
  assetOrder: z.array(z.number().int().positive()).min(1).max(72).optional(),
  assets: z
    .array(
      z.object({
        id: z.number().int().positive(),
        sequenceIndex: z.number().int().min(0).max(360).optional(),
        approval: z.enum(['approved', 'hold']).optional(),
        alt: z.string().trim().min(4).max(200).optional(),
        stateKey: z.string().trim().min(1).max(80).optional(),
      }),
    )
    .optional(),
})
