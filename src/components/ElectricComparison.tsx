import { useId, useState } from 'react'
import { compareElectric } from '../../shared/evComparison'
import { useSiteContent } from '../lib/siteContent'
import { formatInr, formatInrPerKm } from '../data/pricing'

export default function ElectricComparison({
  defaultSlug,
  onSlugChange,
}: {
  defaultSlug?: string
  onSlugChange?: (slug: string) => void
}) {
  const { models } = useSiteContent()
  const initial =
    models.find((m) => m.slug === defaultSlug) ??
    models.find((m) => m.featured) ??
    models[0]
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const model = models.find((m) => m.slug === (defaultSlug ?? slug)) ?? initial
  const [ownDraft, setOwn] = useState<{
    slug?: string
    purchase?: string
    batteryKwh?: string
    rangeKm?: string
  }>({})
  const [other, setOther] = useState({ purchase: '', batteryKwh: '', rangeKm: '' })
  const [daily, setDaily] = useState('30')
  const [days, setDays] = useState('25')
  const [tariff, setTariff] = useState('10')
  const [loss, setLoss] = useState('10')
  const [serviceA, setServiceA] = useState('0.22')
  const [serviceB, setServiceB] = useState('0.22')
  const [batteryA, setBatteryA] = useState('0')
  const [batteryB, setBatteryB] = useState('0')
  const id = useId()
  if (!model) return <p>No models are available for comparison yet.</p>
  const own = ownDraft.slug === model.slug ? ownDraft : {}
  const a = {
    purchase: own.purchase ?? String(model.pricing?.exShowroomInr ?? ''),
    batteryKwh: own.batteryKwh ?? String(model.batteryKwh),
    rangeKm: own.rangeKm ?? String(model.certifiedRangeKm),
  }

  const result = compareElectric(
    {
      purchase: num(a.purchase),
      batteryKwh: num(a.batteryKwh),
      rangeKm: num(a.rangeKm),
      servicePerKm: num(serviceA),
      batteryAllowance: num(batteryA),
    },
    {
      purchase: num(other.purchase),
      batteryKwh: num(other.batteryKwh),
      rangeKm: num(other.rangeKm),
      servicePerKm: num(serviceB),
      batteryAllowance: num(batteryB),
    },
    {
      dailyKm: num(daily),
      daysPerMonth: num(days),
      electricity: num(tariff),
      lossPct: num(loss),
    },
  )

  return (
    <div className="ev-comparison">
      <div className="ev-intro">
        <h2>A fair comparison. Your figures.</h2>
        <p>
          Enter the other scooter’s quote and specifications. No brand name needed.
          Use the same price basis and range test basis for both scooters.
        </p>
      </div>
      <div className="ev-grid">
        <div id={`${id}-inputs`} className="ev-inputs">
          <section className="ev-section">
            <h3>1. Choose the two scooters</h3>
            <label className="ev-field">
              Amptron model
              <select
                value={model.slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                  setOwn({})
                  onSlugChange?.(e.target.value)
                }}
              >
                {models.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="ev-note">
              Amptron starts with catalog figures; edit either side to match your
              quotes. Use ex-showroom prices for both, or on-road prices for both.
            </p>
            <div className="ev-pair">
              <fieldset>
                <legend>{model.name}</legend>
                <NumberField
                  label="Purchase price (₹)"
                  value={a.purchase}
                  onChange={(v) =>
                    setOwn({ ...own, slug: model.slug, purchase: v })
                  }
                  min={1}
                />
                <NumberField
                  label="Battery capacity (kWh)"
                  value={a.batteryKwh}
                  onChange={(v) =>
                    setOwn({ ...own, slug: model.slug, batteryKwh: v })
                  }
                  min={0.01}
                />
                <NumberField
                  label="Range per full charge (km)"
                  value={a.rangeKm}
                  onChange={(v) => setOwn({ ...own, slug: model.slug, rangeKm: v })}
                  min={1}
                />
              </fieldset>
              <fieldset>
                <legend>Other electric scooter</legend>
                <NumberField
                  label="Purchase price (₹)"
                  value={other.purchase}
                  onChange={(v) => setOther({ ...other, purchase: v })}
                  min={1}
                />
                <NumberField
                  label="Battery capacity (kWh)"
                  value={other.batteryKwh}
                  onChange={(v) => setOther({ ...other, batteryKwh: v })}
                  min={0.01}
                />
                <NumberField
                  label="Range per full charge (km)"
                  value={other.rangeKm}
                  onChange={(v) => setOther({ ...other, rangeKm: v })}
                  min={1}
                />
              </fieldset>
            </div>
            <p className="ev-note">
              Catalog range is certified range. Do not compare certified range on
              one side with real-world range on the other. These calculations
              estimate cost, not actual riding range.
            </p>
          </section>
          <section className="ev-section">
            <h3>2. Set the same daily ride</h3>
            <div className="ev-pair">
              <NumberField
                label="Daily distance (km)"
                value={daily}
                onChange={setDaily}
                min={1}
              />
              <NumberField
                label="Riding days per month"
                value={days}
                onChange={setDays}
                min={1}
                max={31}
              />
              <NumberField
                label="Electricity rate (₹/kWh)"
                value={tariff}
                onChange={setTariff}
              />
              <NumberField
                label="Charging-loss allowance (%)"
                value={loss}
                onChange={setLoss}
              />
            </div>
            <p className="ev-note">
              Distance, electricity rate and charging allowance apply equally to
              both scooters.
            </p>
          </section>
          <details className="ev-section">
            <summary>3. Adjust service and battery assumptions</summary>
            <p className="ev-note">
              Both start at the same illustrative service rate, with no battery work
              included. Replace these assumptions with estimates or quotes for each
              scooter. Battery allowances are optional five-year costs, not
              predictions of failure or warranty terms.
            </p>
            <div className="ev-pair">
              <fieldset>
                <legend>{model.name} assumptions</legend>
                <NumberField
                  label="Service cost (₹/km)"
                  value={serviceA}
                  onChange={setServiceA}
                />
                <NumberField
                  label="Five-year battery work (₹)"
                  value={batteryA}
                  onChange={setBatteryA}
                />
              </fieldset>
              <fieldset>
                <legend>Other electric scooter assumptions</legend>
                <NumberField
                  label="Service cost (₹/km)"
                  value={serviceB}
                  onChange={setServiceB}
                />
                <NumberField
                  label="Five-year battery work (₹)"
                  value={batteryB}
                  onChange={setBatteryB}
                />
              </fieldset>
            </div>
          </details>
          <a className="savings-jump" href={`#${id}-results`}>
            View your results ↓
          </a>
        </div>
        <section
          className="ev-results"
          id={`${id}-results`}
          tabIndex={-1}
          aria-label="Electric scooter comparison results"
        >
          <h3>What changes for you?</h3>
          {!result ? (
            <div className="ev-empty">
              <h4>Add your comparison figures</h4>
              <p>
                Enter a positive price, battery capacity and range for both
                scooters. Other costs can be zero. Riding days must be between 1 and
                31. Results appear when all inputs are valid.
              </p>
            </div>
          ) : (
            <>
              <div
                className={`savings-card${result.totalDifference > 0.5 ? ' savings-card--accent' : ''}`}
                aria-live="polite"
              >
                <p className="savings-card-kicker">
                  Estimated five-year ownership difference
                </p>
                <p className="ev-difference">
                  {difference(result.totalDifference)}
                </p>
                <p className="savings-card-meta">
                  For {result.monthlyKm.toLocaleString('en-IN')} km/month over five
                  years.
                </p>
              </div>
              <dl className="ev-summary">
                <div>
                  <dt>To buy</dt>
                  <dd>{difference(result.purchaseDifference)}</dd>
                </div>
                <div>
                  <dt>To run each month</dt>
                  <dd>{difference(result.monthlyDifference)}</dd>
                </div>
              </dl>
              <figure className="savings-total-chart">
                <figcaption>Total ownership cost · 5 years</figcaption>
                {[
                  {
                    label: model.name,
                    data: result.amptron,
                    color: '--data-electric',
                  },
                  {
                    label: 'Other electric scooter',
                    data: result.other,
                    color: '--data-petrol',
                  },
                ].map((row) => (
                  <div className="savings-total-row" key={row.label}>
                    <div>
                      <span>{row.label}</span>
                      <strong>{formatInr(row.data.total)}</strong>
                    </div>
                    <span className="savings-total-track" aria-hidden="true">
                      <span
                        style={{
                          width: `${(row.data.total / Math.max(result.amptron.total, result.other.total)) * 100}%`,
                          background: `var(${row.color})`,
                        }}
                      />
                    </span>
                  </div>
                ))}
              </figure>
              <div className="ev-table-wrap">
                <table className="savings-bridge">
                  <caption>The figures behind the comparison</caption>
                  <thead>
                    <tr>
                      <th scope="col">Cost</th>
                      <th scope="col">{model.name}</th>
                      <th scope="col">Other EV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        [
                          'Purchase',
                          result.amptron.purchase,
                          result.other.purchase,
                        ],
                        [
                          'Electricity / month',
                          result.amptron.energy,
                          result.other.energy,
                        ],
                        [
                          'Service / month',
                          result.amptron.service,
                          result.other.service,
                        ],
                        [
                          'Battery work / 5 years',
                          result.amptron.battery,
                          result.other.battery,
                        ],
                        [
                          'Total / 5 years',
                          result.amptron.total,
                          result.other.total,
                        ],
                      ] as const
                    ).map(([label, ownCost, otherCost]) => (
                      <tr key={label}>
                        <th scope="row">{label}</th>
                        <td>{formatInr(ownCost)}</td>
                        <td>{formatInr(otherCost)}</td>
                      </tr>
                    ))}
                    <tr>
                      <th scope="row">Ownership / km</th>
                      <td>{formatInrPerKm(result.amptron.perKm)}</td>
                      <td>{formatInrPerKm(result.other.perKm)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="ev-note">
                Explain it simply: compare the upfront price, then monthly
                electricity and service. The five-year total adds 60 months of those
                costs plus any battery allowance. A cheaper purchase does not always
                mean cheaper ownership.
              </p>
            </>
          )}
          <p className="ev-note">
            Estimate only—not a quote or a claim about any competitor. Excludes
            financing, insurance, separate taxes, resale value, subscriptions and
            unplanned repairs. Use this for outright-purchase scooters; battery
            rental or subscription plans need a separate calculation.
          </p>
          <a className="savings-jump" href={`#${id}-inputs`}>
            Adjust your figures ↑
          </a>
        </section>
      </div>
    </div>
  )
}
function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  min?: number
  max?: number
}) {
  const invalid =
    value !== '' &&
    (!Number.isFinite(Number(value)) ||
      Number(value) < min ||
      (max !== undefined && Number(value) > max))
  return (
    <label className="ev-field">
      {label}
      <input
        type="number"
        inputMode="decimal"
        step="any"
        min={min}
        max={max}
        value={value}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {invalid && (
        <span className="ev-input-error">
          Enter {min} or more{max !== undefined ? `, up to ${max}` : ''}.
        </span>
      )}
    </label>
  )
}

const num = (value: string) => (value.trim() === '' ? NaN : Number(value))
const difference = (value: number) =>
  Math.abs(value) < 0.5
    ? 'About the same'
    : `${formatInr(Math.abs(value))} ${value > 0 ? 'less with Amptron' : 'more with Amptron'}`
