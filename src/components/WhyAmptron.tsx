import settings from '../assets/icons/settings.svg'
import shield from '../assets/icons/shield.svg'
import user from '../assets/icons/user.svg'
import trendingUp from '../assets/icons/trending-up.svg'

const advantages = [
  {
    icon: user,
    title: 'Buy Direct or Local',
    copy: 'Purchase from Amptron or pick up at a partner showroom. Same certified scooter, same warranty, no exclusive lock-in.',
  },
  {
    icon: shield,
    title: 'Full Compliance',
    copy: 'All Amptron models are certified by iCAT & ARAI, so registration and national state subsidy pass-through stay straightforward.',
  },
  {
    icon: settings,
    title: 'Precision Assembly',
    copy: 'Robotic assembly and multi-stage QA deliver a defect-free machine — to your door or to the showroom floor.',
  },
  {
    icon: trendingUp,
    title: 'Service That Stays',
    copy: 'Parts, structured warranty claims, and trained workshops behind every ride. Dealers get a relationship manager and marketing kits.',
  },
]

export default function WhyAmptron() {
  return (
    <section className="why" id="why">
      <header className="section-header">
        <div className="eyebrow">
          <span className="eyebrow-bar" />
          Why Amptron
        </div>
        <h2 className="section-title">Built to Ride. Backed to Sell.</h2>
        <p className="section-sub">
          Certified electric scooters for riders who want to buy from us, and for
          dealers who stock Amptron beside the brands they already sell.
        </p>
      </header>
      <div className="why-grid">
        {advantages.map((item) => (
          <article className="why-card" key={item.title}>
            <div className="why-icon">
              <img src={item.icon} alt="" width={28} height={28} />
            </div>
            <div>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
