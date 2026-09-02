import type { ProductExperience } from '../../data/products/types'
import type { ModelSpec } from '../../data/models'

export default function ViewerControls({
  experience,
  specs,
}: Readonly<{
  experience: ProductExperience
  specs: ModelSpec[]
}>) {
  const specRows = (experience.specLabels ?? [])
    .map((label) => specs.find((spec) => spec.label === label))
    .filter((row): row is ModelSpec => Boolean(row))

  if (experience.id !== 'storage' && specRows.length === 0) return null

  return (
    <div className="product-viewer-info">
      {experience.id === 'storage' ? (
        <p className="product-viewer-copy">
          Under-seat storage for everyday items. Amptron has not published a
          capacity rating for this compartment.
        </p>
      ) : null}
      {specRows.length > 0 ? (
        <dl className="product-viewer-specs">
          {specRows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  )
}
