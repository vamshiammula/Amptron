import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import {
  SAVINGS_DEFAULTS,
  SAVINGS_LIMITS,
  estimateSavings,
  formatInr,
  kwhPerKm,
  savingsBarPeak,
} from '../data/pricing'
import { useSiteContent } from '../lib/siteContent'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'
import type { ScooterModel } from '../data/models'
import SectionHeader from './ui/SectionHeader'

interface SavingsCalculatorProps {
  /** Preselect a model, e.g. on its detail page. */
  defaultSlug?: string
  tone?: 'white' | 'fog'
}

export default function SavingsCalculator({
  defaultSlug,
  tone = 'white',
}: SavingsCalculatorProps) {
  const { models } = useSiteContent()
  const defaultModel =
    models.find((model) => model.slug === defaultSlug) ??
    models.find((model) => model.featured) ??
    models[0] ??
    null
  const [slug, setSlug] = useState(defaultModel?.slug ?? '')
  const [dailyKm, setDailyKm] = useState<number>(SAVINGS_DEFAULTS.defaultDailyKm)
  const [petrolPrice, setPetrolPrice] = useState<number>(
    SAVINGS_DEFAULTS.petrolInrPerLitre,
  )
  const [petrolKmPerLitre, setPetrolKmPerLitre] = useState<number>(
    SAVINGS_DEFAULTS.petrolKmPerLitre,
  )
  const [electricityPrice, setElectricityPrice] = useState<number>(
    SAVINGS_DEFAULTS.electricityInrPerUnit,
  )
  const [ridingDays, setRidingDays] = useState<number>(
    SAVINGS_DEFAULTS.ridingDaysPerMonth,
  )

  const model = models.find((item) => item.slug === slug) ?? defaultModel
  const result = useMemo(() => {
    if (!model) return null
    return estimateSavings({
      dailyKm,
      kwhPerKm: kwhPerKm(model.batteryKwh, model.certifiedRangeKm),
      petrolInrPerLitre: petrolPrice,
      petrolKmPerLitre,
      electricityInrPerUnit: electricityPrice,
      ridingDaysPerMonth: ridingDays,
    })
  }, [
    dailyKm,
    electricityPrice,
    model,
    petrolKmPerLitre,
    petrolPrice,
    ridingDays,
  ])

  if (!model || !result) return null

  const peak = savingsBarPeak(
    result.monthlyPetrolInr,
    result.monthlyElectricInr,
  )
  const petrolBar = (result.monthlyPetrolInr / peak) * 100
  const amptronBar = (result.monthlyElectricInr / peak) * 100

  return (
    <section
      className={`savings${tone === 'fog' ? ' savings--fog' : ''}`}
      id="savings"
    >
      <div className="wrap">
        <SectionHeader
          eyebrow="Ownership"
          title="Plan your monthly cost"
        />
        <div className="savings-panel">
          <div className="savings-controls">
            <div className="savings-field">
              <span className="savings-field-label">Model</span>
              <ModelSelect
                models={models}
                value={model.slug}
                onChange={setSlug}
              />
            </div>
            <SliderField
              label="Daily distance"
              value={dailyKm}
              min={SAVINGS_LIMITS.minDailyKm}
              max={SAVINGS_LIMITS.maxDailyKm}
              display={`${dailyKm} km`}
              minLabel={`${SAVINGS_LIMITS.minDailyKm} km`}
              maxLabel={`${SAVINGS_LIMITS.maxDailyKm} km`}
              onChange={setDailyKm}
            />
            <div className="savings-facts">
              <SliderField
                label="Petrol price"
                value={petrolPrice}
                min={SAVINGS_LIMITS.minPetrolInrPerLitre}
                max={SAVINGS_LIMITS.maxPetrolInrPerLitre}
                display={`${formatInr(petrolPrice)}/l`}
                minLabel={formatInr(SAVINGS_LIMITS.minPetrolInrPerLitre)}
                maxLabel={formatInr(SAVINGS_LIMITS.maxPetrolInrPerLitre)}
                onChange={setPetrolPrice}
              />
              <SliderField
                label="Petrol mileage"
                value={petrolKmPerLitre}
                min={SAVINGS_LIMITS.minPetrolKmPerLitre}
                max={SAVINGS_LIMITS.maxPetrolKmPerLitre}
                display={`${petrolKmPerLitre} km/l`}
                minLabel={`${SAVINGS_LIMITS.minPetrolKmPerLitre}`}
                maxLabel={`${SAVINGS_LIMITS.maxPetrolKmPerLitre}`}
                onChange={setPetrolKmPerLitre}
              />
              <SliderField
                label="Electricity"
                value={electricityPrice}
                min={SAVINGS_LIMITS.minElectricityInrPerUnit}
                max={SAVINGS_LIMITS.maxElectricityInrPerUnit}
                display={`${formatInr(electricityPrice)}/unit`}
                minLabel={formatInr(SAVINGS_LIMITS.minElectricityInrPerUnit)}
                maxLabel={formatInr(SAVINGS_LIMITS.maxElectricityInrPerUnit)}
                onChange={setElectricityPrice}
              />
              <SliderField
                label="Riding days"
                value={ridingDays}
                min={SAVINGS_LIMITS.minRidingDaysPerMonth}
                max={SAVINGS_LIMITS.maxRidingDaysPerMonth}
                display={`${ridingDays} / month`}
                minLabel={`${SAVINGS_LIMITS.minRidingDaysPerMonth}`}
                maxLabel={`${SAVINGS_LIMITS.maxRidingDaysPerMonth}`}
                onChange={setRidingDays}
              />
            </div>
          </div>
          <div className="savings-results">
            <div
              className="savings-compare"
              role="img"
              aria-label={`Petrol scooter ${formatInr(result.monthlyPetrolInr)} a month. ${model.name} ${formatInr(result.monthlyElectricInr)} a month.`}
            >
              <div className="savings-cols">
                <SavingsBar
                  label="Petrol scooter"
                  amount={formatInr(result.monthlyPetrolInr)}
                  heightPct={petrolBar}
                  tone="petrol"
                />
                <SavingsBar
                  label={model.name}
                  amount={formatInr(result.monthlyElectricInr)}
                  heightPct={amptronBar}
                  tone="amptron"
                />
              </div>
              <span className="savings-per">Per month</span>
            </div>
            <div className="savings-card savings-card--accent">
              <p className="savings-card-kicker">You keep each year</p>
              <p className="savings-card-amount">
                {formatInr(result.annualSavingsInr)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SavingsBar({
  label,
  amount,
  heightPct,
  tone,
}: {
  label: string
  amount: string
  heightPct: number
  tone: 'petrol' | 'amptron'
}) {
  const reduceMotion = usePrefersReducedMotion()
  const target = heightPct > 0 ? Math.max(heightPct, 8) : 8
  const [rise, setRise] = useState(reduceMotion ? target : 8)

  useEffect(() => {
    setRise(target)
  }, [target])

  return (
    <div className={`savings-bar savings-bar--${tone}`}>
      <div className="savings-bar-track">
        <strong style={{ bottom: `calc(${rise}% + 8px)` }}>{amount}</strong>
        <span
          className="savings-bar-fill"
          aria-hidden="true"
          style={{ height: `${rise}%` }}
        />
      </div>
      <span className="savings-bar-label">{label}</span>
    </div>
  )
}

function SliderField({
  label,
  value,
  min,
  max,
  display,
  minLabel,
  maxLabel,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  display: string
  minLabel: string
  maxLabel: string
  onChange: (value: number) => void
}) {
  const fill = ((value - min) / (max - min)) * 100

  return (
    <label className="savings-field">
      <span className="savings-field-label">
        {label}
        <strong>{display}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ '--fill': `${fill}%` } as CSSProperties}
      />
      <span className="savings-scale">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </span>
    </label>
  )
}

function ModelSelect({
  models,
  value,
  onChange,
}: {
  models: ScooterModel[]
  value: string
  onChange: (slug: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = models.find((item) => item.slug === value) ?? models[0]

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="savings-select" ref={rootRef}>
      <button
        type="button"
        className="savings-select-btn"
        aria-label={`Model: ${selected?.name ?? 'Choose a model'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
      >
        {selected?.name ?? 'Choose a model'}
        <span className="savings-select-chevron" aria-hidden="true" />
      </button>
      {open ? (
        <ul className="savings-select-menu" id={listId} role="listbox">
          {models.map((item) => (
            <li key={item.slug} role="none">
              <button
                type="button"
                role="option"
                aria-selected={item.slug === value}
                className={item.slug === value ? 'is-active' : undefined}
                onClick={() => {
                  onChange(item.slug)
                  setOpen(false)
                }}
              >
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
