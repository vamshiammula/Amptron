import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import { useSiteContent } from '../lib/siteContent'

export default function ModelsPage() {
  const { models } = useSiteContent()

  return (
    <>
      <Seo
        title="Amptron Models: Electric Scooter Range"
        description="Compare Amptron Volt, Storm, and Cruise with certified range, speed, charging time, and full technical specifications."
        path="/models"
      />
      <main id="main" className="content-page">
        <section className="content-hero">
          <p className="content-eyebrow">Model Catalog</p>
          <h1>Explore Our Electric Fleet</h1>
          <p>
            Detailed technical sheets and use-case guidance for every Amptron
            scooter. Buy from us, or find a partner showroom.
          </p>
        </section>
        <section className="model-list">
          {models.map((model) => (
            <article className="model-card" key={model.slug}>
              <img src={model.image} alt={`${model.name} electric scooter`} />
              <div>
                <h2>{model.name}</h2>
                <p>{model.description}</p>
                <div className="model-quick-specs">
                  {model.highlights.map((item) => (
                    <span key={item.label}>
                      <strong>{item.value}</strong> {item.label}
                    </span>
                  ))}
                </div>
                <Link className="btn btn-primary" to={`/models/${model.slug}`}>
                  View Full Specifications
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  )
}
