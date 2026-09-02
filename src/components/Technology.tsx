import { useSiteContent } from '../lib/siteContent'

const features = [
  {
    num: '01',
    title: 'Advanced Lithium-Ion Battery Packs',
    copy: 'AIS 156 Phase 2 certified cells equipped with smart temperature control and redundant BMS fail-safes.',
  },
  {
    num: '02',
    title: 'BLDC Hub Motors',
    copy: 'High-efficiency, dust-and-waterproof (IP67) brushless motors offering immediate acceleration with zero noise.',
  },
  {
    num: '03',
    title: 'Smart Connected Dashboard',
    copy: 'Multi-color interactive TFT consoles with onboard GPS tracking, dynamic anti-theft, and remote telemetry diagnostics.',
  },
  {
    num: '04',
    title: 'Regenerative Braking',
    copy: 'Harvest kinetic energy during deceleration to feed charge back to batteries, effectively stretching range by 8-10%.',
  },
]

export default function Technology() {
  const { media } = useSiteContent()

  return (
    <section className="tech" id="technology">
      <div className="tech-left">
        <header className="section-header section-header--left">
          <div className="eyebrow">
            <span className="eyebrow-bar" />
            Engineering
          </div>
          <h2 className="section-title section-title--light">
            Engineering Excellence
          </h2>
        </header>
        <div className="tech-list">
          {features.map((item) => (
            <article className="tech-item" key={item.num}>
              <div className="tech-num">{item.num}</div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="tech-media">
        <img
          src={media.techCutaway}
          alt="Technical cutaway of an Amptron electric scooter"
          width={1200}
          height={933}
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  )
}
