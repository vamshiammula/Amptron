import { Link } from 'react-router-dom'
import type { ScooterModel } from '../../data/models'
import PriceTag from './PriceTag'

interface ModelCardProps {
  model: ScooterModel
  /** Use the longer description instead of the tagline. */
  detailed?: boolean
  eager?: boolean
  /** Short use-case label shown above the name, e.g. "City hops". */
  eyebrow?: string
}

export default function ModelCard({
  model,
  detailed = false,
  eager = false,
  eyebrow,
}: ModelCardProps) {
  return (
    <article
      className={`model-rail-card${model.featured ? ' model-rail-card--featured' : ''}`}
    >
      <Link
        className="model-rail-photo"
        to={`/models/${model.slug}`}
        aria-label={`Explore ${model.name}`}
      >
        <img
          src={model.image}
          alt={`${model.name} electric scooter`}
          width={900}
          height={600}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
        />
        {model.featured ? (
          <span className="product-badge">Most Popular</span>
        ) : null}
      </Link>
      <div className="model-rail-body">
        <div>
          {eyebrow ? (
            <div className="eyebrow">
              <span className="eyebrow-bar" />
              {eyebrow}
            </div>
          ) : null}
          <h3>{model.name}</h3>
          <p>{detailed ? model.description : model.tagline}</p>
        </div>
        <div className="model-rail-specs">
          {model.highlights.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
        <PriceTag pricing={model.pricing} compact />
        <div className="model-rail-actions">
          <Link className="btn btn-primary" to={`/models/${model.slug}`}>
            Explore
          </Link>
          <a className="btn btn-ghost-dark" href="/#buy">
            Buy Amptron
          </a>
        </div>
      </div>
    </article>
  )
}
