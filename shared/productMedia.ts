export const PRODUCT_MEDIA_MODES = [
  'exterior',
  'seat',
  'storage',
  'battery',
  'charging',
  'lights',
  'dashboard',
  'features',
  '360',
] as const

export type ProductMediaMode = (typeof PRODUCT_MEDIA_MODES)[number]

export const PRODUCT_MEDIA_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const PRODUCT_MEDIA_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
} as const

export const PRODUCT_MEDIA_MAX_BYTES = 50 * 1024 * 1024

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const STATE_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isProductMediaMode(value: string): value is ProductMediaMode {
  return (PRODUCT_MEDIA_MODES as readonly string[]).includes(value)
}

export function extensionForMime(mimeType: string): string | null {
  if (mimeType === 'image/jpeg') return '.jpg'
  if (mimeType === 'image/png') return '.png'
  if (mimeType === 'image/webp') return '.webp'
  return null
}

export function sanitizeStateKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '')
    .slice(0, 80)
}

export function canonicalObjectPath(input: {
  modelSlug: string
  mode: ProductMediaMode
  setId: string | number
  stateKey: string
  sequenceIndex: number
  mimeType: string
}): string {
  const extension = extensionForMime(input.mimeType)
  if (!extension) {
    throw new Error('Unsupported image type.')
  }
  if (!SLUG_PATTERN.test(input.modelSlug)) {
    throw new Error('Invalid model slug.')
  }
  const stateKey = sanitizeStateKey(input.stateKey)
  if (!STATE_KEY_PATTERN.test(stateKey)) {
    throw new Error('Invalid state key.')
  }
  const folder = `products/${input.modelSlug}/${input.mode}/${input.setId}`
  if (input.mode === '360') {
    const frame = String(input.sequenceIndex).padStart(3, '0')
    return `${folder}/frame-${frame}${extension}`
  }
  if (input.mode === 'exterior') {
    return `${folder}/angle-${stateKey}${extension}`
  }
  return `${folder}/${stateKey}${extension}`
}

export function indexesAreContiguous(indexes: number[]): boolean {
  if (indexes.length === 0) return false
  const sorted = [...indexes].toSorted((a, b) => a - b)
  const start = sorted[0]
  if (start !== 0 && start !== 1) return false
  return sorted.every((value, offset) => value === start + offset)
}

export function validateUploadMeta(input: {
  mimeType: string
  byteSize: number
  width: number
  height: number
  alt: string
  checksum: string
}): string | null {
  if (!extensionForMime(input.mimeType)) return 'Unsupported image type.'
  if (!Number.isInteger(input.byteSize) || input.byteSize <= 0) {
    return 'File size is invalid.'
  }
  if (input.byteSize > PRODUCT_MEDIA_MAX_BYTES) return 'File is larger than 50 MB.'
  if (!Number.isInteger(input.width) || input.width < 1) return 'Width is invalid.'
  if (!Number.isInteger(input.height) || input.height < 1) {
    return 'Height is invalid.'
  }
  if (input.alt.trim().length < 4) return 'Alt text is required.'
  if (!/^[a-f0-9]{64}$/.test(input.checksum)) return 'Checksum must be SHA-256.'
  return null
}

export function matchingSequenceDimensions(
  assets: Array<{ width: number; height: number }>,
): boolean {
  if (assets.length === 0) return false
  const first = assets[0]
  return assets.every(
    (asset) => asset.width === first.width && asset.height === first.height,
  )
}
