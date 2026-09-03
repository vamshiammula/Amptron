import logo from '../assets/images/logo-light.svg'
import linkedin from '../assets/icons/linkedin.svg'
import twitter from '../assets/icons/twitter.svg'
import instagram from '../assets/icons/instagram.svg'
import facebook from '../assets/icons/facebook.svg'

const columns = [
  {
    title: 'Products',
    links: [
      ['Amptron Volt', '/models/amptron-volt'],
      ['Amptron Storm', '/models/amptron-storm'],
      ['Amptron Cruise', '/models/amptron-cruise'],
      ['Compare Fleet', '/models'],
    ],
  },
  {
    title: 'Ride',
    links: [
      ['Buy Amptron', '/#buy'],
      ['Book a Test Ride', '/#buy'],
      ['Find a Showroom', '/dealers/locate'],
      ['Warranty Policy', '/warranty'],
    ],
  },
  {
    title: 'Dealers',
    links: [
      ['Stock Amptron', '/#contact'],
      ['Dealer Login', '/portal/login'],
      ['Dealer Support Portal', '/portal'],
    ],
  },
  {
    title: 'Legal',
    links: [
      ['Privacy Policy', '/privacy'],
      ['Terms of Service', '/terms'],
      ['Contact Support', '/#buy'],
    ],
  },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <img src={logo} alt="Amptron" width={400} height={80} loading="lazy" />
          <p>
            Certified electric scooters, assembled in India. Buy from Amptron or
            from a partner showroom. Same machine, same backing.
          </p>
        </div>
        <div className="footer-cols">
          {columns.map((column) => (
            <div className="footer-col" key={column.title}>
              <h4>{column.title}</h4>
              {column.links.map(([label, href]) => (
                <a key={label} href={href}>
                  {label}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} Amptron Manufacturing Pvt. Ltd. All rights
          reserved.
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
