import heroScooter from '../assets/images/hero-scooter.webp'
import heroShowcase from '../assets/videos/hero-showcase.mp4'
import ellipse from '../assets/icons/ellipse.svg'

export default function Hero() {
  return (
    <section className="hero" id="top">
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
          Certified electric scooters. Buy from Amptron directly, or from a partner
          showroom. Precision-assembled in India, built for the road ahead.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#buy">
            Buy Amptron
          </a>
          <a className="btn btn-ghost" href="#contact">
            Stock Amptron
          </a>
        </div>
      </div>
      <div className="hero-media">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={heroScooter}
          aria-label="Amptron electric scooter product showcase"
          width={720}
          height={720}
          disablePictureInPicture
          ref={(video) => {
            if (video) video.muted = true
          }}
        >
          <source src={heroShowcase} type="video/mp4" />
        </video>
      </div>
    </section>
  )
}
