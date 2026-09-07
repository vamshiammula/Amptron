import Icon from './ui/Icon'
import { Link } from 'react-router-dom'
import { useSiteContent } from '../lib/siteContent'
import HeroFilm from './HeroFilm'

export default function Hero() {
  const { models } = useSiteContent()
  const featured = models.find((model) => model.featured) ?? models[0]
  return (
    <section className="hero hero--studio" id="top">
      <div className="wrap studio-hero-grid">
        <div className="studio-hero-copy">
          <p className="eyebrow">Electric mobility / Amptron</p>
          <h1>
            Built to move
            <br />
            forward.
          </h1>
          <p className="hero-lead">
            Electric scooters for your everyday. Find the model that fits the way
            you move.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/models">
              Explore scooters <Icon name="arrow-right" />
            </Link>
            <Link className="btn btn-ghost-dark" to="/book-test-ride">
              Book a Test Ride
            </Link>
          </div>
          <p className="studio-hero-aside">
            For riders. For dealers. For the road ahead.
          </p>
        </div>
        {featured ? (
          <HeroFilm key={featured.slug} model={featured} />
        ) : (
          <div className="stage-empty">
            <h2>The next chapter is on its way.</h2>
            <p>Our model catalog is being updated.</p>
          </div>
        )}
      </div>
    </section>
  )
}
