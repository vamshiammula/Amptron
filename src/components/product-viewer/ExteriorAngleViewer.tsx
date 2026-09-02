import type { ProductHotspot, ProductMediaAsset } from '../../data/products/types'
import { wrapIndex } from '../../lib/productViewerMath'
import { useViewerGestures } from './useViewerGestures'
import ViewerSurface from './ViewerSurface'

interface Point {
  x: number
  y: number
}

export default function ExteriorAngleViewer({
  assets,
  index,
  displayIndex,
  previousAsset,
  zoom,
  maxZoom,
  pan,
  showHotspots,
  activeHotspotId,
  hint,
  loading,
  enabled,
  reduceMotion,
  onIndexChange,
  onInteract,
  onPan,
  onZoomAt,
  onZoomReset,
  onWheelZoom,
  onHotspot,
  onResize,
}: Readonly<{
  assets: ProductMediaAsset[]
  index: number
  displayIndex: number
  previousAsset: ProductMediaAsset | null
  zoom: number
  maxZoom: number
  pan: Point
  showHotspots: boolean
  activeHotspotId: string | null
  hint: string | null
  loading: boolean
  enabled: boolean
  reduceMotion: boolean
  onIndexChange: (index: number) => void
  onInteract: () => void
  onPan: (dx: number, dy: number) => void
  onZoomAt: (zoom: number, point: Point) => void
  onZoomReset: () => void
  onWheelZoom: (point: Point, deltaY: number, modifier: boolean) => boolean
  onHotspot: (hotspot: ProductHotspot) => void
  onResize: (width: number) => void
}>) {
  const asset = assets[wrapIndex(displayIndex, assets.length)]
  const gestures = useViewerGestures({
    length: assets.length,
    index,
    zoom,
    maxZoom,
    rotateEnabled: enabled,
    onIndexChange,
    onPan,
    onZoomAt,
    onZoomReset,
    onInteract,
  })

  if (!asset) return null

  return (
    <ViewerSurface
      asset={asset}
      previousAsset={previousAsset}
      alt={asset.alt}
      zoom={zoom}
      pan={pan}
      showHotspots={showHotspots}
      activeHotspotId={activeHotspotId}
      hint={hint}
      loading={loading}
      reduceMotion={reduceMotion}
      interacting={gestures.interacting}
      rotatable={enabled && assets.length > 1}
      onPointerDown={gestures.onPointerDown}
      onPointerMove={gestures.onPointerMove}
      onPointerUp={gestures.onPointerUp}
      onPointerCancel={gestures.onPointerCancel}
      onWheelZoom={onWheelZoom}
      onHotspot={onHotspot}
      onResize={onResize}
    />
  )
}
