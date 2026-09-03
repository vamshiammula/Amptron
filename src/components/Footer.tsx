import { Link } from 'react-router-dom'
import logo from '../assets/images/logo-light.svg'
import linkedin from '../assets/icons/linkedin.svg'
import twitter from '../assets/icons/twitter.svg'
import instagram from '../assets/icons/instagram.svg'
import facebook from '../assets/icons/facebook.svg'
import { HEADQUARTERS } from '../data/headquarters'
import { formatInr } from '../data/pricing'
import { useSiteContent } from '../lib/siteContent'

export default function Footer() {
  const { models } = useSiteContent()
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="wrap footer-top">
        <div className="footer-brand">
          <img src={logo} alt="Amptron" width={400} height={80} loading="lazy" />
          <p>
            Certified electric scooters, assembled in India. Buy from Amptron or
            from a partner showroom. Same machine, same backing.
          </p>
        </div>
        <div className="footer-cols">
          <div className="footer-col">
            <h4>Scooters</h4>
            {models.map((model) => (
              <span key={model.slug}>
                <Link to={`/models/${model.slug}`}>{model.name}</Link>
                {model.pricing ? (
                  <small>
                    Starting at {formatInr(model.pricing.exShowroomInr)}
                  </small>
                ) : null}
              </span>
            ))}
            <Link to="/models">Compare Fleet</Link>
          </div>
          <div className="footer-col">
            <h4>Ride</h4>
            <a href="/#buy">Buy Amptron</a>
            <Link to="/book-test-ride">Book a Test Ride</Link>
            <Link to="/dealers/locate">Find a Showroom</Link>
            <Link to="/ownership-calculator">Savings calculator</Link>
            <Link to="/warranty">Warranty Policy</Link>
          </div>
          <div className="footer-col">
            <h4>Dealers</h4>
            <a href="/#contact">Stock Amptron</a>
            <Link to="/portal/login">Dealer Login</Link>
            <Link to="/portal">Dealer Support Portal</Link>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <Link to="/about">About Amptron</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <a href="/#buy">Contact Support</a>
          </div>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <p>
          © {year} {HEADQUARTERS.legalName} {HEADQUARTERS.street}
        </p>
        <div className="socials">
          <a href="https://www.linkedin.com/company/amptron" aria-label="LinkedIn">
            <img src={linkedin} alt="" width={16} height={16} />
          </a>
          <a href="https://x.com/amptron_ev" aria-label="X">
            <img src={twitter} alt="" width={16} height={16} />
          </a>
          <a href="https://www.instagram.com/amptron_ev" aria-label="Instagram">
            <img src={instagram} alt="" width={16} height={16} />
          </a>
          <a href="https://www.facebook.com/amptron.ev" aria-label="Facebook">
            <img src={facebook} alt="" width={16} height={16} />
          </a>
        </div>
      </div>
    </footer>
  )
}
