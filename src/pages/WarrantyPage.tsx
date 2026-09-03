import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import PageHero from '../components/ui/PageHero'

export default function WarrantyPage() {
  return (
    <>
      <Seo
        title="Amptron Warranty Policy"
        description="Amptron electric scooter warranty framework for vehicles, battery packs, and service escalation."
        path="/warranty"
      />
      <main id="main" className="site-page">
        <PageHero
          eyebrow="Ownership"
          title="Warranty Policy"
          lede="Amptron supports owner and dealer warranty workflows through a structured claims and replacement process, whether you bought from us or from a partner showroom."
          narrow
        >
          <Link className="btn btn-ghost-dark" to="/dealers/locate">
            Find a Showroom
          </Link>
          <a className="btn btn-ghost-dark" href="/#contact">
            Contact Support
          </a>
        </PageHero>
        <section className="page-section">
          <div className="wrap wrap--narrow">
            <div className="legal-body">
              <h2>Vehicle Coverage</h2>
              <p>
                Vehicle components are covered as per the signed sales or dealership
                policy and model-specific terms.
              </p>
              <h2>Battery Coverage</h2>
              <p>
                Battery claims require charge-cycle and usage diagnostics validated
                through authorized service partners.
              </p>
              <h2>Escalation</h2>
              <p>
                Owners and dealers can raise support tickets for warranty escalation
                and replacement approvals.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
