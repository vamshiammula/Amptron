import type {
  ProductHotspot,
  ProductMediaAsset,
  ViewerRenderer,
} from '../../data/products/types'
import ExteriorAngleViewer from './ExteriorAngleViewer'

interface Point {
  x: number
  y: number
}

export default function ProductViewerRenderer({
  renderer,
  ...props
}: Readonly<{
  renderer: ViewerRenderer
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
  switch (renderer) {
    case 'sequence':
    case 'threejs':
    case 'angles':
      return <ExteriorAngleViewer {...props} />
  }
}
