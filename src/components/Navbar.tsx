import { useEffect, useId, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/images/logo.svg'
import menuIcon from '../assets/icons/menu.svg'
import { formatInr, monthlyEmi } from '../data/pricing'
import { useSiteContent } from '../lib/siteContent'

const DRAWER_ID = 'nav-drawer'

export default function Navbar() {
  const { models } = useSiteContent()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(
    () => typeof window !== 'undefined' && window.scrollY > 24,
  )
  const [pathForDrawer, setPathForDrawer] = useState(location.pathname)
  const megaId = useId()

  if (location.pathname !== pathForDrawer) {
    setPathForDrawer(location.pathname)
    if (open) setOpen(false)
  }

  const close = () => setOpen(false)
  const overHero = isHome && !scrolled

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('nav-lock', open)
    return () => document.body.classList.remove('nav-lock')
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const navClass = [
    'nav',
    isHome ? 'nav--home' : '',
    overHero ? 'nav--over-hero' : 'nav--solid',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <header className={navClass}>
      <Link to="/" className="nav-logo" aria-label="Amptron home">
        <img src={logo} alt="Amptron" width={400} height={80} />
      </Link>
      <nav className="nav-links" aria-label="Primary">
        <div className="nav-mega">
          <Link to="/models" id={megaId} className="nav-mega-toggle">
            Scooters
          </Link>
          <div className="nav-mega-panel" aria-labelledby={megaId}>
            {models.map((model) => (
              <Link
                key={model.slug}
                className="nav-mega-item"
                to={`/models/${model.slug}`}
              >
                <img src={model.image} alt="" width={180} height={120} />
                <strong>{model.name}</strong>
                <span>
                  {model.highlights[0]?.value} range
                  {model.pricing
                    ? ` · ${formatInr(model.pricing.exShowroomInr)}`
                    : ''}
                </span>
              </Link>
            ))}
            <Link className="nav-mega-more" to="/models">
              Compare all models
            </Link>
          </div>
        </div>
        <Link to="/about">About</Link>
        <Link to="/dealers/locate">Find a Showroom</Link>
        <Link to="/ownership-calculator">Savings calculator</Link>
        <Link to="/blog">Blog</Link>
        <Link to="/portal/login">Dealer Login</Link>
      </nav>
      <a className="btn btn-primary nav-cta" href="/#buy">
        Buy Amptron
      </a>
      <button
        className="nav-menu"
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls={DRAWER_ID}
        onClick={() => setOpen((value) => !value)}
      >
        <img src={menuIcon} alt="" width={20} height={20} />
      </button>
      <nav
        id={DRAWER_ID}
        className={`nav-drawer${open ? ' is-open' : ''}`}
        aria-label="Mobile"
        inert={!open}
      >
        <p className="eyebrow">
          <span className="eyebrow-bar" />
          Scooters
        </p>
        <div className="nav-drawer-models">
          {models.map((model) => (
            <Link key={model.slug} to={`/models/${model.slug}`} onClick={close}>
              <img src={model.image} alt="" width={72} height={48} />
              <span>
                <strong>{model.name}</strong>
                <span>
                  {model.pricing
                    ? `${formatInr(model.pricing.exShowroomInr)} · ${formatInr(monthlyEmi(model.pricing.exShowroomInr))}/mo*`
                    : model.highlights[0]?.value}
                </span>
              </span>
            </Link>
          ))}
        </div>
        <Link to="/models" onClick={close}>
          Compare all models
        </Link>
        <Link to="/about" onClick={close}>
          About
        </Link>
        <Link to="/dealers/locate" onClick={close}>
          Find a Showroom
        </Link>
        <Link to="/ownership-calculator" onClick={close}>
          Savings calculator
        </Link>
        <Link to="/blog" onClick={close}>
          Blog
        </Link>
        <Link to="/portal/login" onClick={close}>
          Dealer Login
        </Link>
        <a className="btn btn-primary" href="/#buy" onClick={close}>
          Buy Amptron
        </a>
      </nav>
    </header>
  )
}
