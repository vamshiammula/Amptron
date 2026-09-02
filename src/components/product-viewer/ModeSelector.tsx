import type { ProductExperience } from '../../data/products/types'

export default function ModeSelector({
  modes,
  activeId,
  onSelect,
}: Readonly<{
  modes: ProductExperience[]
  activeId: string
  onSelect: (id: ProductExperience['id']) => void
}>) {
  if (modes.length < 2) return null

  return (
    <div className="product-viewer-modes" role="tablist" aria-label="Product views">
      {modes.map((mode) => (
        <button
          key={mode.id}
          type="button"
          role="tab"
          aria-selected={mode.id === activeId}
          className={mode.id === activeId ? 'is-active' : ''}
          onClick={() => onSelect(mode.id)}
        >
          {mode.label}
        </button>
      ))}
    </div>
  )
}
