import type { ProductViewerConfig } from '../data/products/types'
import { stormViewerConfig } from '../data/products/amptron-storm'
import { enabledExperiences } from './productViewerMath'
import type { ProductExperience, ProductMediaAsset } from '../data/products/types'

export const LOCAL_PRODUCT_VIEWERS: Record<string, ProductViewerConfig> = {
  [stormViewerConfig.modelSlug]: stormViewerConfig,
}

export interface ProductMediaSetRow {
  id: unknown
  mode: unknown
  label: unknown
  lifecycle: unknown
  start_key: unknown
  scooter_models?: { slug?: unknown } | { slug?: unknown }[] | null
  product_media_assets?: ProductMediaAssetRow[] | null
}

export interface ProductMediaAssetRow {
  object_path: unknown
  state_key: unknown
  sequence_index: unknown
  alt: unknown
  width: unknown
  height: unknown
  approval: unknown
  hotspots: unknown
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function modelSlugFromRow(row: ProductMediaSetRow): string {
  const related = row.scooter_models
  if (Array.isArray(related)) return asString(related[0]?.slug)
  return asString(related?.slug)
}

function mapHotspots(
  value: unknown,
  publicUrl: (path: string) => string,
): ProductMediaAsset['hotspots'] {
  if (!Array.isArray(value)) return undefined
  const hotspots = value.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return []
    const row = item as {
      id?: unknown
      x?: unknown
      y?: unknown
      title?: unknown
      description?: unknown
      specLabel?: unknown
      imageSrc?: unknown
    }
    const id = asString(row.id)
    const title = asString(row.title)
    if (!id || !title) return []
    const imageSrc = asString(row.imageSrc)
    return [
      {
        id,
        x: asNumber(row.x),
        y: asNumber(row.y),
        title,
        description: asString(row.description),
        specLabel: asString(row.specLabel) || undefined,
        imageSrc: imageSrc ? publicUrl(imageSrc) : undefined,
      },
    ]
  })
  return hotspots.length > 0 ? hotspots : undefined
}

export function mapPublishedViewerConfigs(
  rows: ProductMediaSetRow[],
  publicUrl: (objectPath: string) => string,
  fallback: Record<string, ProductViewerConfig>,
): Record<string, ProductViewerConfig> {
  const next: Record<string, ProductViewerConfig> = { ...fallback }

  for (const row of rows) {
    const slug = modelSlugFromRow(row)
    const mode = asString(row.mode)
    const base = next[slug]
    if (!slug || !mode || !base) continue

    const assets = (row.product_media_assets ?? [])
      .filter((asset) => asString(asset.approval) === 'approved')
      .toSorted((a, b) => asNumber(a.sequence_index) - asNumber(b.sequence_index))
      .map((asset) => {
        const objectPath = asString(asset.object_path)
        const mapped: ProductMediaAsset = {
          src: publicUrl(objectPath),
          stateKey: asString(asset.state_key),
          alt: asString(asset.alt),
          width: asNumber(asset.width) || 1024,
          height: asNumber(asset.height) || 1024,
          hotspots: mapHotspots(asset.hotspots, publicUrl),
        }
        return mapped
      })
      .filter((asset) => asset.src && asset.stateKey)

    if (assets.length === 0) continue

    next[slug] = {
      ...base,
      experiences: base.experiences.map((experience) => {
        if (experience.id !== mode) return experience
        const updated: ProductExperience = {
          ...experience,
          enabled: true,
          startKey: asString(row.start_key) || experience.startKey,
          assets,
          label: asString(row.label) || experience.label,
        }
        return updated
      }),
    }
  }

  return Object.fromEntries(
    Object.entries(next).map(([slug, config]) => [
      slug,
      {
        ...config,
        experiences: enabledExperiences(config.experiences).length
          ? config.experiences
          : config.experiences,
      },
    ]),
  )
}
