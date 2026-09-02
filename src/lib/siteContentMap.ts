import type { BlogPost } from '../data/blogPosts'
import type { ScooterModel } from '../data/models'
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

export function mapScooterModel(row: ScooterModelRow): ScooterModel | null {
  const slug = asString(row.slug)
  const name = asString(row.name)
  const image = asString(row.image_url)
  if (!slug || !name || !image) return null

  return {
    slug,
    name,
    tagline: asString(row.tagline),
    description: asString(row.description),
    image,
    featured: asBoolean(row.featured),
    highlights: asLabeledList(row.highlights).map((item) => ({
      label: item.label,
      value: item.value,
      note: item.note ?? '',
    })),
    specs: asLabeledList(row.specs).map(({ label, value }) => ({ label, value })),
    features: asStringArray(row.features),
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
