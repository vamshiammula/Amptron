import { testimonials } from '../data/companyFacts'
import SectionHeader from './ui/SectionHeader'

export default function Testimonials() {
  return (
    <section className="quotes" id="testimonials">
      <div className="wrap">
        <SectionHeader
          eyebrow="Partner voices"
          title="What our dealers say"
          sub="Multi-brand showrooms that stock Amptron beside the EV brands they already sell."
        />
        <div className="quote-grid">
          {testimonials.map((item) => (
            <blockquote className="quote" key={item.name}>
              <p>{item.quote}</p>
              <footer>
                <cite>{item.name}</cite>
                <small>
                  {item.company}, <b>{item.place}</b>
                </small>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
