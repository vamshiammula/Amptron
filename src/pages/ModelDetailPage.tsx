import { lazy, Suspense } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Seo from '../components/Seo'
import { useScooterModel, useSiteContent } from '../lib/siteContent'

const ProductViewer = lazy(
  () => import('../components/product-viewer/ProductViewer'),
)

export default function ModelDetailPage() {
  const { slug = '' } = useParams()
  const { models, productViewers } = useSiteContent()
  const model = useScooterModel(slug)

  if (!model) {
    return <Navigate to="/models" replace />
  }

  const related = models.filter((candidate) => candidate.slug !== slug)
  const viewer = productViewers[model.slug]

  return (
    <>
      <Seo
        title={`${model.name}: Specifications and Features`}
        description={`${model.name}: ${model.tagline} Certified specs, charging profile, and features. Buy from Amptron or find a showroom.`}
        path={`/models/${model.slug}`}
      />
      <main id="main" className="content-page">
        <section className="model-hero">
          {viewer ? (
            <Suspense
              fallback={<div className="product-viewer" aria-hidden="true" />}
            >
              <ProductViewer model={model} config={viewer} />
            </Suspense>
          ) : (
            <img src={model.image} alt={`${model.name} showcase`} />
          )}
          <div>
            <p className="content-eyebrow">Model Detail</p>
            <h1>{model.name}</h1>
            <p>{model.tagline}</p>
            <div className="model-highlights">
              {model.highlights.map((item) => (
                <article key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                  <small>{item.note}</small>
                </article>
              ))}
            </div>
            <div className="model-actions">
              <a className="btn btn-primary" href="/#buy">
                Buy Amptron
              </a>
              <a className="btn btn-ghost btn-ghost-dark" href="/dealers/locate">
                Find a Showroom
              </a>
            </div>
          </div>
        </section>

        <section className="model-detail-grid">
          <article className="detail-panel">
            <h2>Technical Specifications</h2>
            <div className="spec-table">
              {model.specs.map((spec) => (
                <div className="spec-row" key={spec.label}>
                  <span>{spec.label}</span>
                  <strong>{spec.value}</strong>
                </div>
              ))}
            </div>
          </article>
          <article className="detail-panel">
            <h2>Features</h2>
            <ul className="feature-list">
              {model.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="related-models">
          <h2>Compare with Other Models</h2>
          <div>
            {related.map((item) => (
              <Link key={item.slug} to={`/models/${item.slug}`}>
                {item.name}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
