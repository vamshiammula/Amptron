import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/images/logo.svg'
import menuIcon from '../assets/icons/menu.svg'

const links = [
  { href: '/models', label: 'Products' },
  { href: '/dealers/locate', label: 'Find a Showroom' },
  { href: '/portal/login', label: 'Dealer Login' },
  { href: '/blog', label: 'Blog' },
  { href: '/#buy', label: 'Contact' },
]

const DRAWER_ID = 'nav-drawer'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <header className="nav">
      <Link to="/" className="nav-logo" aria-label="Amptron home">
        <img src={logo} alt="Amptron" width={400} height={80} />
      </Link>
      <nav className="nav-links" aria-label="Primary">
        {links.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
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
      {/* `inert` keeps the collapsed drawer out of the tab order and off screen readers. */}
      <nav
        id={DRAWER_ID}
        className={`nav-drawer${open ? ' is-open' : ''}`}
        aria-label="Mobile"
        inert={!open}
      >
        {links.map((link) => (
          <a key={link.href} href={link.href} onClick={close}>
            {link.label}
          </a>
        ))}
        <a className="btn btn-primary" href="/#buy" onClick={close}>
          Buy Amptron
        </a>
      </nav>
    </header>
  )
}
