import { Link } from 'react-router-dom'
import { ownershipPoints } from '../data/companyFacts'
import SectionHeader from './ui/SectionHeader'

export default function Ownership() {
  return (
    <section className="ownership" id="ownership">
      <div className="wrap">
        <SectionHeader
          eyebrow="Supported"
          title="Service, warranty, and spares"
          sub="A scooter is only as dependable as the people who can repair it. Service and parts are part of the product."
        />
        <div className="ownership-grid">
          {ownershipPoints.map((item) => (
            <article className="ownership-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              {item.href.startsWith('/') && !item.href.startsWith('/#') ? (
                <Link to={item.href}>{item.cta}</Link>
              ) : (
                <a href={item.href}>{item.cta}</a>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
