import { useCallback, useRef, useState } from 'react'
import {
  clampPan,
  clampZoom,
  maxZoomForImage,
  zoomAtPoint,
} from '../../lib/productViewerMath'

interface Point {
  x: number
  y: number
}

export function useViewerZoom(imageWidth: number) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })
  const [renderedWidth, setRenderedWidthState] = useState(imageWidth)
  // Live copy read by gesture handlers: pinch/wheel can fire several times
  // between renders, so state closures alone would lag behind.
  const live = useRef({ zoom: 1, pan: { x: 0, y: 0 }, size: imageWidth })

  const setRenderedWidth = useCallback((width: number) => {
    if (width <= 0) return
    live.current.size = width
    setRenderedWidthState(width)
  }, [])

  const commit = useCallback((nextZoom: number, nextPan: Point) => {
    live.current.zoom = nextZoom
    live.current.pan = nextPan
    setZoom(nextZoom)
    setPan(nextPan)
  }, [])

  const reset = useCallback(() => commit(1, { x: 0, y: 0 }), [commit])

  const applyZoomAt = useCallback(
    (next: number, point: Point) => {
      const { zoom: currentZoom, pan: currentPan, size } = live.current
      const clamped = clampZoom(next, 1, maxZoomForImage(imageWidth, size, 3))
      if (clamped === 1) {
        commit(1, { x: 0, y: 0 })
        return
      }
      const target = zoomAtPoint(currentZoom, currentPan, clamped, point)
      commit(clamped, {
        x: clampPan(target.x, clamped, size),
        y: clampPan(target.y, clamped, size),
      })
    },
    [commit, imageWidth],
  )

  const applyZoom = useCallback(
    (next: number) => applyZoomAt(next, { x: 0, y: 0 }),
    [applyZoomAt],
  )

  const nudgePan = useCallback(
    (dx: number, dy: number) => {
      const { zoom: currentZoom, pan: currentPan, size } = live.current
      if (currentZoom <= 1) return
      commit(currentZoom, {
        x: clampPan(currentPan.x + dx, currentZoom, size),
        y: clampPan(currentPan.y + dy, currentZoom, size),
      })
    },
    [commit],
  )

  const maxZoom = maxZoomForImage(imageWidth, renderedWidth, 3)

  return {
    zoom,
    pan,
    maxZoom,
    setRenderedWidth,
    applyZoom,
    applyZoomAt,
    reset,
    nudgePan,
  }
}
