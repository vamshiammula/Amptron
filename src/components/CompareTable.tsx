import { Link } from 'react-router-dom'
import { COMPARE_ROWS, specValue, type ScooterModel } from '../data/models'
import { EMI_FOOTNOTE, formatInr, monthlyEmi } from '../data/pricing'
import SectionHeader from './ui/SectionHeader'

interface CompareTableProps {
  models: ScooterModel[]
  heading?: string
  /** Slug of the model currently being viewed, highlighted in the table. */
  activeSlug?: string
}

export default function CompareTable({
  models,
  heading = 'Compare Amptron',
  activeSlug,
}: CompareTableProps) {
  const cellClass = (slug: string) =>
    slug === activeSlug ? 'compare-active' : undefined

  return (
    <section className="compare-block page-section" id="compare">
      <div className="wrap">
        <SectionHeader
          eyebrow="Catalog"
          title={heading}
          sub="Certified specs side by side. Price is indicative until booking."
        />
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th scope="col">
                  <span className="compare-th-label">Model</span>
                </th>
                {models.map((model) => (
                  <th
                    scope="col"
                    key={model.slug}
                    className={cellClass(model.slug)}
                    aria-label={model.name}
                  >
                    <Link to={`/models/${model.slug}`} className="compare-model">
                      <img
                        src={model.image}
                        alt=""
                        width={160}
                        height={100}
                        loading="lazy"
                        decoding="async"
                      />
                      <span>
                        <strong>{model.name}</strong>
                        {model.featured ? <small>Most Popular</small> : null}
                      </span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Starting at</th>
                {models.map((model) => (
                  <td key={model.slug} className={cellClass(model.slug)}>
                    <strong>
                      {model.pricing
                        ? formatInr(model.pricing.exShowroomInr)
                        : 'On request'}
                    </strong>
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">EMI from</th>
                {models.map((model) => (
                  <td key={model.slug} className={cellClass(model.slug)}>
                    {model.pricing
                      ? `${formatInr(monthlyEmi(model.pricing.exShowroomInr))}/month*`
                      : 'n/a'}
                  </td>
                ))}
              </tr>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {models.map((model) => (
                    <td key={model.slug} className={cellClass(model.slug)}>
                      {specValue(model, row.specLabel ?? row.label)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="compare-actions">
                <th scope="row">
                  <span className="sr-only">Actions</span>
                </th>
                {models.map((model) => (
                  <td key={model.slug} className={cellClass(model.slug)}>
                    <Link
                      className="btn btn-primary btn-sm"
                      to={`/models/${model.slug}`}
                    >
                      Explore
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="emi-note">*{EMI_FOOTNOTE}</p>
      </div>
    </section>
  )
}
