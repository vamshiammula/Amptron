import arrowRight from '../assets/icons/arrow-right.svg'
import { useSiteContent } from '../lib/siteContent'

export default function Products() {
  const { models } = useSiteContent()

  return (
    <section className="products" id="products">
      <header className="section-header">
        <div className="eyebrow">
          <span className="eyebrow-bar" />
          Our Fleet
        </div>
        <h2 className="section-title">Our Electric Scooter Range</h2>
        <p className="section-sub">
          Precision-engineered models for city commutes and partner floors. Buy from
          Amptron or find a showroom.
        </p>
      </header>
      <div className="product-grid">
        {models.map((product) => (
          <article
            key={product.slug}
            className={`product-card${product.featured ? ' product-card--featured' : ''}`}
          >
            <div className="product-photo">
              <img
                src={product.image}
                alt={`${product.name} electric scooter`}
                width={900}
                height={600}
                loading="lazy"
                decoding="async"
              />
              {product.featured ? (
                <span className="product-badge">Most Popular</span>
              ) : null}
            </div>
            <div className="product-body">
              <div>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
              </div>
              <div className="product-specs">
                {product.highlights.map(({ label, value }) => (
                  <div className="spec-row" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <a className="product-link" href={`/models/${product.slug}`}>
                View Details
                <img src={arrowRight} alt="" width={16} height={16} />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
