import users from '../assets/icons/users.svg'
import mapPin from '../assets/icons/map-pin.svg'
import smile from '../assets/icons/smile.svg'
import { dealerTrust } from '../data/companyFacts'
import SectionHeader from './ui/SectionHeader'

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

const trustIcons = [users, mapPin, smile]

export default function Dealers() {
  return (
    <section className="dealers" id="dealers">
      <div className="wrap">
        <SectionHeader
          eyebrow="Join Us"
          title="Partner With Amptron"
          sub="We supply Amptron scooters to established EV dealers. No exclusive dealership required. Stock Amptron next to the brands you already sell."
        />
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
            {dealerTrust.map((item, index) => (
              <div className="trust-item" key={item.id}>
                <img src={trustIcons[index]} alt="" width={20} height={20} />
                {item.value} {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
