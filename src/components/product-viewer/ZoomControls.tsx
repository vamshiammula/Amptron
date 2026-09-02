export default function ZoomControls({
  zoom,
  maxZoom,
  onZoomIn,
  onZoomOut,
  onReset,
}: Readonly<{
  zoom: number
  maxZoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}>) {
  return (
    <fieldset className="product-viewer-zoom" aria-label="Zoom">
      <button
        type="button"
        aria-label="Zoom out"
        disabled={zoom <= 1}
        onClick={onZoomOut}
      >
        −
      </button>
      <span className="product-viewer-zoom-level">{Math.round(zoom * 100)}%</span>
      <button type="button" aria-label="Reset view" onClick={onReset}>
        Reset
      </button>
      <button
        type="button"
        aria-label="Zoom in"
        disabled={zoom >= maxZoom}
        onClick={onZoomIn}
      >
        +
      </button>
    </fieldset>
  )
}
