import type { PointerEvent } from 'react'
import { useEffect, useRef } from 'react'
import type { ProductHotspot, ProductMediaAsset } from '../../data/products/types'
import Hotspot from './Hotspot'

interface Point {
  x: number
  y: number
}

export default function ViewerSurface({
  asset,
  previousAsset,
  alt,
  zoom,
  pan,
  showHotspots,
  activeHotspotId,
  hint,
  loading,
  reduceMotion,
  interacting,
  rotatable,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onWheelZoom,
  onHotspot,
  onResize,
}: Readonly<{
  asset: ProductMediaAsset
  previousAsset: ProductMediaAsset | null
  alt: string
  zoom: number
  pan: Point
  showHotspots: boolean
  activeHotspotId: string | null
  hint: string | null
  loading: boolean
  reduceMotion: boolean
  interacting: boolean
  rotatable: boolean
  onPointerDown: (event: PointerEvent<HTMLElement>) => void
  onPointerMove: (event: PointerEvent<HTMLElement>) => void
  onPointerUp: (event: PointerEvent<HTMLElement>) => void
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void
  onWheelZoom: (point: Point, deltaY: number, modifier: boolean) => boolean
  onHotspot: (hotspot: ProductHotspot) => void
  onResize: (width: number) => void
}>) {
  const frameRef = useRef<HTMLDivElement>(null)
  const wheelHandler = useRef(onWheelZoom)

  useEffect(() => {
    wheelHandler.current = onWheelZoom
  }, [onWheelZoom])

  useEffect(() => {
    const node = frameRef.current
    if (!node) return
    const observer = new ResizeObserver(() => {
      onResize(node.getBoundingClientRect().width)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [onResize])

  // React registers wheel listeners as passive, which makes preventDefault a
  // no-op; attach natively so ctrl+scroll zoom does not also zoom the page.
  useEffect(() => {
    const node = frameRef.current
    if (!node) return
    const listener = (event: globalThis.WheelEvent) => {
      const rect = node.getBoundingClientRect()
      const point = {
        x: event.clientX - rect.left - rect.width / 2,
        y: event.clientY - rect.top - rect.height / 2,
      }
      const handled = wheelHandler.current(
        point,
        event.deltaY,
        event.ctrlKey || event.metaKey,
      )
      if (handled) event.preventDefault()
    }
    node.addEventListener('wheel', listener, { passive: false })
    return () => node.removeEventListener('wheel', listener)
  }, [])

  return (
    <div
      ref={frameRef}
      className="product-viewer-stage"
      data-zoomed={zoom > 1 ? 'true' : 'false'}
      data-rotatable={rotatable && zoom === 1 ? 'true' : 'false'}
      data-interacting={interacting ? 'true' : 'false'}
      style={{ touchAction: zoom > 1 ? 'none' : 'pan-y' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div
        className="product-viewer-frame"
        data-reduced-motion={reduceMotion ? 'true' : 'false'}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {previousAsset && previousAsset.src !== asset.src ? (
          <img
            className="product-viewer-photo product-viewer-photo--outgoing"
            src={previousAsset.src}
            alt=""
            width={previousAsset.width}
            height={previousAsset.height}
            draggable={false}
          />
        ) : null}
        <img
          className="product-viewer-photo product-viewer-photo--current"
          src={asset.src}
          alt={alt}
          width={asset.width}
          height={asset.height}
          draggable={false}
          fetchPriority={loading ? 'high' : 'auto'}
        />
        {showHotspots
          ? (asset.hotspots ?? []).map((hotspot) => (
              <Hotspot
                key={hotspot.id}
                hotspot={hotspot}
                active={hotspot.id === activeHotspotId}
                onSelect={onHotspot}
              />
            ))
          : null}
      </div>
      {loading ? (
        <p className="product-viewer-loading" aria-live="polite">
          Loading
        </p>
      ) : null}
      {hint ? <p className="product-viewer-hint">{hint}</p> : null}
    </div>
  )
}
