import { Link } from 'react-router-dom'
import { InquiryForm } from '../components/Contact'
import Seo from '../components/Seo'
import PageHero from '../components/ui/PageHero'
import { useSiteContent } from '../lib/siteContent'

const steps = [
  {
    num: '01',
    title: 'Helmet',
    copy: 'We fit a helmet and walk the controls: start, reverse, and how the brakes feel.',
  },
  {
    num: '02',
    title: 'Route',
    copy: 'A short city loop so you can judge range of motion, seat, and everyday roads. Not a racetrack.',
  },
  {
    num: '03',
    title: 'Debrief',
    copy: 'Specs, charge time, and next step: buy from Amptron, book a slot, or find a partner showroom.',
  },
]

export default function BookTestRidePage() {
  const { models } = useSiteContent()

  return (
    <>
      <Seo
        title="Book an Amptron Test Ride"
        description="Book a test ride on Amptron Volt, Storm, or Cruise. Helmet, a short city route, and a clear debrief."
        path="/book-test-ride"
      />
      <main id="main" className="site-page">
        <PageHero
          eyebrow="Ride"
          title="Book a Test Ride"
          lede="Try Amptron on the roads you actually use. Same certified machine if you prefer a partner showroom instead."
        >
          <a className="btn btn-primary" href="#test-ride">
            Pick a slot
          </a>
          <Link className="btn btn-ghost-dark" to="/dealers/locate">
            Find a Showroom
          </Link>
        </PageHero>

        <section className="page-section">
          <div className="wrap test-ride-grid">
            <div className="test-ride-intro">
              <h2 className="section-title">What to expect</h2>
              <div className="steps">
                {steps.map((step) => (
                  <article className="step" key={step.num}>
                    <div className="step-num">{step.num}</div>
                    <h3>{step.title}</h3>
                    <p>{step.copy}</p>
                  </article>
                ))}
              </div>
              <div className="test-ride-models">
                <h3>Which one to ride</h3>
                <ul>
                  {models.map((model) => (
                    <li key={model.slug}>
                      <Link to={`/models/${model.slug}`}>
                        <strong>{model.name}</strong>
                        <span>{model.tagline}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="savings-note">
                Prefer a showroom visit?{' '}
                <Link to="/dealers/locate">Find a Showroom</Link>
              </p>
            </div>
            <div className="test-ride-form" id="test-ride">
              <InquiryForm kind="testRide" />
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
