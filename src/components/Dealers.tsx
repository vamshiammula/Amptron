import users from '../assets/icons/users.svg'
import mapPin from '../assets/icons/map-pin.svg'
import smile from '../assets/icons/smile.svg'

const steps = [
  {
    num: '01',
    title: 'Apply',
    copy: 'Share your existing EV retail footprint: brands you already sell, cities you cover, and service capacity.',
  },
  {
    num: '02',
    title: 'Onboarding',
    copy: 'Product training, spare stocking guidance, and service escalation so Amptron fits your current showroom.',
  },
  {
    num: '03',
    title: 'Stock',
    copy: 'Receive Amptron inventory to sell alongside the other EV scooter brands already on your floor.',
  },
  {
    num: '04',
    title: 'Grow',
    copy: 'Ongoing parts supply, warranty swaps, and a relationship manager as you scale Amptron in your mix.',
  },
]

export default function Dealers() {
  return (
    <section className="dealers" id="dealers">
      <header className="section-header">
        <div className="eyebrow">
          <span className="eyebrow-bar" />
          Join Us
        </div>
        <h2 className="section-title">Partner With Amptron</h2>
        <p className="section-sub">
          We supply Amptron scooters to established EV dealers. No exclusive
          dealership required. Stock Amptron next to the other brands you already
          sell. Riders can also buy from us directly.
        </p>
      </header>
      <div className="steps">
        {steps.map((step) => (
          <article className="step" key={step.num}>
            <div className="step-num">{step.num}</div>
            <h3>{step.title}</h3>
            <p>{step.copy}</p>
          </article>
        ))}
      </div>
      <div className="dealer-cta">
        <a className="btn btn-primary" href="/#contact">
          Enquire to Stock Amptron
        </a>
        <div className="trust">
          <div className="trust-item">
            <img src={users} alt="" width={20} height={20} />
            150+ Dealer Partners
          </div>
          <div className="trust-item">
            <img src={mapPin} alt="" width={20} height={20} />
            22 States Covered
          </div>
          <div className="trust-item">
            <img src={smile} alt="" width={20} height={20} />
            98% Dealer Satisfaction
          </div>
        </div>
      </div>
    </section>
  )
}
