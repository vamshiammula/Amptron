import { useSiteContent } from '../lib/siteContent'
import SectionHeader from './ui/SectionHeader'

const features = [
  {
    num: '01',
    title: 'Lithium-ion battery packs',
    copy: 'AIS 156 Phase 2 certified cells with temperature control and a redundant BMS. The pack is specified to last, not to advertise.',
  },
  {
    num: '02',
    title: 'BLDC hub motors',
    copy: 'Dust-and-waterproof (IP67) brushless motors. Immediate acceleration, quiet running, fewer parts to service.',
  },
  {
    num: '03',
    title: 'A dashboard you will actually use',
    copy: 'Ride data, range remaining, and the alerts that keep a commute predictable. Features stay on the machine only when they earn their place.',
  },
  {
    num: '04',
    title: 'Regenerative braking',
    copy: 'Kinetic energy harvested during deceleration feeds charge back to the battery. Specified on Volt, Storm, and Cruise.',
  },
]

export default function Technology() {
  const { media } = useSiteContent()

  return (
    <section className="tech" id="technology">
      <div className="wrap tech-grid">
        <div className="tech-left">
          <SectionHeader
            eyebrow="Engineering"
            title="Built around what you actually need"
            light
            align="left"
          />
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
      </div>
    </section>
  )
}
