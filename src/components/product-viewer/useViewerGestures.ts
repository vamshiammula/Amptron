import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { framesFromDrag, wrapIndex } from '../../lib/productViewerMath'

const SLOP_PX = 8
const TAP_MAX_MS = 350
const DOUBLE_TAP_MS = 320
const DOUBLE_TAP_RADIUS_PX = 48
const DOUBLE_TAP_ZOOM = 2.2
const FLICK_VELOCITY_PX_PER_MS = 0.35
const VELOCITY_WINDOW_MS = 120

interface Point {
  x: number
  y: number
}

type GestureMode = 'idle' | 'pending' | 'rotate' | 'pan' | 'pinch' | 'released'

function relativePoint(event: PointerEvent<HTMLElement>, node: HTMLElement): Point {
  const rect = node.getBoundingClientRect()
  return {
    x: event.clientX - rect.left - rect.width / 2,
    y: event.clientY - rect.top - rect.height / 2,
  }
}

/**
 * One pointer state machine for the viewer stage:
 * - zoom 1: horizontal drag rotates (with flick momentum), vertical drag is
 *   released to the browser so the page keeps scrolling
 * - zoomed: single pointer pans, two pointers pinch-zoom around the midpoint
 * - quick double tap / double click zooms in at the tap point or resets
 */
export function useViewerGestures(options: {
  length: number
  index: number
  zoom: number
  maxZoom: number
  rotateEnabled: boolean
  pixelsPerFrame?: number
  onIndexChange: (index: number) => void
  onPan: (dx: number, dy: number) => void
  onZoomAt: (zoom: number, point: Point) => void
  onZoomReset: () => void
  onInteract?: () => void
}) {
  const pixelsPerFrame = options.pixelsPerFrame ?? 80
  const [interacting, setInteracting] = useState(false)
  const pointers = useRef(new Map<number, Point>())
  const mode = useRef<GestureMode>('idle')
  const start = useRef({ x: 0, y: 0, t: 0, index: 0 })
  const panLast = useRef<Point>({ x: 0, y: 0 })
  const pinchStart = useRef({ dist: 0, zoom: 1 })
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null)
  const samples = useRef<Array<{ t: number; x: number }>>([])

  const capture = (event: PointerEvent<HTMLElement>) => {
    try {
      for (const pointerId of pointers.current.keys()) {
        event.currentTarget.setPointerCapture(pointerId)
      }
    } catch {
      // Pointer may already be gone; capture is an optimization, not required.
    }
  }

  const pinchDistance = () => {
    const [a, b] = [...pointers.current.values()]
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }

  const pinchMidpoint = (node: HTMLElement): Point => {
    const rect = node.getBoundingClientRect()
    const points = [...pointers.current.values()]
    const midX = points.reduce((sum, p) => sum + p.x, 0) / points.length
    const midY = points.reduce((sum, p) => sum + p.y, 0) / points.length
    return {
      x: midX - rect.left - rect.width / 2,
      y: midY - rect.top - rect.height / 2,
    }
  }

  const settle = () => {
    mode.current = 'idle'
    setInteracting(false)
  }

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return
    if ((event.target as HTMLElement).closest?.('button')) return
    options.onInteract?.()
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })
    if (pointers.current.size === 2) {
      mode.current = 'pinch'
      pinchStart.current = { dist: pinchDistance(), zoom: options.zoom }
      setInteracting(true)
      capture(event)
      return
    }
    mode.current = 'pending'
    start.current = {
      x: event.clientX,
      y: event.clientY,
      t: event.timeStamp,
      index: options.index,
    }
    samples.current = [{ t: event.timeStamp, x: event.clientX }]
  }

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const record = pointers.current.get(event.pointerId)
    if (!record) return
    record.x = event.clientX
    record.y = event.clientY

    if (mode.current === 'pinch') {
      const dist = pinchDistance()
      if (pinchStart.current.dist > 0 && dist > 0) {
        options.onZoomAt(
          pinchStart.current.zoom * (dist / pinchStart.current.dist),
          pinchMidpoint(event.currentTarget),
        )
      }
      return
    }

    if (mode.current === 'pending') {
      const dx = event.clientX - start.current.x
      const dy = event.clientY - start.current.y
      if (Math.abs(dx) < SLOP_PX && Math.abs(dy) < SLOP_PX) return
      if (options.zoom > 1) {
        mode.current = 'pan'
        panLast.current = { x: event.clientX, y: event.clientY }
        setInteracting(true)
        capture(event)
      } else if (
        Math.abs(dx) >= Math.abs(dy) &&
        options.rotateEnabled &&
        options.length > 1
      ) {
        mode.current = 'rotate'
        setInteracting(true)
        capture(event)
      } else {
        // Vertical intent (or rotation unavailable): the browser keeps it.
        mode.current = 'released'
        return
      }
    }

    if (mode.current === 'pan') {
      options.onPan(
        event.clientX - panLast.current.x,
        event.clientY - panLast.current.y,
      )
      panLast.current = { x: event.clientX, y: event.clientY }
      return
    }

    if (mode.current === 'rotate') {
      const now = event.timeStamp
      samples.current.push({ t: now, x: event.clientX })
      while (
        samples.current.length > 1 &&
        now - samples.current[0].t > VELOCITY_WINDOW_MS
      ) {
        samples.current.shift()
      }
      const next = wrapIndex(
        start.current.index +
          framesFromDrag(event.clientX - start.current.x, pixelsPerFrame),
        options.length,
      )
      if (next !== options.index) options.onIndexChange(next)
    }
  }

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (!pointers.current.delete(event.pointerId)) return
    const endedMode = mode.current

    if (endedMode === 'pinch' && pointers.current.size === 1) {
      const [rest] = [...pointers.current.values()]
      if (options.zoom > 1) {
        mode.current = 'pan'
        panLast.current = { x: rest.x, y: rest.y }
      } else {
        mode.current = 'released'
        setInteracting(false)
      }
      return
    }
    if (pointers.current.size > 0) return

    settle()

    if (endedMode === 'pending') {
      const duration = event.timeStamp - start.current.t
      if (duration > TAP_MAX_MS) return
      const tap = { t: event.timeStamp, x: event.clientX, y: event.clientY }
      const previous = lastTap.current
      const isDouble =
        previous &&
        tap.t - previous.t <= DOUBLE_TAP_MS &&
        Math.hypot(tap.x - previous.x, tap.y - previous.y) <= DOUBLE_TAP_RADIUS_PX
      if (isDouble) {
        lastTap.current = null
        if (options.zoom > 1.05) {
          options.onZoomReset()
        } else {
          options.onZoomAt(
            Math.min(DOUBLE_TAP_ZOOM, options.maxZoom),
            relativePoint(event, event.currentTarget),
          )
        }
      } else {
        lastTap.current = tap
      }
      return
    }

    if (endedMode === 'rotate') {
      const now = event.timeStamp
      const first = samples.current[0]
      samples.current = []
      if (!first || now <= first.t) return
      const velocity = (event.clientX - first.x) / (now - first.t)
      const framesMoved = framesFromDrag(
        event.clientX - start.current.x,
        pixelsPerFrame,
      )
      // Flick: a fast short swipe that did not cross a frame boundary still
      // advances one frame in the swipe direction.
      if (Math.abs(velocity) >= FLICK_VELOCITY_PX_PER_MS && framesMoved === 0) {
        options.onIndexChange(
          wrapIndex(start.current.index + (velocity > 0 ? 1 : -1), options.length),
        )
      }
    }
  }

  const onPointerCancel = (event: PointerEvent<HTMLElement>) => {
    pointers.current.delete(event.pointerId)
    if (pointers.current.size === 0) settle()
  }

  return { interacting, onPointerDown, onPointerMove, onPointerUp, onPointerCancel }
}
