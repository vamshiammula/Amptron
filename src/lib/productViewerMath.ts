export function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0
  return ((index % length) + length) % length
}

export function neighborIndexes(index: number, length: number): number[] {
  if (length <= 1) return []
  if (length === 2) return [wrapIndex(index + 1, length)]
  return [wrapIndex(index - 1, length), wrapIndex(index + 1, length)]
}

export function preloadPhases(startIndex: number, length: number): number[][] {
  if (length <= 0) return []
  const start = wrapIndex(startIndex, length)
  const neighbors = neighborIndexes(start, length)
  const rest = Array.from({ length }, (_, index) => index).filter(
    (index) => index !== start && !neighbors.includes(index),
  )
  return [[start], neighbors, rest].filter((group) => group.length > 0)
}

export function framesFromDrag(deltaX: number, pixelsPerFrame: number): number {
  if (pixelsPerFrame <= 0) return 0
  return Math.trunc(deltaX / pixelsPerFrame)
}

export function indexFromDrag(
  startIndex: number,
  deltaX: number,
  length: number,
  pixelsPerFrame: number,
): number {
  return wrapIndex(startIndex + framesFromDrag(deltaX, pixelsPerFrame), length)
}

export function maxZoomForImage(
  imageWidth: number,
  renderedWidth: number,
  hardMax = 3,
): number {
  if (renderedWidth <= 0 || imageWidth <= 0) return 1
  const native = imageWidth / renderedWidth
  // Always allow at least 2x for detail inspection; slight upscaling past the
  // native ratio is the standard e-commerce trade-off and stays acceptable.
  return Math.min(hardMax, Math.max(2, Number(native.toFixed(2))))
}

export function clampZoom(zoom: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, zoom))
}

export function clampPan(pan: number, zoom: number, size: number): number {
  const extra = ((zoom - 1) * size) / 2
  if (extra <= 0) return 0
  return Math.min(extra, Math.max(-extra, pan))
}

/**
 * Pan needed so the image point under `point` (viewport coordinates relative
 * to the stage centre) stays fixed while zoom changes. Matches the transform
 * `translate(pan) scale(zoom)` with a centred origin.
 */
export function zoomAtPoint(
  currentZoom: number,
  currentPan: { x: number; y: number },
  nextZoom: number,
  point: { x: number; y: number },
): { x: number; y: number } {
  if (currentZoom <= 0) return { x: 0, y: 0 }
  const ratio = nextZoom / currentZoom
  return {
    x: point.x - (point.x - currentPan.x) * ratio,
    y: point.y - (point.y - currentPan.y) * ratio,
  }
}

export function enabledExperiences<
  T extends { enabled: boolean; assets: unknown[] },
>(experiences: T[]): T[] {
  return experiences.filter(
    (experience) => experience.enabled && experience.assets.length > 0,
  )
}

export function resolveDisplayedAsset<T extends { src: string }>(
  assets: T[],
  index: number,
  ready: ReadonlySet<string>,
): T | null {
  if (assets.length === 0) return null
  const requested = assets[wrapIndex(index, assets.length)]
  if (!requested) return null
  if (ready.size === 0 || ready.has(requested.src)) return requested
  for (let offset = 1; offset < assets.length; offset += 1) {
    const candidate = assets[wrapIndex(index - offset, assets.length)]
    if (candidate && ready.has(candidate.src)) return candidate
  }
  return requested
}
