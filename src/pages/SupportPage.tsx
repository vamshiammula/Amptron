import Icon from '../components/ui/Icon'
import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import PageHero from '../components/ui/PageHero'
import { openAmptronChat } from '../lib/openChat'

export default function SupportPage() {
  return (
    <>
      <Seo
        title="Amptron | Rider support"
        description="Find help with your Amptron scooter, warranty, service and replacement parts."
        path="/support"
      />
      <main id="main" className="site-page">
        <PageHero
          eyebrow="Here for the next step"
          title="Keep moving, with support."
          lede="Find the right next step for your scooter. For a specific repair or part, have your model name and purchase details ready."
        >
          <button
            className="btn btn-primary"
            type="button"
            onClick={openAmptronChat}
          >
            Ask Amptron
          </button>
          <Link className="btn btn-ghost-dark" to="/dealers/locate">
            Find a showroom
          </Link>
        </PageHero>
        <section className="page-section">
          <div className="wrap support-grid">
            <article className="support-card">
              <span className="eyebrow">01 / Service</span>
              <h2>Find local help</h2>
              <p>
                Contact a listed showroom to check service availability before
                visiting. Describe the issue and confirm the next step with the
                team.
              </p>
              <Link to="/dealers/locate">
                Find a showroom <Icon name="arrow-right" />
              </Link>
            </article>
            <article className="support-card">
              <span className="eyebrow">02 / Coverage</span>
              <h2>Understand your warranty</h2>
              <p>
                Check the policy and your signed purchase documents for coverage.
                Keep the invoice and vehicle details ready for a claim.
              </p>
              <Link to="/warranty">
                Read warranty guidance <Icon name="arrow-right" />
              </Link>
            </article>
            <article className="support-card">
              <span className="eyebrow">03 / Parts</span>
              <h2>Get the right component</h2>
              <p>
                Ask about compatibility and availability for your model. Current
                parts enquiries go through support.
              </p>
              <button type="button" onClick={openAmptronChat}>
                Ask about parts <Icon name="arrow-right" />
              </button>
            </article>
          </div>
        </section>
        <section className="support-prep wrap">
          <h2>Before you get in touch</h2>
          <ul>
            <li>Your scooter model and purchase date</li>
            <li>A clear description of the question or issue</li>
            <li>Your city and preferred contact details</li>
          </ul>
          <p>
            Our assistant can answer common questions or let you leave a request for
            the team. A request is not a confirmed service appointment.
          </p>
        </section>
      </main>
    </>
  )
}
