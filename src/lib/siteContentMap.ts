import type { BlogPost } from '../data/blogPosts'
import type { ModelColour, ModelStory, ScooterModel } from '../data/models'
import type { ProductViewerConfig } from '../data/products/types'

export interface SiteMediaMap {
  heroVideo: string
  heroPoster: string
  techCutaway: string
}

export interface SiteContentValue {
  models: ScooterModel[]
  posts: BlogPost[]
  media: SiteMediaMap
  productViewers: Record<string, ProductViewerConfig>
}

export interface ScooterModelRow {
  slug: unknown
  name: unknown
  tagline: unknown
  description: unknown
  image_url: unknown
  featured: unknown
  highlights: unknown
  specs: unknown
  features: unknown
  price_inr?: unknown
  price_placeholder?: unknown
  colours?: unknown
  story?: unknown
  video_url?: unknown
}

export interface BlogPostRow {
  slug: unknown
  title: unknown
  excerpt: unknown
  published_at: unknown
}

export interface SiteMediaRow {
  key: unknown
  url: unknown
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asBoolean(value: unknown): boolean {
  return value === true
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function asLabeledList(
  value: unknown,
): Array<{ label: string; value: string; note?: string }> {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return []
    const row = item as { label?: unknown; value?: unknown; note?: unknown }
    const label = asString(row.label)
    const entry = asString(row.value)
    if (!label || !entry) return []
    const note = asString(row.note)
    return note ? [{ label, value: entry, note }] : [{ label, value: entry }]
  })
}

function asColours(value: unknown): ModelColour[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return []
    const row = item as { name?: unknown; hex?: unknown; image?: unknown }
    const name = asString(row.name)
    const hex = asString(row.hex)
    if (!name || !hex) return []
    const image = asString(row.image)
    return image ? [{ name, hex, image }] : [{ name, hex }]
  })
}

function asStory(value: unknown): ModelStory[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return []
    const row = item as {
      eyebrow?: unknown
      title?: unknown
      body?: unknown
      image?: unknown
      imageAlt?: unknown
    }
    const title = asString(row.title)
    const body = asString(row.body)
    if (!title || !body) return []
    return [
      {
        eyebrow: asString(row.eyebrow),
        title,
        body,
        image: asString(row.image) || undefined,
        imageAlt: asString(row.imageAlt) || undefined,
      },
    ]
  })
}

function parseKwh(specs: Array<{ label: string; value: string }>): number {
  const row = specs.find((item) => item.label === 'Battery Capacity')
  const match = row?.value.match(/([\d.]+)\s*kWh/i)
  return match ? Number(match[1]) : 0
}

function parseRangeKm(
  highlights: Array<{ label: string; value: string }>,
  specs: Array<{ label: string; value: string }>,
): number {
  const row =
    highlights.find((item) => item.label === 'Certified Range') ??
    specs.find((item) => item.label === 'Range Per Charge')
  const match = row?.value.match(/(\d+)/)
  return match ? Number(match[1]) : 0
}

export function mapScooterModel(row: ScooterModelRow): ScooterModel | null {
  const slug = asString(row.slug)
  const name = asString(row.name)
  const image = asString(row.image_url)
  if (!slug || !name || !image) return null

  const highlights = asLabeledList(row.highlights).map((item) => ({
    label: item.label,
    value: item.value,
    note: item.note ?? '',
  }))
  const specs = asLabeledList(row.specs).map(({ label, value }) => ({
    label,
    value,
  }))
  const price = asNumber(row.price_inr)
  const colours = asColours(row.colours)
  const story = asStory(row.story)
  const video = asString(row.video_url)

  return {
    slug,
    name,
    tagline: asString(row.tagline),
    description: asString(row.description),
    image,
    featured: asBoolean(row.featured),
    highlights,
    specs,
    features: asStringArray(row.features),
    batteryKwh: parseKwh(specs),
    certifiedRangeKm: parseRangeKm(highlights, specs),
    pricing: price
      ? {
          exShowroomInr: price,
          placeholder: row.price_placeholder !== false,
        }
      : undefined,
    colours: colours.length > 0 ? colours : undefined,
    story: story.length > 0 ? story : undefined,
    video: video || undefined,
  }
}

export function mergeLocalModel(
  remote: ScooterModel,
  local: ScooterModel | undefined,
): ScooterModel {
  if (!local) return remote
  return {
    ...local,
    ...remote,
    batteryKwh: remote.batteryKwh || local.batteryKwh,
    certifiedRangeKm: remote.certifiedRangeKm || local.certifiedRangeKm,
    pricing: remote.pricing ?? local.pricing,
    colours: remote.colours ?? local.colours,
    story: remote.story ?? local.story,
    video: remote.video ?? local.video,
  }
}

export function mapBlogPost(row: BlogPostRow): BlogPost | null {
  const slug = asString(row.slug)
  const title = asString(row.title)
  const publishedAt = asString(row.published_at)
  if (!slug || !title || !publishedAt) return null
  return {
    slug,
    title,
    excerpt: asString(row.excerpt),
    publishedAt: publishedAt.slice(0, 10),
  }
}

export function mapSiteMedia(
  rows: SiteMediaRow[],
  fallback: SiteMediaMap,
): SiteMediaMap {
  const byKey = new Map(
    rows.map((row) => [asString(row.key), asString(row.url)] as const),
  )
  return {
    heroVideo: byKey.get('hero_video') || fallback.heroVideo,
    heroPoster: byKey.get('hero_poster') || fallback.heroPoster,
    techCutaway: byKey.get('tech_cutaway') || fallback.techCutaway,
  }
}
