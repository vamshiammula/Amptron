import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'

// Same raster as favicon (16)/favicon.svg. Favicon marks stay the A on a
// transparent field; apple/PWA icons keep an opaque white canvas.
const source = new URL(
  '../reference/approved-brand/amptron-symbol.png',
  import.meta.url,
)
const trimmed = await sharp(source.pathname)
  .trim({ background: '#ffffff', threshold: 20 })
  .ensureAlpha()
  .toBuffer()

async function knockoutWhite(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245) data[i + 3] = 0
  }
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer()
}

const mark = await knockoutWhite(trimmed)
const markMeta = await sharp(mark).metadata()

async function transparentIcon(size) {
  const inset = Math.round(size * 0.08)
  const inner = size - inset * 2
  const resized = await sharp(mark)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png()
    .toBuffer()
}

async function opaqueIcon(size) {
  const inset = Math.round(size * 0.12)
  return sharp(trimmed)
    .resize(size - inset * 2, size - inset * 2, {
      fit: 'contain',
      background: '#ffffff',
    })
    .extend({
      top: inset,
      bottom: inset,
      left: inset,
      right: inset,
      background: '#ffffff',
    })
    .png()
    .toBuffer()
}

await writeFile(
  new URL('../public/favicon-96x96.png', import.meta.url),
  await transparentIcon(96),
)
for (const [name, size] of [
  ['apple-touch-icon.png', 180],
  ['web-app-manifest-192x192.png', 192],
  ['web-app-manifest-512x512.png', 512],
])
  await writeFile(new URL(`../public/${name}`, import.meta.url), await opaqueIcon(size))

const png = await transparentIcon(32)
const header = Buffer.alloc(22)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(1, 4)
header[6] = 32
header[7] = 32
header.writeUInt16LE(1, 10)
header.writeUInt16LE(32, 12)
header.writeUInt32LE(png.length, 14)
header.writeUInt32LE(22, 18)
await writeFile(
  new URL('../public/favicon.ico', import.meta.url),
  Buffer.concat([header, png]),
)

const maxEdge = 512
const scale = maxEdge / Math.max(markMeta.width, markMeta.height)
const svgWidth = Math.round(markMeta.width * scale)
const svgHeight = Math.round(markMeta.height * scale)
const svgMark = await sharp(mark)
  .resize(svgWidth, svgHeight, {
    fit: 'fill',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer()
await writeFile(
  new URL('../public/favicon.svg', import.meta.url),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}"><image width="${svgWidth}" height="${svgHeight}" href="data:image/png;base64,${svgMark.toString('base64')}"/></svg>\n`,
)
console.log('Generated Amptron icons from the approved symbol PNG')
