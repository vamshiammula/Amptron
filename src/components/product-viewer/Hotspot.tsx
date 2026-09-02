import type { ProductHotspot } from '../../data/products/types'

export default function Hotspot({
  hotspot,
  active,
  onSelect,
}: Readonly<{
  hotspot: ProductHotspot
  active: boolean
  onSelect: (hotspot: ProductHotspot) => void
}>) {
  return (
    <button
      type="button"
      className="product-viewer-hotspot"
      data-active={active ? 'true' : 'false'}
      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
      aria-label={hotspot.title}
      aria-expanded={active}
      onClick={() => onSelect(hotspot)}
    >
      <span className="product-viewer-hotspot-dot" aria-hidden="true">
        +
      </span>
      <span className="product-viewer-hotspot-tip" aria-hidden="true">
        {hotspot.title}
      </span>
    </button>
  )
}
