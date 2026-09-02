/**
 * Turns the raw design exports in src/assets/raw into web-sized WebP files in
 * src/assets/images. Favicons are the exported pack already in public/.
 *
 * Run with: npm run images
 *
 * Widths are ~2x the largest CSS display size so the assets stay crisp on
 * high-DPI screens without shipping 4K exports to the browser.
 */
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const RAW_DIR = path.join(ROOT, 'src/assets/raw')
const OUT_DIR = path.join(ROOT, 'src/assets/images')

/**
 * Target width per asset. Anything not listed is skipped.
 *
 * `trim` strips surrounding transparency. The logo export is mostly empty
 * canvas (3249x764 of artwork inside 4096x2286), which otherwise forces the
 * layout to reserve space for padding that nobody can see.
 */
const TARGETS = {
  'logo.png': { width: 800, trim: true },
  'hero-scooter.png': { width: 1200 },
  'technical-cutaway.png': { width: 1200 },
  'volt.png': { width: 900 },
  'storm.png': { width: 900 },
  'cruise.png': { width: 900 },
}

function isMintAccent(r, g, b) {
  return g > r + 25 && g > b + 15 && g > 90
}

/**
 * The dark-background lockup is navy ink on black. The footer is already navy,
 * so we knock out the black plate and turn the remaining ink white while
 * keeping the mint swoosh.
 */
async function generateLightLogo() {
  const source = path.join(RAW_DIR, 'logo-on-dark.png')
  const target = path.join(OUT_DIR, 'logo-light.webp')

  const { data, info } = await sharp(source)
    .trim({ threshold: 8 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    if (isMintAccent(r, g, b)) continue

    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
    if (luminance <= 8) {
      data[i + 3] = 0
      continue
    }

    data[i] = 255
    data[i + 1] = 255
    data[i + 2] = 255
    data[i + 3] = a
  }

  const { data: buffer, info: outInfo } = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 92, effort: 6, alphaQuality: 100 })
    .toBuffer({ resolveWithObject: true })

  await writeFile(target, buffer)
  console.log(
    `  ${'logo-light.webp'.padEnd(24)} ${outInfo.width}x${outInfo.height}  ${formatBytes(buffer.length)}`,
  )
}

function formatBytes(bytes) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
    : `${Math.round(bytes / 1024)} KB`
}

async function optimizeImages() {
  await mkdir(OUT_DIR, { recursive: true })

  const files = (await readdir(RAW_DIR)).filter((file) => file in TARGETS)
  let rawTotal = 0
  let outTotal = 0

  for (const file of files) {
    const source = path.join(RAW_DIR, file)
    const target = path.join(OUT_DIR, `${path.parse(file).name}.webp`)

    let pipeline = sharp(source)
    if (TARGETS[file].trim) pipeline = pipeline.trim({ threshold: 10 })

    if (file === 'logo.png') {
      const { data, info: rawInfo } = await pipeline
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        if (isMintAccent(r, g, b)) continue
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
        if (luminance >= 242) data[i + 3] = 0
      }

      pipeline = sharp(data, {
        raw: { width: rawInfo.width, height: rawInfo.height, channels: 4 },
      })
    }

    const { data: buffer, info } = await pipeline
      .resize({ width: TARGETS[file].width, withoutEnlargement: true })
      .webp({
        quality: file === 'logo.png' ? 92 : 82,
        effort: 6,
        alphaQuality: 100,
      })
      .toBuffer({ resolveWithObject: true })

    await writeFile(target, buffer)

    const rawSize = (await stat(source)).size
    rawTotal += rawSize
    outTotal += buffer.length
    console.log(
      `  ${file.padEnd(24)} ${formatBytes(rawSize).padStart(9)} -> ${formatBytes(buffer.length).padStart(8)}  ${path.basename(target)} (${info.width}x${info.height})`,
    )
  }

  return { rawTotal, outTotal, count: files.length }
}

async function main() {
  console.log('Optimizing images...')
  const { rawTotal, outTotal, count } = await optimizeImages()

  console.log('\nDeriving light logo...')
  await generateLightLogo()

  console.log(
    '\nFavicons are the exported pack in public/ (favicon.svg, .ico, PNG icons).',
  )

  if (count > 0) {
    const saved = Math.round((1 - outTotal / rawTotal) * 100)
    console.log(
      `\nDone. ${count} images: ${formatBytes(rawTotal)} -> ${formatBytes(outTotal)} (${saved}% smaller).`,
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
