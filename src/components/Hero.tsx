import { Link } from 'react-router-dom'
import heroScooter from '../assets/images/hero-scooter.webp'
import heroShowcase from '../assets/videos/hero-showcase.mp4'
import ellipse from '../assets/icons/ellipse.svg'
import { formatInr, monthlyEmi } from '../data/pricing'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'
import { useSiteContent } from '../lib/siteContent'

export default function Hero() {
  const { media, models } = useSiteContent()
  const reducedMotion = usePrefersReducedMotion()
  const storm = models.find((model) => model.featured) ?? models[1]
  const poster = media.heroPoster || heroScooter
  const video = media.heroVideo || heroShowcase

  return (
    <section className="hero" id="top">
      <div className="hero-media">
        <video
          autoPlay={!reducedMotion}
          muted
          loop={!reducedMotion}
          playsInline
          preload="metadata"
          poster={poster}
          aria-label="Amptron electric scooter product showcase"
          width={1920}
          height={1080}
          disablePictureInPicture
          ref={(node) => {
            if (node) node.muted = true
          }}
        >
          <source src={video} type="video/mp4" />
        </video>
        <div className="hero-shade" />
      </div>
      <div className="hero-copy">
        <div className="hero-badge">
          <img src={ellipse} alt="" width={8} height={8} />
          <span>Buy Direct · Partner Showrooms Open</span>
        </div>
        <h1>
          Powering India&apos;s
          <br />
          Electric Future
        </h1>
        <p className="hero-lead">
          Certified electric scooters. Dependable electric mobility without
          unnecessary complexity.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#buy">
            Buy Amptron
          </a>
          <Link className="btn btn-ghost" to="/book-test-ride">
            Book a Test Ride
          </Link>
        </div>
        <p className="hero-aside">
          Also available at partner showrooms.{' '}
          <Link to="/dealers/locate">Find a Showroom</Link>
        </p>
        {storm?.pricing ? (
          <div className="hero-chip">
            <small>{storm.name} · Most Popular</small>
            <strong>
              {formatInr(storm.pricing.exShowroomInr)} or{' '}
              {formatInr(monthlyEmi(storm.pricing.exShowroomInr))}/month*
            </strong>
          </div>
        ) : null}
      </div>
    </section>
  )
}
