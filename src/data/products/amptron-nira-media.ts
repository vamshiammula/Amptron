import webMedia from './nira-web-media.json'
/**
 * Public NIRA media hosted in the `site-media` bucket.
 * Web derivatives use content-hashed paths for long-lived caching; preserve originals.
 * Run scripts/optimize-nira-media.mjs after approving replacement source photos.
 *
 * Studio stills currently on the page:
 *   amptron-nira-pearl-ivory-front.png
 *   amptron-nira-pearl-ivory-front-left.png
 *   amptron-nira-pearl-ivory-front-right.png
 *   amptron-nira-pearl-ivory-left.png
 *   amptron-nira-pearl-ivory-side.png
 *   amptron-nira-pearl-ivory-rear.png
 *   amptron-nira-pearl-ivory-rear-left.png
 *   amptron-nira-pearl-ivory-rear-three-quarter.png
 *   amptron-nira-pearl-ivory-top.png
 *   amptron-nira.glb
 *   amptron-nira-film.mp4
 *
 * Lifestyle / cutaway slots (upload a file to replace the empty path):
 *   amptron-nira-neighbourhood.jpg
 *   amptron-nira-front-left-riding.jpg
 *   amptron-nira-underfloor-battery-cutaway.jpg
 *   amptron-nira-seat-open-helmets.jpg
 *   amptron-nira-battery-and-charger.jpg
 *   amptron-nira-service-exploded.jpg
 */
const SUPABASE_URL = (
  import.meta.env.VITE_SUPABASE_URL || 'https://qidjcznsxcqmtrkooirm.supabase.co'
).replace(/\/$/, '')

export const NIRA_MEDIA_BASE = `${SUPABASE_URL}/storage/v1/object/public/site-media/products/amptron-nira`

export const niraMedia = {
  video: `${NIRA_MEDIA_BASE}/amptron-nira-film.mp4`,
  model3d: `${NIRA_MEDIA_BASE}/amptron-nira.glb`,
  hero: `${NIRA_MEDIA_BASE}/${webMedia['front-left'].image}`,
  studio: {
    front: `${NIRA_MEDIA_BASE}/${webMedia['front'].image}`,
    frontLeft: `${NIRA_MEDIA_BASE}/${webMedia['front-left'].image}`,
    frontRight: `${NIRA_MEDIA_BASE}/${webMedia['front-right'].image}`,
    left: `${NIRA_MEDIA_BASE}/${webMedia['left'].image}`,
    side: `${NIRA_MEDIA_BASE}/${webMedia['side'].image}`,
    rear: `${NIRA_MEDIA_BASE}/${webMedia['rear'].image}`,
    rearLeft: `${NIRA_MEDIA_BASE}/${webMedia['rear-left'].image}`,
    rearThreeQuarter: `${NIRA_MEDIA_BASE}/${webMedia['rear-three-quarter'].image}`,
    top: `${NIRA_MEDIA_BASE}/${webMedia['top'].image}`,
  },
  chapters: {
    neighbourhood: `${NIRA_MEDIA_BASE}/amptron-nira-neighbourhood.jpg`,
    frontLeftRiding: `${NIRA_MEDIA_BASE}/amptron-nira-front-left-riding.jpg`,
    batteryCutaway: `${NIRA_MEDIA_BASE}/amptron-nira-underfloor-battery-cutaway.jpg`,
    seatOpenHelmets: `${NIRA_MEDIA_BASE}/amptron-nira-seat-open-helmets.jpg`,
    batteryAndCharger: `${NIRA_MEDIA_BASE}/amptron-nira-battery-and-charger.jpg`,
    serviceExploded: `${NIRA_MEDIA_BASE}/amptron-nira-service-exploded.jpg`,
  },
} as const

/** Approved website gallery; ordering starts with the hero, then walks around NIRA. */
const galleryViews = [
  ['front-left', 'Front three-quarter'],
  ['front', 'Front'],
  ['front-right', 'Opposite front angle'],
  ['side', 'Side profile'],
  ['rear-three-quarter', 'Rear three-quarter'],
  ['rear', 'Rear'],
  ['rear-left', 'Opposite rear angle'],
  ['left', 'Opposite side profile'],
  ['top', 'Top'],
] as const

export const niraPhotos = galleryViews.map(([angle, label]) => ({
  src: `${NIRA_MEDIA_BASE}/${webMedia[angle].image}`,
  thumbnail: `${NIRA_MEDIA_BASE}/${webMedia[angle].thumbnail}`,
  label,
}))

/** Only replace approved NIRA originals; unrelated catalog uploads pass through. */
export function optimizedNiraImage(src: string): string {
  for (const [angle, variants] of Object.entries(webMedia)) {
    if (src === `${NIRA_MEDIA_BASE}/amptron-nira-pearl-ivory-${angle}.png`) {
      return `${NIRA_MEDIA_BASE}/${variants.image}`
    }
  }
  return src
}
