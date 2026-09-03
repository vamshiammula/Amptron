import { companyStats } from '../data/companyFacts'
import StatCounter from './ui/StatCounter'

export default function Numbers() {
  return (
    <section className="numbers" aria-label="Amptron at a glance">
      <div className="wrap numbers-grid">
        {companyStats.map((stat) => (
          <StatCounter
            key={stat.id}
            value={stat.value}
            suffix={stat.suffix}
            label={stat.label}
            decimals={stat.suffix === '%' ? 1 : 0}
          />
        ))}
      </div>
    </section>
  )
}
