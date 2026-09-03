import { FAQ_SEED } from '@shared/faqSeed'
import { openAmptronChat } from '../lib/openChat'
import SectionHeader from './ui/SectionHeader'

const HOME_FAQ_SLUGS = [
  'what-is-amptron',
  'which-models',
  'which-model-to-choose',
  'model-pricing',
  'how-to-buy',
  'direct-vs-showroom',
  'test-ride',
  'find-showroom',
  'running-cost-savings',
  'service-locations',
  'warranty',
  'stock-amptron',
]

export default function HomeFaq() {
  const items = HOME_FAQ_SLUGS.flatMap((slug) => {
    const row = FAQ_SEED.find((item) => item.slug === slug)
    return row ? [row] : []
  })

  return (
    <section className="home-faq" id="faq">
      <div className="wrap">
        <SectionHeader
          eyebrow="Help"
          title="Frequently asked questions"
          sub="Plain answers on buying, test rides, showrooms, and stocking Amptron."
        />
        <div className="faq-list">
          {items.map((item) => (
            <details className="faq-item" key={item.slug}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
        <p className="faq-assist">
          <button
            className="btn btn-ghost-dark"
            type="button"
            onClick={openAmptronChat}
          >
            Ask the assistant
          </button>
        </p>
      </div>
    </section>
  )
}
