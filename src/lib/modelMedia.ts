import cutaway from '../assets/images/technical-cutaway.webp'
import type { ModelStory, ScooterModel } from '../data/models'
import type { ProductViewerConfig } from '../data/products/types'

/** Which viewer experiences best illustrate a story chapter, by eyebrow. */
const CHAPTER_PREFERENCES: Record<string, string[]> = {
  range: ['battery', 'exterior'],
  battery: ['battery'],
  charging: ['charging', 'battery'],
  speed: ['exterior'],
  ride: ['exterior', 'dashboard'],
  comfort: ['seat', 'exterior'],
  ownership: ['seat', 'storage', 'exterior'],
  category: ['exterior'],
  service: ['battery', 'exterior'],
}

const CUTAWAY_EYEBROWS = new Set(['charging', 'service', 'battery'])

function galleryByExperience(viewer?: ProductViewerConfig) {
  const gallery: Record<string, string[]> = {}
  if (!viewer) return gallery
  for (const experience of viewer.experiences) {
    if (!experience.enabled || experience.assets.length === 0) continue
    gallery[experience.id] = experience.assets.map((asset) => asset.src)
  }
  return gallery
}

/**
 * Give each story chapter its own image. Uses the published viewer assets
 * when the model has them, otherwise alternates the catalogue photo with the
 * technical cutaway so no two adjacent chapters repeat.
 */
export interface ChapterImage {
  src: string
  alt: string
  /** Studio viewer frames are 1:1; catalogue stills are 3:2. */
  ratio: '1 / 1' | '3 / 2' | '4 / 3'
}

export function chapterImages(
  model: ScooterModel,
  viewer?: ProductViewerConfig,
): ChapterImage[] {
  const chapters: ModelStory[] = model.story ?? []
  const gallery = galleryByExperience(viewer)
  const used = new Set<string>()

  return chapters.map((chapter, index) => {
    if (chapter.image) {
      return {
        src: chapter.image,
        alt: chapter.imageAlt ?? chapter.title,
        ratio: '4 / 3',
      }
    }
    const key = chapter.eyebrow.toLowerCase()
    const preferred = CHAPTER_PREFERENCES[key] ?? ['exterior']
    const candidates = [...preferred, ...Object.keys(gallery)].flatMap(
      (id) => gallery[id] ?? [],
    )
    const pick = candidates.find((src) => !used.has(src))
    if (pick) {
      used.add(pick)
      return { src: pick, alt: `${model.name}: ${chapter.title}`, ratio: '1 / 1' }
    }
    const fallback =
      CUTAWAY_EYEBROWS.has(key) || index % 2 === 1 ? cutaway : model.image
    return {
      src: fallback,
      alt:
        fallback === cutaway
          ? `Technical cutaway of an Amptron electric scooter`
          : `${model.name} electric scooter`,
      ratio: '3 / 2',
    }
  })
}

/** Hero-quality still for a model: first exterior viewer frame, else catalogue photo. */
export function heroStill(model: ScooterModel, viewer?: ProductViewerConfig) {
  const exterior = viewer?.experiences.find(
    (experience) => experience.id === 'exterior' && experience.enabled,
  )
  const start = exterior?.assets.find(
    (asset) => asset.stateKey === exterior.startKey,
  )
  return start?.src ?? exterior?.assets[0]?.src ?? model.image
}
