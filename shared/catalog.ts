import { z } from 'zod'

const text = z.string().trim().max(2000)
// Media must be hosted by this app or in its configured storage bucket.
export const mediaUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (!value) return true
    if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\'))
      return true
    try {
      return new URL(value).protocol === 'https:'
    } catch {
      return false
    }
  }, 'Use a relative path or an HTTPS media URL.')
export const catalogSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Use lowercase letters, numbers and hyphens.',
      )
      .min(2)
      .max(80),
    name: z.string().trim().min(2).max(80),
    tagline: text,
    description: text,
    image_url: mediaUrl,
    video_url: mediaUrl,
    captions_url: mediaUrl.default(''),
    model_3d_url: mediaUrl.refine(
      (value) => !value || /\.glb(?:[?#]|$)/i.test(value),
      'Use a GLB model file.',
    ),
    media_ready: z.boolean(),
    featured: z.boolean(),
    published: z.boolean(),
    sort_order: z.number().int().min(0).max(10000),
    price_inr: z.number().positive().nullable(),
    price_placeholder: z.boolean(),
    battery_kwh: z.number().nonnegative().max(200),
    certified_range_km: z.number().nonnegative().max(2000),
    highlights: z.array(z.object({ label: text, value: text, note: text })).max(12),
    specs: z.array(z.object({ label: text, value: text })).max(60),
    features: z.array(text).max(30),
    colours: z
      .array(z.object({ name: text, hex: z.string().regex(/^#[0-9a-f]{6}$/i) }))
      .max(20),
    story: z.array(z.object({ eyebrow: text, title: text, body: text })).max(12),
  })
  .refine(
    (value) =>
      !value.published ||
      Boolean(
        value.tagline &&
        value.description &&
        value.highlights.some((item) => item.label.trim() && item.value.trim()),
      ),
    {
      message:
        'Before publishing, add a tagline, description and at least one specification highlight.',
      path: ['published'],
    },
  )

export type CatalogEntry = z.infer<typeof catalogSchema>
export const MODEL_TEMPLATES = [
  {
    id: 'everyday',
    name: 'Everyday scooter',
    detail: 'A clean model page with range, speed and charging highlights.',
  },
  {
    id: 'extended',
    name: 'Extended specification',
    detail: 'Adds battery, comfort and ownership story sections.',
  },
  {
    id: 'blank',
    name: 'Blank model',
    detail: 'Start with your own specification and page content.',
  },
] as const

export function createModelTemplate(template = 'everyday'): CatalogEntry {
  return {
    slug: '',
    name: '',
    tagline: '',
    description: '',
    image_url: '',
    video_url: '',
    captions_url: '',
    model_3d_url: '',
    media_ready: false,
    featured: false,
    published: false,
    sort_order: 0,
    price_inr: null,
    price_placeholder: true,
    battery_kwh: 0,
    certified_range_km: 0,
    highlights:
      template === 'blank'
        ? []
        : ['Range', 'Top speed', 'Charging time'].map((label) => ({
            label,
            value: '',
            note: '',
          })),
    specs: [],
    features: [],
    colours: [],
    story:
      template === 'extended'
        ? ['Battery', 'Comfort', 'Ownership'].map((eyebrow) => ({
            eyebrow,
            title: '',
            body: '',
          }))
        : [],
  }
}

export function duplicateModel(entry: CatalogEntry): CatalogEntry {
  return {
    ...structuredClone(entry),
    slug: `${entry.slug.slice(0, 65)}-copy`,
    name: `${entry.name.slice(0, 70)} copy`,
    published: false,
    featured: false,
  }
}
