import { Link } from 'react-router-dom'
import hqMap from '../assets/images/hq-map.webp'
import heroScooter from '../assets/images/hero-scooter.webp'
import Numbers from '../components/Numbers'
import Seo from '../components/Seo'
import MediaFrame from '../components/ui/MediaFrame'
import PageHero from '../components/ui/PageHero'
import Reveal from '../components/ui/Reveal'
import SectionHeader from '../components/ui/SectionHeader'
import {
  brandMission,
  brandPillars,
  brandPurpose,
  brandVision,
  decisionFilter,
} from '../data/companyFacts'
import { HEADQUARTERS } from '../data/headquarters'
import { mapsSearchUrl } from '../lib/maps'

export default function AboutPage() {
  return (
    <>
      <Seo
        title="About Amptron"
        description="Amptron exists to make dependable electric mobility accessible to everyday people. Simple. Dependable. Electric."
        path="/about"
      />
      <main id="main" className="site-page">
        <PageHero
          tone="navy"
          eyebrow="The company"
          title="Simple. Dependable. Electric."
          lede={brandPurpose}
          aside={
            <MediaFrame
              className="page-hero-media"
              src={heroScooter}
              alt="Amptron electric scooter in the assembly hall"
              ratio="4 / 3"
              eager
            />
          }
        >
          <a className="btn btn-primary" href="/#buy">
            Buy Amptron
          </a>
          <Link className="btn btn-ghost" to="/#contact">
            Stock Amptron
          </Link>
        </PageHero>

        <section className="page-section">
          <div className="wrap about-grid">
            <Reveal as="article" className="about-card">
              <div className="eyebrow">
                <span className="eyebrow-bar" />
                Vision
              </div>
              <h2>{brandVision}</h2>
            </Reveal>
            <Reveal as="article" className="about-card about-card--navy">
              <div className="eyebrow">
                <span className="eyebrow-bar" />
                Mission
              </div>
              <p>{brandMission}</p>
            </Reveal>
          </div>
        </section>

        <section className="page-section page-section--fog">
          <div className="wrap">
            <SectionHeader
              eyebrow="What we stand on"
              title="Everything you need. Nothing you don't."
              sub="Five things every Amptron has to be before it leaves Manesar. Technology has to earn its place on the machine."
            />
            <div className="pillar-grid">
              {brandPillars.map((pillar, index) => (
                <Reveal as="article" className="pillar-card" key={pillar.title}>
                  <span className="pillar-num">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <Numbers />

        <section className="page-section">
          <div className="wrap">
            <SectionHeader
              eyebrow="The Amptron decision filter"
              title="Six questions before anything ships"
              sub="If a feature, a model line, or an offer fails these, we do not build it. It keeps the scooter simple and the price honest."
            />
            <ol className="filter-grid">
              {decisionFilter.map((item, index) => (
                <li key={item}>
                  <span className="filter-num">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <strong>{item}</strong>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="page-section page-section--fog">
          <div className="wrap manesar">
            <div className="manesar-copy">
              <SectionHeader
                eyebrow="Made in Manesar"
                title="Assembled in India, built for the road ahead"
                sub={`${HEADQUARTERS.legalName} assembles every Volt, Storm, and Cruise at ${HEADQUARTERS.street}. Precision assembly, certified packs, and a parts shelf that stays stocked.`}
                align="left"
              />
              <div className="model-actions">
                <a
                  className="btn btn-ghost-dark"
                  href={mapsSearchUrl(HEADQUARTERS.mapsQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Maps
                </a>
                <Link className="btn btn-ghost-dark" to="/dealers/locate">
                  Find a Showroom
                </Link>
              </div>
            </div>
            <a
              className="manesar-map"
              href={mapsSearchUrl(HEADQUARTERS.mapsQuery)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Amptron headquarters in Maps"
            >
              <img
                src={hqMap}
                alt="Map of IMT Manesar, Gurugram, showing the Amptron plant"
                width={900}
                height={600}
                loading="lazy"
                decoding="async"
              />
            </a>
          </div>
        </section>

        <section className="cta-band">
          <div className="wrap cta-band-inner">
            <div>
              <h2>Two channels. One brand.</h2>
              <p>
                Riders buy from Amptron directly, and dealers stock Amptron beside
                the EV brands they already sell. Same machine. Same backing. Never
                exclusive.
              </p>
            </div>
            <div className="cta-band-actions">
              <a className="btn btn-primary" href="/#buy">
                Buy Amptron
              </a>
              <Link className="btn btn-ghost" to="/#contact">
                Stock Amptron
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
