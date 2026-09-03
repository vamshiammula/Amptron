/**
 * Uploads scooter photos/videos to the public `site-media` bucket and upserts
 * model, blog, and site-media rows. Amptron logos and icons stay in the repo.
 *
 * Run with: npm run sync:content
 */
import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

loadEnv({ path: path.resolve(import.meta.dirname, '../.env') })

const ROOT = path.resolve(import.meta.dirname, '..')
const BUCKET = 'site-media'
const MIME = {
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
}

const FILES = [
  {
    local: 'src/assets/images/volt.webp',
    remote: 'models/volt.webp',
  },
  {
    local: 'src/assets/images/storm.webp',
    remote: 'models/storm.webp',
  },
  {
    local: 'src/assets/images/cruise.webp',
    remote: 'models/cruise.webp',
  },
  {
    local: 'src/assets/images/hero-scooter.webp',
    remote: 'hero/hero-scooter.webp',
  },
  {
    local: 'src/assets/videos/hero-showcase.mp4',
    remote: 'hero/hero-showcase.mp4',
  },
  {
    local: 'src/assets/images/technical-cutaway.webp',
    remote: 'tech/technical-cutaway.webp',
  },
]

const MODELS = [
  {
    slug: 'amptron-volt',
    name: 'Amptron Volt',
    tagline: 'Smart low-speed commuter for dense city routes.',
    description:
      'Agile, cost-efficient city commuter: easy to own, easy to service, built for short urban hops and high-frequency use.',
    image_path: 'models/volt.webp',
    featured: false,
    sort_order: 1,
    highlights: [
      {
        label: 'Certified Range',
        value: '80 km',
        note: 'Single-charge city coverage',
      },
      {
        label: 'Top Speed',
        value: '25 km/h',
        note: 'Low-speed category compliance',
      },
      {
        label: 'Charge Time',
        value: '3.5 hrs',
        note: 'Fast turnaround between shifts',
      },
    ],
    specs: [
      { label: 'Dimensions (L x W x H)', value: '1810 x 690 x 1120 mm' },
      { label: 'Wheelbase', value: '1290 mm' },
      { label: 'Ground Clearance', value: '165 mm' },
      { label: 'Kerb Weight', value: '89 kg' },
      { label: 'Payload', value: '145 kg' },
      { label: 'Motor Output', value: '1500W BLDC hub motor' },
      { label: 'Battery Type', value: 'Lithium-Ion, AIS 156 Phase 2' },
      { label: 'Battery Capacity', value: '2.0 kWh' },
      { label: 'System Voltage', value: '60V' },
      { label: 'Range Per Charge', value: 'Up to 80 km' },
      { label: 'Charger Input', value: 'AC 180-265V, 50Hz' },
      { label: 'Charger Output', value: '67.2V, 8A' },
      { label: 'Charging Time', value: '3.5 hours' },
      { label: 'Front Suspension', value: 'Telescopic fork' },
      { label: 'Rear Suspension', value: 'Hydraulic dual shock' },
      { label: 'Tyres', value: '90/90-12 tubeless' },
      { label: 'Brakes', value: 'Front disc / rear drum with CBS' },
    ],
    features: [
      'Digital dashboard display',
      'Reverse assist mode',
      'Remote lock/unlock',
      'Mobile charging socket',
      'Side-stand sensor',
      'Regenerative braking support',
    ],
  },
  {
    slug: 'amptron-storm',
    name: 'Amptron Storm',
    tagline: 'Performance-first city and peri-urban scooter.',
    description:
      'High-torque acceleration, rugged suspension, and practical range, built for mixed-terrain commutes and confident test rides.',
    image_path: 'models/storm.webp',
    featured: true,
    sort_order: 2,
    highlights: [
      {
        label: 'Certified Range',
        value: '120 km',
        note: 'Balanced for full-day field work',
      },
      {
        label: 'Top Speed',
        value: '65 km/h',
        note: 'Comfortable city-to-suburban travel',
      },
      {
        label: 'Charge Time',
        value: '4.0 hrs',
        note: 'Optimized for daytime recharge cycles',
      },
    ],
    specs: [
      { label: 'Dimensions (L x W x H)', value: '1860 x 700 x 1135 mm' },
      { label: 'Wheelbase', value: '1325 mm' },
      { label: 'Ground Clearance', value: '170 mm' },
      { label: 'Kerb Weight', value: '95 kg' },
      { label: 'Payload', value: '150 kg' },
      { label: 'Motor Output', value: '2500W BLDC hub motor' },
      { label: 'Battery Type', value: 'Lithium-Ion with smart BMS' },
      { label: 'Battery Capacity', value: '2.65 kWh' },
      { label: 'System Voltage', value: '60V' },
      { label: 'Range Per Charge', value: 'Up to 120 km' },
      { label: 'Charger Input', value: 'AC 180-265V, 50Hz' },
      { label: 'Charger Output', value: '71.4V, 10A' },
      { label: 'Charging Time', value: '4.0 hours' },
      { label: 'Front Suspension', value: 'Telescopic fork' },
      { label: 'Rear Suspension', value: 'Swing arm with gas shock' },
      { label: 'Tyres', value: '90/90-12 tubeless' },
      { label: 'Brakes', value: 'Disc + drum with CBS' },
    ],
    features: [
      'Keyless start',
      'Ride modes (Eco, City, Power)',
      'Digital TFT console',
      'Anti-theft alarm',
      'Regenerative braking',
      'USB charging and navigation mount',
    ],
  },
  {
    slug: 'amptron-cruise',
    name: 'Amptron Cruise',
    tagline: 'Long-range flagship for all-day rides.',
    description:
      'A comfort-focused long-range scooter for extended commutes, road presence, and confident highway stretches.',
    image_path: 'models/cruise.webp',
    featured: false,
    sort_order: 3,
    highlights: [
      {
        label: 'Certified Range',
        value: '150 km',
        note: 'Extended touring capability',
      },
      { label: 'Top Speed', value: '80 km/h', note: 'Fast regional mobility' },
      {
        label: 'Charge Time',
        value: '4.5 hrs',
        note: 'High-capacity pack recharge',
      },
    ],
    specs: [
      { label: 'Dimensions (L x W x H)', value: '1900 x 720 x 1150 mm' },
      { label: 'Wheelbase', value: '1350 mm' },
      { label: 'Ground Clearance', value: '175 mm' },
      { label: 'Kerb Weight', value: '102 kg' },
      { label: 'Payload', value: '155 kg' },
      { label: 'Motor Output', value: '3200W BLDC hub motor' },
      { label: 'Battery Type', value: 'Advanced Lithium-Ion' },
      { label: 'Battery Capacity', value: '3.4 kWh' },
      { label: 'System Voltage', value: '72V' },
      { label: 'Range Per Charge', value: 'Up to 150 km' },
      { label: 'Charger Input', value: 'AC 180-265V, 50Hz' },
      { label: 'Charger Output', value: '84V, 10A' },
      { label: 'Charging Time', value: '4.5 hours' },
      { label: 'Front Suspension', value: 'Telescopic hydraulic' },
      { label: 'Rear Suspension', value: 'Mono-shock adjustable' },
      { label: 'Tyres', value: '100/80-12 tubeless' },
      { label: 'Brakes', value: 'Dual disc with CBS' },
    ],
    features: [
      'Cruise control',
      'Smart dashboard with telemetry',
      'Reverse mode',
      'Keyless proximity unlock',
      'Wide floorboard and pillion comfort kit',
      'Remote diagnostics readiness',
    ],
  },
]

const POSTS = [
  {
    slug: 'dealer-playbook-for-tier-2-cities',
    title: 'Dealer Playbook for Tier-2 EV Markets',
    excerpt:
      'A practical guide to launch EV retail in emerging cities with strong service readiness and demand planning.',
    published_at: '2026-08-20T00:00:00.000Z',
  },
  {
    slug: 'how-to-run-high-conversion-test-rides',
    title: 'How to Run High-Conversion Test Ride Events',
    excerpt:
      'Tactics for showroom owners to improve walk-in to booking conversion through structured test ride programs.',
    published_at: '2026-08-12T00:00:00.000Z',
  },
  {
    slug: 'battery-safety-service-readiness-checklist',
    title: 'Battery Safety and Service Readiness Checklist',
    excerpt:
      'What every workshop should validate before scaling EV volumes in high-temperature regions.',
    published_at: '2026-07-30T00:00:00.000Z',
  },
]

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env and fill it in.`)
  }
  return value
}

function publicUrl(supabase, objectPath) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath)
  return data.publicUrl
}

async function uploadFile(supabase, localRel, remotePath) {
  const localPath = path.join(ROOT, localRel)
  const body = await readFile(localPath)
  const contentType = MIME[path.extname(localRel).toLowerCase()]
  if (!contentType) {
    throw new Error(`No MIME type mapped for ${localRel}`)
  }

  const { error } = await supabase.storage.from(BUCKET).upload(remotePath, body, {
    contentType,
    upsert: true,
    cacheControl: '31536000',
  })
  if (error) throw new Error(`Upload failed for ${remotePath}: ${error.message}`)
  return publicUrl(supabase, remotePath)
}

async function main() {
  const url = requireEnv('SUPABASE_URL')
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  console.log(`Uploading ${FILES.length} files to ${BUCKET}…`)
  const urls = {}
  for (const file of FILES) {
    const uploaded = await uploadFile(supabase, file.local, file.remote)
    urls[file.remote] = uploaded
    console.log(`  ${file.remote}`)
  }

  const { error: modelsError } = await supabase.from('scooter_models').upsert(
    MODELS.map((model) => ({
      slug: model.slug,
      name: model.name,
      tagline: model.tagline,
      description: model.description,
      image_url: urls[model.image_path],
      featured: model.featured,
      published: true,
      sort_order: model.sort_order,
      highlights: model.highlights,
      specs: model.specs,
      features: model.features,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: 'slug' },
  )
  if (modelsError)
    throw new Error(`scooter_models upsert failed: ${modelsError.message}`)

  const { error: postsError } = await supabase.from('blog_posts').upsert(
    POSTS.map((post) => ({
      ...post,
      body: '',
      published: true,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: 'slug' },
  )
  if (postsError) throw new Error(`blog_posts upsert failed: ${postsError.message}`)

  const { error: mediaError } = await supabase.from('site_media').upsert(
    [
      {
        key: 'hero_video',
        url: urls['hero/hero-showcase.mp4'],
        alt: 'Amptron electric scooter product showcase',
        kind: 'video',
        updated_at: new Date().toISOString(),
      },
      {
        key: 'hero_poster',
        url: urls['hero/hero-scooter.webp'],
        alt: 'Amptron electric scooter',
        kind: 'image',
        updated_at: new Date().toISOString(),
      },
      {
        key: 'tech_cutaway',
        url: urls['tech/technical-cutaway.webp'],
        alt: 'Technical cutaway of an Amptron electric scooter',
        kind: 'image',
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: 'key' },
  )
  if (mediaError) throw new Error(`site_media upsert failed: ${mediaError.message}`)

  console.log('Done. Models, blog posts, and site media are in Supabase.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
