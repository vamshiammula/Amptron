import { Link } from 'react-router-dom'
import { useSiteContent } from '../lib/siteContent'
import ModelCard from './ui/ModelCard'
import Reveal from './ui/Reveal'
import SectionHeader from './ui/SectionHeader'

export default function ModelRail() {
  const { models } = useSiteContent()

  return (
    <section className="model-rail" id="products">
      <div className="wrap">
        <SectionHeader
          eyebrow="Find your everyday"
          title="Choose your Amptron"
          sub="Compare range, charging, and price. Find the scooter that fits the way you move."
        />
      </div>
      <div className="model-rail-track">
        {models.map((model) => (
          <Reveal className="model-rail-card-wrap" key={model.slug}>
            <ModelCard model={model} />
          </Reveal>
        ))}
      </div>
      <div className="wrap model-rail-foot">
        <Link to="/models#compare">Compare all models side by side</Link>
      </div>
    </section>
  )
}
