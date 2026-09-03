import { Link } from 'react-router-dom'
import CompareTable from '../components/CompareTable'
import Seo from '../components/Seo'
import ModelCard from '../components/ui/ModelCard'
import PageHero from '../components/ui/PageHero'
import { useSiteContent } from '../lib/siteContent'

/** The ride each model is built for, shown as the card eyebrow. */
const USE_CASE: Record<string, string> = {
  'amptron-volt': 'City hops',
  'amptron-storm': 'City and suburbs',
  'amptron-cruise': 'All-day range',
}

export default function ModelsPage() {
  const { models } = useSiteContent()

  return (
    <>
      <Seo
        title="Amptron Models: Electric Scooter Range"
        description="Compare Amptron Volt, Storm, and Cruise with certified range, speed, charging time, price, and full technical specifications."
        path="/models"
      />
      <main id="main" className="site-page">
        <PageHero
          eyebrow="Model catalog"
          title="Choose your Amptron"
          lede="Three certified scooters. Range, charge time, and ownership first. Buy from Amptron, or find a partner showroom. Same machine either way."
        >
          <a className="btn btn-primary" href="#compare">
            Compare all three
          </a>
          <Link className="btn btn-ghost-dark" to="/book-test-ride">
            Book a Test Ride
          </Link>
        </PageHero>

        <section className="page-section" aria-labelledby="fleet-heading">
          <div className="wrap">
            <h2 id="fleet-heading" className="sr-only">
              The fleet
            </h2>
            <div className="model-grid">
              {models.map((model, index) => (
                <ModelCard
                  model={model}
                  detailed
                  eager={index === 0}
                  eyebrow={USE_CASE[model.slug]}
                  key={model.slug}
                />
              ))}
            </div>
          </div>
        </section>

        <CompareTable models={models} />

        <section className="cta-band">
          <div className="wrap cta-band-inner">
            <div>
              <h2>Ready when you are.</h2>
              <p>
                Buy from Amptron, book a test ride, or walk into a partner showroom.
                Same certified scooter, same backing, whichever door you use.
              </p>
            </div>
            <div className="cta-band-actions">
              <a className="btn btn-primary" href="/#buy">
                Buy Amptron
              </a>
              <Link className="btn btn-ghost" to="/book-test-ride">
                Book a Test Ride
              </Link>
              <Link className="btn btn-ghost" to="/dealers/locate">
                Find a Showroom
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
