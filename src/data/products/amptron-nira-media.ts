/**
 * Public NIRA media hosted in the `site-media` bucket.
 * Replace a file at the same object path to update the site.
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
  hero: `${NIRA_MEDIA_BASE}/amptron-nira-pearl-ivory-front-left.png`,
  studio: {
    front: `${NIRA_MEDIA_BASE}/amptron-nira-pearl-ivory-front.png`,
    frontLeft: `${NIRA_MEDIA_BASE}/amptron-nira-pearl-ivory-front-left.png`,
    frontRight: `${NIRA_MEDIA_BASE}/amptron-nira-pearl-ivory-front-right.png`,
    left: `${NIRA_MEDIA_BASE}/amptron-nira-pearl-ivory-left.png`,
    side: `${NIRA_MEDIA_BASE}/amptron-nira-pearl-ivory-side.png`,
    rear: `${NIRA_MEDIA_BASE}/amptron-nira-pearl-ivory-rear.png`,
    rearLeft: `${NIRA_MEDIA_BASE}/amptron-nira-pearl-ivory-rear-left.png`,
    rearThreeQuarter: `${NIRA_MEDIA_BASE}/amptron-nira-pearl-ivory-rear-three-quarter.png`,
    top: `${NIRA_MEDIA_BASE}/amptron-nira-pearl-ivory-top.png`,
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
export const niraPhotos = [
  { src: niraMedia.studio.frontLeft, label: 'Front three-quarter' },
  { src: niraMedia.studio.front, label: 'Front' },
  { src: niraMedia.studio.frontRight, label: 'Opposite front angle' },
  { src: niraMedia.studio.side, label: 'Side profile' },
  { src: niraMedia.studio.rearThreeQuarter, label: 'Rear three-quarter' },
  { src: niraMedia.studio.rear, label: 'Rear' },
  { src: niraMedia.studio.rearLeft, label: 'Opposite rear angle' },
  { src: niraMedia.studio.left, label: 'Opposite side profile' },
  { src: niraMedia.studio.top, label: 'Top' },
]
