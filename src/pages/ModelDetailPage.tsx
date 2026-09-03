import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Seo from '../components/Seo'
import MediaFrame from '../components/ui/MediaFrame'
import PriceTag from '../components/ui/PriceTag'
import Reveal from '../components/ui/Reveal'
import SectionHeader from '../components/ui/SectionHeader'
import {
  EMI_DEFAULTS,
  EMI_FOOTNOTE,
  formatInr,
  monthlyEmi,
} from '../data/pricing'
import { chapterImages, heroStill } from '../lib/modelMedia'
import { useScooterModel, useSiteContent } from '../lib/siteContent'
import { useActiveSection } from '../lib/useActiveSection'
import { FAQ_SEED } from '@shared/faqSeed'

const ProductViewer = lazy(
  () => import('../components/product-viewer/ProductViewer'),
)

const SPEC_GROUPS: Array<{ title: string; labels: string[] }> = [
  {
    title: 'Dimensions',
    labels: [
      'Dimensions (L x W x H)',
      'Wheelbase',
      'Ground Clearance',
      'Kerb Weight',
      'Payload',
    ],
  },
  {
    title: 'Powertrain',
    labels: [
      'Motor Output',
      'Battery Type',
      'Battery Capacity',
      'System Voltage',
      'Range Per Charge',
    ],
  },
  {
    title: 'Charging and chassis',
    labels: [
      'Charger Input',
      'Charger Output',
      'Charging Time',
      'Front Suspension',
      'Rear Suspension',
      'Tyres',
      'Brakes',
    ],
  },
]

const SECTION_LINKS = [
  { id: 'overview', label: 'Overview' },
  { id: 'features', label: 'Features' },
  { id: 'specs', label: 'Specs' },
  { id: 'emi', label: 'Price' },
  { id: 'buy', label: 'Buy' },
]
const SECTION_IDS = SECTION_LINKS.map((link) => link.id)

export default function ModelDetailPage() {
  const { slug = '' } = useParams()
  const { models, productViewers } = useSiteContent()
  const model = useScooterModel(slug)
  const [colour, setColour] = useState(0)
  const active = useActiveSection(SECTION_IDS)
  const heroRef = useRef<HTMLElement>(null)
  const subnavRef = useRef<HTMLElement>(null)
  const [pastHero, setPastHero] = useState(false)

  useEffect(() => {
    const hero = heroRef.current
    if (!hero || typeof IntersectionObserver === 'undefined') return

    const navH =
      Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-h'),
      ) || 72
    const subnavH = subnavRef.current?.offsetHeight ?? 56
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        setPastHero(!entry.isIntersecting)
      },
      { rootMargin: `-${navH + subnavH}px 0px 0px 0px`, threshold: 0 },
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  const faqs = useMemo(() => {
    const shortName = model?.name.split(' ')[1]?.toLowerCase() ?? '___'
    return FAQ_SEED.filter(
      (item) =>
        item.question.toLowerCase().includes(shortName) ||
        ['how-to-buy', 'test-ride', 'warranty'].includes(item.slug),
    ).slice(0, 6)
  }, [model])

  if (!model) {
    return <Navigate to="/models" replace />
  }

  const viewer = productViewers[model.slug]
  const colours = model.colours ?? []
  const activeColour = colours[Math.min(colour, colours.length - 1)]
  const colorwayFor = (name?: string) =>
    viewer?.colorways?.find((way) => way.name === name)
  const activeColorway = colorwayFor(activeColour?.name)
  // The picker only changes the picture when a viewer colorway or a per-colour still exists.
  const coloursArePreviewable =
    colours.length > 1 &&
    colours.every((item) => Boolean(item.image) || Boolean(colorwayFor(item.name)))
  const related = models.filter((candidate) => candidate.slug !== slug)
  const media = chapterImages(model, viewer)
  const still = heroStill(model, viewer)
  const price = model.pricing?.exShowroomInr
  const emi = price ? monthlyEmi(price) : null

  return (
    <>
      <Seo
        title={`${model.name}: Specifications and Features`}
        description={`${model.name}: ${model.tagline} Certified specs, charging profile, and features. Buy from Amptron or find a showroom.`}
        path={`/models/${model.slug}`}
      />
      <nav ref={subnavRef} className="model-subnav" aria-label="On this page">
        <div className="wrap model-subnav-inner">
          <div className="model-subnav-links">
            {SECTION_LINKS.map((link) => (
              <a
                href={`#${link.id}`}
                key={link.id}
                className={active === link.id ? 'is-active' : undefined}
                aria-current={active === link.id ? 'true' : undefined}
              >
                {link.label}
              </a>
            ))}
          </div>
          {pastHero ? (
            <div className="model-subnav-buy">
              <strong>
                {model.name}
                {price ? ` · ${formatInr(price)}` : ''}
              </strong>
              <a className="btn btn-primary btn-sm" href="/#buy">
                Buy Amptron
              </a>
            </div>
          ) : null}
        </div>
      </nav>

      <main id="main" className="site-page model-page">
        <section ref={heroRef} className="model-hero-band" id="overview">
          <div className="wrap model-hero">
            <div className="model-hero-media">
              {viewer ? (
                <Suspense
                  fallback={
                    <MediaFrame
                      src={still}
                      alt={`${model.name} electric scooter`}
                      eager
                      ratio="1 / 1"
                    />
                  }
                >
                  <ProductViewer
                    model={model}
                    config={viewer}
                    embedded
                    colorwayId={activeColorway?.id}
                    onColorwayChange={(id) => {
                      const way = viewer.colorways?.find((item) => item.id === id)
                      const index = colours.findIndex(
                        (item) => item.name === way?.name,
                      )
                      if (index >= 0) setColour(index)
                    }}
                  />
                </Suspense>
              ) : (
                <MediaFrame
                  src={activeColour?.image || model.image}
                  alt={`${model.name}${activeColour ? ` in ${activeColour.name}` : ''}`}
                  eager
                  ratio="4 / 3"
                />
              )}
            </div>
            <div className="model-hero-copy">
              <div className="eyebrow">
                <span className="eyebrow-bar" />
                {model.featured ? 'Most Popular' : 'Amptron scooter'}
              </div>
              <h1>{model.name}</h1>
              <p className="model-hero-tagline">{model.tagline}</p>
              <PriceTag pricing={model.pricing} />
              {colours.length > 0 ? (
                <div className="model-colours">
                  <p className="model-colours-label">
                    <span>{coloursArePreviewable ? 'Colour' : 'Colours'}</span>
                    <strong>
                      {coloursArePreviewable
                        ? activeColour?.name
                        : colours.map((item) => item.name).join(' · ')}
                    </strong>
                  </p>
                  {coloursArePreviewable ? (
                    <fieldset className="colour-list">
                      <legend className="sr-only">Colour</legend>
                      {colours.map((item, index) => (
                        <button
                          key={item.name}
                          type="button"
                          aria-label={item.name}
                          aria-pressed={index === colour}
                          className={`colour-dot${index === colour ? ' is-active' : ''}`}
                          onClick={() => setColour(index)}
                        >
                          <i style={{ background: item.hex }} />
                        </button>
                      ))}
                    </fieldset>
                  ) : (
                    <ul className="colour-list" aria-label="Available colours">
                      {colours.map((item) => (
                        <li
                          key={item.name}
                          className="colour-dot"
                          title={item.name}
                        >
                          <i style={{ background: item.hex }} />
                          <span className="sr-only">{item.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {activeColorway?.filter ? (
                    <small className="colour-note">
                      Digital preview of this finish on the photographed set.
                    </small>
                  ) : null}
                </div>
              ) : null}
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
                <Link className="btn btn-ghost-dark" to="/book-test-ride">
                  Book a Test Ride
                </Link>
              </div>
              <p className="model-hero-aside">
                Also available at partner showrooms.{' '}
                <Link to="/dealers/locate">Find a Showroom</Link>
              </p>
            </div>
          </div>
        </section>

        {model.story && model.story.length > 0 ? (
          <section className="page-section" id="features">
            <div className="wrap">
              <SectionHeader
                eyebrow="Built for the ride"
                title={`What ${model.name} is built around`}
                sub={model.description}
              />
              <div className="chapter-list">
                {model.story.map((chapter, index) => (
                  <Reveal
                    as="article"
                    className={`chapter${index % 2 === 1 ? ' chapter--flip' : ''}`}
                    key={chapter.title}
                  >
                    <div className="chapter-copy">
                      <div className="eyebrow">
                        <span className="eyebrow-bar" />
                        {chapter.eyebrow}
                      </div>
                      <h3>{chapter.title}</h3>
                      <p>{chapter.body}</p>
                    </div>
                    <MediaFrame
                      className="chapter-media"
                      src={media[index]?.src ?? model.image}
                      alt={media[index]?.alt ?? chapter.title}
                      ratio={media[index]?.ratio ?? '3 / 2'}
                    />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="page-section page-section--fog" id="specs">
          <div className="wrap">
            <SectionHeader
              eyebrow="Specifications"
              title="Certified numbers, not estimates"
              sub="Every figure below is what we publish on the spec sheet. Range and charge time are certified values."
            />
            <div className="spec-groups">
              {SPEC_GROUPS.map((group) => (
                <article className="spec-panel" key={group.title}>
                  <h3>{group.title}</h3>
                  <div className="spec-table">
                    {group.labels.map((label) => {
                      const spec = model.specs.find((row) => row.label === label)
                      if (!spec) return null
                      return (
                        <div className="spec-row" key={label}>
                          <span>{label}</span>
                          <strong>{spec.value}</strong>
                        </div>
                      )
                    })}
                  </div>
                </article>
              ))}
              <article className="spec-panel spec-panel--features">
                <h3>On the machine</h3>
                <ul className="feature-grid">
                  {model.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        {price && emi ? (
          <section className="page-section" id="emi">
            <div className="wrap">
              <div className="emi-card">
                <div className="emi-card-copy">
                  <div className="eyebrow">
                    <span className="eyebrow-bar" />
                    Price and EMI
                  </div>
                  <h2>
                    {model.name} from {formatInr(price)}
                  </h2>
                  <p>
                    You should not have to pay for things you do not need. The price
                    covers the scooter, the charger, and the backing behind it:
                    warranty, spares, and trained workshops.
                  </p>
                  <p className="emi-card-links">
                    <Link to="/models#compare">Compare all three</Link>
                  </p>
                </div>
                <dl className="emi-facts">
                  <div>
                    <dt>Starting price</dt>
                    <dd>{formatInr(price)}</dd>
                  </div>
                  <div>
                    <dt>Estimated EMI</dt>
                    <dd>{formatInr(emi)}/month*</dd>
                  </div>
                  <div>
                    <dt>Tenure</dt>
                    <dd>{EMI_DEFAULTS.tenureMonths} months</dd>
                  </div>
                  <div>
                    <dt>Down payment</dt>
                    <dd>{formatInr(EMI_DEFAULTS.downPaymentInr)}</dd>
                  </div>
                  <p className="emi-note">*{EMI_FOOTNOTE}</p>
                </dl>
              </div>
            </div>
          </section>
        ) : null}

        <section className="page-section" id="model-faq">
          <div className="wrap wrap--narrow">
            <SectionHeader
              eyebrow="Help"
              title={`Questions about ${model.name}`}
              sub="Plain answers. If yours is not here, the assistant or a partner showroom can help."
            />
            <div className="faq-list">
              {faqs.map((item) => (
                <details className="faq-item" key={item.slug}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-band" id="buy">
          <div className="wrap cta-band-inner">
            <div>
              <h2>Buy {model.name} from Amptron, or from a partner showroom.</h2>
              <p>
                Same certified machine either way. Tell us your city and we will
                confirm a slot, a delivery, or the nearest showroom.
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
            <p className="cta-band-meta">
              <span>Also see:</span>
              {related.map((item) => (
                <Link key={item.slug} to={`/models/${item.slug}`}>
                  {item.name}
                </Link>
              ))}
              <Link to="/models#compare">Compare all three</Link>
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
