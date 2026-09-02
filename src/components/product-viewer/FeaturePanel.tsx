import { useEffect, useRef } from 'react'
import type { ModelSpec } from '../../data/models'
import type { ProductHotspot } from '../../data/products/types'
import { wrapIndex } from '../../lib/productViewerMath'

export default function FeaturePanel({
  hotspot,
  hotspots,
  specs,
  onSelect,
  onClose,
}: Readonly<{
  hotspot: ProductHotspot
  hotspots: ProductHotspot[]
  specs: ModelSpec[]
  onSelect: (hotspot: ProductHotspot) => void
  onClose: () => void
}>) {
  const position = Math.max(
    0,
    hotspots.findIndex((item) => item.id === hotspot.id),
  )
  const spec = hotspot.specLabel
    ? specs.find((item) => item.label === hotspot.specLabel)
    : undefined

  const step = (direction: number) => {
    const next = hotspots[wrapIndex(position + direction, hotspots.length)]
    if (next) onSelect(next)
  }

  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const node = panelRef.current
    if (!node) return
    const reduceMotion = Boolean(
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    )
    node.scrollIntoView?.({
      block: 'nearest',
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [hotspot.id])

  return (
    <aside ref={panelRef} className="product-viewer-panel" aria-live="polite">
      <div className="product-viewer-panel-head">
        <h3>{hotspot.title}</h3>
        {hotspots.length > 1 ? (
          <span className="product-viewer-panel-count">
            {position + 1} / {hotspots.length}
          </span>
        ) : null}
        <button
          type="button"
          className="product-viewer-panel-close"
          aria-label="Close feature details"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="product-viewer-panel-body">
        {hotspot.imageSrc ? (
          <img src={hotspot.imageSrc} alt="" width={96} height={96} />
        ) : null}
        <div>
          <p>{hotspot.description}</p>
          {spec ? (
            <p className="product-viewer-spec">
              <span>{spec.label}</span>
              <strong>{spec.value}</strong>
            </p>
          ) : null}
        </div>
      </div>
      {hotspots.length > 1 ? (
        <div className="product-viewer-panel-nav">
          <button
            type="button"
            aria-label="Previous feature"
            onClick={() => step(-1)}
          >
            ‹ Prev
          </button>
          <button type="button" aria-label="Next feature" onClick={() => step(1)}>
            Next ›
          </button>
        </div>
      ) : null}
    </aside>
  )
}
