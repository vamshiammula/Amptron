import { describe, expect, it } from 'vitest'
import {
  clampPan,
  clampZoom,
  enabledExperiences,
  framesFromDrag,
  indexFromDrag,
  maxZoomForImage,
  neighborIndexes,
  preloadPhases,
  resolveDisplayedAsset,
  wrapIndex,
  zoomAtPoint,
} from './productViewerMath'

describe('productViewerMath', () => {
  it('wraps indexes in both directions', () => {
    expect(wrapIndex(4, 4)).toBe(0)
    expect(wrapIndex(-1, 4)).toBe(3)
    expect(wrapIndex(0, 0)).toBe(0)
  })

  it('lists neighbor frames for preloading', () => {
    expect(neighborIndexes(0, 4)).toEqual([3, 1])
    expect(neighborIndexes(0, 1)).toEqual([])
  })

  it('builds start, neighbor, then remaining preload phases', () => {
    expect(preloadPhases(3, 4)).toEqual([[3], [2, 0], [1]])
  })

  it('converts drag distance into whole frames', () => {
    expect(framesFromDrag(180, 90)).toBe(2)
    expect(framesFromDrag(89, 90)).toBe(0)
    expect(indexFromDrag(0, -92, 4, 92)).toBe(3)
  })

  it('caps zoom near native size but always allows 2x inspection', () => {
    expect(maxZoomForImage(1024, 800, 3)).toBe(2)
    expect(maxZoomForImage(1024, 400, 3)).toBe(2.56)
    expect(maxZoomForImage(1024, 300, 3)).toBe(3)
    expect(clampZoom(4, 1, 2.5)).toBe(2.5)
  })

  it('zooms toward the pointer so the target detail stays under it', () => {
    // Zooming 1x -> 2x at a point 100px right of centre.
    const pan = zoomAtPoint(1, { x: 0, y: 0 }, 2, { x: 100, y: 0 })
    expect(pan).toEqual({ x: -100, y: 0 })
    // The image point that was under the cursor remains under it.
    expect(pan.x + 100 * 2).toBe(100)
    // Zooming back out at the same point restores the origin.
    expect(zoomAtPoint(2, pan, 1, { x: 100, y: 0 })).toEqual({ x: 0, y: 0 })
  })

  it('keeps pan inside the zoomed frame', () => {
    expect(clampPan(400, 1, 400)).toBe(0)
    expect(clampPan(400, 2, 400)).toBe(200)
    expect(clampPan(-400, 2, 400)).toBe(-200)
  })

  it('hides experiences without assets', () => {
    expect(
      enabledExperiences([
        { enabled: true, assets: [1] },
        { enabled: true, assets: [] },
        { enabled: false, assets: [1] },
      ]),
    ).toEqual([{ enabled: true, assets: [1] }])
  })

  it('keeps the last decoded frame until the next source is ready', () => {
    const assets = [{ src: 'a.jpg' }, { src: 'b.jpg' }, { src: 'c.jpg' }]
    expect(resolveDisplayedAsset(assets, 1, new Set(['a.jpg']))?.src).toBe('a.jpg')
    expect(resolveDisplayedAsset(assets, 1, new Set(['a.jpg', 'b.jpg']))?.src).toBe(
      'b.jpg',
    )
  })
})
