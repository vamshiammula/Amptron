import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const files = [
  [
    'public/products/amptron-nira/amptron-nira-pearl-ivory-front.png',
    'products/amptron-nira/amptron-nira-pearl-ivory-front.png',
    'image/png',
  ],
  [
    'public/products/amptron-nira/amptron-nira-pearl-ivory-front-left.png',
    'products/amptron-nira/amptron-nira-pearl-ivory-front-left.png',
    'image/png',
  ],
  [
    'public/products/amptron-nira/amptron-nira-pearl-ivory-front-right.png',
    'products/amptron-nira/amptron-nira-pearl-ivory-front-right.png',
    'image/png',
  ],
  [
    'public/products/amptron-nira/amptron-nira-pearl-ivory-left.png',
    'products/amptron-nira/amptron-nira-pearl-ivory-left.png',
    'image/png',
  ],
  [
    'public/products/amptron-nira/amptron-nira-pearl-ivory-side.png',
    'products/amptron-nira/amptron-nira-pearl-ivory-side.png',
    'image/png',
  ],
  [
    'public/products/amptron-nira/amptron-nira-pearl-ivory-rear.png',
    'products/amptron-nira/amptron-nira-pearl-ivory-rear.png',
    'image/png',
  ],
  [
    'public/products/amptron-nira/amptron-nira-pearl-ivory-rear-left.png',
    'products/amptron-nira/amptron-nira-pearl-ivory-rear-left.png',
    'image/png',
  ],
  [
    'public/products/amptron-nira/amptron-nira-pearl-ivory-rear-three-quarter.png',
    'products/amptron-nira/amptron-nira-pearl-ivory-rear-three-quarter.png',
    'image/png',
  ],
  [
    'public/products/amptron-nira/amptron-nira-pearl-ivory-top.png',
    'products/amptron-nira/amptron-nira-pearl-ivory-top.png',
    'image/png',
  ],
  [
    'public/products/amptron-nira/amptron-nira-film.mp4',
    'products/amptron-nira/amptron-nira-film.mp4',
    'video/mp4',
  ],
  [
    'tmp/amptron-nira.glb',
    'products/amptron-nira/amptron-nira.glb',
    'model/gltf-binary',
  ],
]

const uploaded = []
for (const [source, objectPath, contentType] of files) {
  const body = await readFile(path.resolve(source))
  const { error } = await supabase.storage
    .from('site-media')
    .upload(objectPath, body, {
      upsert: true,
      contentType,
      cacheControl: '31536000',
    })
  if (error) {
    console.error(`Failed ${objectPath}: ${error.message}`)
    process.exit(1)
  }
  const { data } = supabase.storage.from('site-media').getPublicUrl(objectPath)
  uploaded.push({ path: objectPath, url: data.publicUrl, bytes: body.byteLength })
  console.log(`uploaded ${objectPath} (${body.byteLength} bytes)`)
}

console.log(JSON.stringify({ count: uploaded.length, uploaded }, null, 2))
