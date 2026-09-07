import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { parse } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const env = parse(await fs.readFile('.env'))
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL
const client = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const base = 'products/amptron-nira'
const angles = [
  'front',
  'front-left',
  'front-right',
  'left',
  'side',
  'rear',
  'rear-left',
  'rear-three-quarter',
  'top',
]
const manifest = {}
let originalBytes = 0,
  optimizedBytes = 0,
  thumbnailBytes = 0
for (const angle of angles) {
  const name = `amptron-nira-pearl-ivory-${angle}`
  const response = await fetch(
    `${url}/storage/v1/object/public/site-media/${base}/${name}.png`,
  )
  if (!response.ok) throw new Error(`Source ${angle}: HTTP ${response.status}`)
  const source = Buffer.from(await response.arrayBuffer())
  originalBytes += source.length
  const variants = {}
  for (const [variant, width, quality] of [
    ['image', 1440, 85],
    ['thumbnail', 192, 75],
  ]) {
    const bytes = await sharp(source)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer()
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12)
    const path = `${base}/web/${name}-${variant}-${hash}.webp`
    const { error } = await client.storage.from('site-media').upload(path, bytes, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false,
    })
    if (error && !/already exists|duplicate/i.test(error.message))
      throw new Error(`Upload ${angle}: ${error.message}`)
    const check = await fetch(
      `${url}/storage/v1/object/public/site-media/${path}`,
      { method: 'HEAD' },
    )
    if (!check.ok) throw new Error(`Verification failed: ${angle}`)
    variants[variant] = path.slice(base.length + 1)
    if (variant === 'image') optimizedBytes += bytes.length
    else thumbnailBytes += bytes.length
  }
  manifest[angle] = variants
}
await fs.writeFile(
  'src/data/products/nira-web-media.json',
  JSON.stringify(manifest, null, 2) + '\n',
)
console.log(
  JSON.stringify({
    originalBytes,
    optimizedBytes,
    thumbnailBytes,
    images: angles.length,
  }),
)
