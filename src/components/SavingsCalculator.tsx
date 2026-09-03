import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import {
  OWNERSHIP_DEFAULTS,
  OWNERSHIP_LIMITS,
  OWNERSHIP_SOURCES,
  SAVINGS_DEFAULTS,
  SAVINGS_LIMITS,
  batteryRepairInr,
  batteryReplacementInr,
  batteryWorkLimits,
  estimateOwnership,
  formatInr,
  formatInrPerKm,
  kwhPerKm,
  savingsBarPeak,
  type BatteryAction,
} from '../data/pricing'
import { useSiteContent } from '../lib/siteContent'
import type { ScooterModel } from '../data/models'

type CompareView = 'running' | 'service' | 'battery' | 'total'

const VIEWS: Array<{ id: CompareView; label: string }> = [
  { id: 'running', label: 'Running cost' },
  { id: 'service', label: 'Service' },
  { id: 'battery', label: 'Battery' },
  { id: 'total', label: '5-year total' },
]

const BATTERY_ACTIONS: Array<{ id: BatteryAction; label: string }> = [
  { id: 'none', label: 'Leave out' },
  { id: 'repair', label: 'Repair the pack' },
  { id: 'replace', label: 'Replace the pack' },
]

interface SavingsCalculatorProps {
  defaultSlug?: string
  onSlugChange?: (slug: string) => void
  tone?: 'white' | 'fog'
}

export default function SavingsCalculator({
  defaultSlug,
  onSlugChange,
  tone = 'white',
}: Readonly<SavingsCalculatorProps>) {
  const { models } = useSiteContent()
  const defaultModel =
    models.find((model) => model.slug === defaultSlug) ??
    models.find((model) => model.featured) ??
    models[0] ??
    null
  const [localSlug, setLocalSlug] = useState(defaultModel?.slug ?? '')
  const slug = defaultSlug ?? localSlug
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
  const [petrolPurchase, setPetrolPurchase] = useState<number>(
    OWNERSHIP_DEFAULTS.petrolPurchaseInr,
  )
  const [amptronPurchase, setAmptronPurchase] = useState<number>(
    defaultModel?.pricing?.exShowroomInr ?? OWNERSHIP_DEFAULTS.petrolPurchaseInr,
  )
  const [chargingLossPct, setChargingLossPct] = useState<number>(
    OWNERSHIP_DEFAULTS.chargingLossPct,
  )
  const [evMaintenance, setEvMaintenance] = useState<number>(
    OWNERSHIP_DEFAULTS.evMaintenanceInrPerKm,
  )
  const [petrolMaintenance, setPetrolMaintenance] = useState<number>(
    OWNERSHIP_DEFAULTS.petrolMaintenanceInrPerKm,
  )
  const [batteryAction, setBatteryAction] = useState<BatteryAction>('none')
  const [batteryYear, setBatteryYear] = useState<number>(
    OWNERSHIP_DEFAULTS.batteryWorkYear,
  )
  const [repairCost, setRepairCost] = useState(
    batteryRepairInr(defaultModel?.batteryKwh ?? 2.65),
  )
  const [replaceCost, setReplaceCost] = useState(
    batteryReplacementInr(defaultModel?.batteryKwh ?? 2.65),
  )
  const [view, setView] = useState<CompareView>('running')
  const [bridgeOpen, setBridgeOpen] = useState(false)
  const tablistId = useId()
  const batteryGroupId = useId()

  const model = models.find((item) => item.slug === slug) ?? defaultModel
  const batteryWorkInr = batteryAction === 'repair' ? repairCost : replaceCost

  const result = useMemo(() => {
    if (!model) return null
    return estimateOwnership({
      dailyKm,
      kwhPerKm: kwhPerKm(model.batteryKwh, model.certifiedRangeKm),
      petrolInrPerLitre: petrolPrice,
      petrolKmPerLitre,
      electricityInrPerUnit: electricityPrice,
      ridingDaysPerMonth: ridingDays,
      amptronPurchaseInr: amptronPurchase,
      petrolPurchaseInr: petrolPurchase,
      chargingLossPct,
      evMaintenanceInrPerKm: evMaintenance,
      petrolMaintenanceInrPerKm: petrolMaintenance,
      batteryAction,
      batteryWorkYear: batteryYear,
      batteryWorkInr,
      certifiedRangeKm: model.certifiedRangeKm,
    })
  }, [
    amptronPurchase,
    batteryAction,
    batteryWorkInr,
    batteryYear,
    chargingLossPct,
    dailyKm,
    electricityPrice,
    evMaintenance,
    model,
    petrolKmPerLitre,
    petrolMaintenance,
    petrolPrice,
    petrolPurchase,
    ridingDays,
  ])

  const selectModel = (next: string) => {
    setLocalSlug(next)
    onSlugChange?.(next)
    const nextModel = models.find((item) => item.slug === next)
    if (nextModel?.pricing) setAmptronPurchase(nextModel.pricing.exShowroomInr)
    if (nextModel) {
      setRepairCost(batteryRepairInr(nextModel.batteryKwh))
      setReplaceCost(batteryReplacementInr(nextModel.batteryKwh))
    }
  }

  const onViewKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const index = VIEWS.findIndex((item) => item.id === view)
    if (index < 0) return
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      const offset = event.key === 'ArrowRight' ? 1 : VIEWS.length - 1
      const next = VIEWS[(index + offset) % VIEWS.length]
      setView(next.id)
    }
  }

  if (!model || !result) return null

  const energyFilters = (
    <EnergyFilters
      petrolPrice={petrolPrice}
      petrolKmPerLitre={petrolKmPerLitre}
      electricityPrice={electricityPrice}
      ridingDays={ridingDays}
      chargingLossPct={chargingLossPct}
      onPetrolPrice={setPetrolPrice}
      onPetrolKmPerLitre={setPetrolKmPerLitre}
      onElectricityPrice={setElectricityPrice}
      onRidingDays={setRidingDays}
      onChargingLossPct={setChargingLossPct}
    />
  )
  const serviceFilters = (
    <ServiceFilters
      petrolMaintenance={petrolMaintenance}
      evMaintenance={evMaintenance}
      onPetrolMaintenance={setPetrolMaintenance}
      onEvMaintenance={setEvMaintenance}
    />
  )
  const purchaseFilters = (
    <PurchaseFilters
      modelName={model.name}
      petrolPurchase={petrolPurchase}
      amptronPurchase={amptronPurchase}
      onPetrolPurchase={setPetrolPurchase}
      onAmptronPurchase={setAmptronPurchase}
    />
  )
  const batteryFilters = (
    <BatteryFilters
      groupId={batteryGroupId}
      action={batteryAction}
      year={batteryYear}
      repairCost={repairCost}
      replaceCost={replaceCost}
      onAction={setBatteryAction}
      onYear={setBatteryYear}
      onRepairCost={setRepairCost}
      onReplaceCost={setReplaceCost}
    />
  )

  return (
    <div className={`savings-board${tone === 'fog' ? ' savings-board--fog' : ''}`}>
      <div className="savings-panel">
        <div className="savings-controls">
          <div className="savings-field">
            <span className="savings-field-label">Model</span>
            <ModelSelect
              models={models}
              value={model.slug}
              onChange={selectModel}
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
          <div
            className="savings-views"
            role="tablist"
            aria-label="What to compare"
            id={tablistId}
            tabIndex={-1}
            onKeyDown={onViewKeyDown}
          >
            {VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`${tablistId}-${item.id}`}
                aria-selected={view === item.id}
                aria-controls={`${tablistId}-panel`}
                tabIndex={view === item.id ? 0 : -1}
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {view === 'running' ? energyFilters : null}
          {view === 'service' ? serviceFilters : null}
          {view === 'battery' ? batteryFilters : null}
          {view === 'total' ? (
            <>
              {energyFilters}
              {serviceFilters}
              {purchaseFilters}
              {batteryFilters}
            </>
          ) : null}
        </div>
        <div
          className="savings-results"
          role="tabpanel"
          id={`${tablistId}-panel`}
          aria-labelledby={`${tablistId}-${view}`}
        >
          {view === 'running' ? (
            <RunningView modelName={model.name} result={result} />
          ) : null}
          {view === 'service' ? (
            <ServiceView modelName={model.name} result={result} />
          ) : null}
          {view === 'battery' ? (
            <BatteryView
              modelName={model.name}
              result={result}
              year={batteryYear}
              certifiedRangeKm={model.certifiedRangeKm}
            />
          ) : null}
          {view === 'total' ? (
            <TotalView
              modelName={model.name}
              result={result}
              bridgeOpen={bridgeOpen}
              onBridgeOpen={setBridgeOpen}
            />
          ) : null}
        </div>
      </div>
      <details className="savings-disclosure savings-disclosure--sources">
        <summary>How this estimate works</summary>
        <p>
          Indicative, not a quote. Enter like-for-like prices: both ex-showroom, or
          both on-road. The formula uses this model&apos;s certified battery and
          range, your daily use, and the figures on each tab.
        </p>
        <p>
          This estimate leaves out financing, insurance, taxes, tyres and other
          shared wear, unplanned repairs, and resale.
        </p>
        <p>
          Battery repair or replacement is a scenario you can test. It is not a
          prediction that the pack will fail, and it is not Amptron warranty
          policy.
        </p>
        <ul className="savings-sources">
          {OWNERSHIP_SOURCES.map((source) => (
            <li key={source.name}>
              <a href={source.href} rel="noreferrer" target="_blank">
                {source.name}
              </a>
              : {source.note}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}

function EnergyFilters({
  petrolPrice,
  petrolKmPerLitre,
  electricityPrice,
  ridingDays,
  chargingLossPct,
  onPetrolPrice,
  onPetrolKmPerLitre,
  onElectricityPrice,
  onRidingDays,
  onChargingLossPct,
}: Readonly<{
  petrolPrice: number
  petrolKmPerLitre: number
  electricityPrice: number
  ridingDays: number
  chargingLossPct: number
  onPetrolPrice: (value: number) => void
  onPetrolKmPerLitre: (value: number) => void
  onElectricityPrice: (value: number) => void
  onRidingDays: (value: number) => void
  onChargingLossPct: (value: number) => void
}>) {
  return (
    <FilterGroup title="Energy">
      <div className="savings-facts">
        <SliderField
          label="Petrol price"
          value={petrolPrice}
          min={SAVINGS_LIMITS.minPetrolInrPerLitre}
          max={SAVINGS_LIMITS.maxPetrolInrPerLitre}
          display={`${formatInr(petrolPrice)}/l`}
          minLabel={formatInr(SAVINGS_LIMITS.minPetrolInrPerLitre)}
          maxLabel={formatInr(SAVINGS_LIMITS.maxPetrolInrPerLitre)}
          onChange={onPetrolPrice}
        />
        <SliderField
          label="Petrol mileage"
          value={petrolKmPerLitre}
          min={SAVINGS_LIMITS.minPetrolKmPerLitre}
          max={SAVINGS_LIMITS.maxPetrolKmPerLitre}
          display={`${petrolKmPerLitre} km/l`}
          minLabel={`${SAVINGS_LIMITS.minPetrolKmPerLitre}`}
          maxLabel={`${SAVINGS_LIMITS.maxPetrolKmPerLitre}`}
          onChange={onPetrolKmPerLitre}
        />
        <SliderField
          label="Electricity"
          value={electricityPrice}
          min={SAVINGS_LIMITS.minElectricityInrPerUnit}
          max={SAVINGS_LIMITS.maxElectricityInrPerUnit}
          display={`${formatInr(electricityPrice)}/unit`}
          minLabel={formatInr(SAVINGS_LIMITS.minElectricityInrPerUnit)}
          maxLabel={formatInr(SAVINGS_LIMITS.maxElectricityInrPerUnit)}
          onChange={onElectricityPrice}
        />
        <SliderField
          label="Riding days"
          value={ridingDays}
          min={SAVINGS_LIMITS.minRidingDaysPerMonth}
          max={SAVINGS_LIMITS.maxRidingDaysPerMonth}
          display={`${ridingDays} / month`}
          minLabel={`${SAVINGS_LIMITS.minRidingDaysPerMonth}`}
          maxLabel={`${SAVINGS_LIMITS.maxRidingDaysPerMonth}`}
          onChange={onRidingDays}
        />
        <SliderField
          label="Charging loss"
          value={chargingLossPct}
          min={OWNERSHIP_LIMITS.minChargingLossPct}
          max={OWNERSHIP_LIMITS.maxChargingLossPct}
          display={`${chargingLossPct}%`}
          minLabel={`${OWNERSHIP_LIMITS.minChargingLossPct}%`}
          maxLabel={`${OWNERSHIP_LIMITS.maxChargingLossPct}%`}
          onChange={onChargingLossPct}
        />
      </div>
    </FilterGroup>
  )
}

function ServiceFilters({
  petrolMaintenance,
  evMaintenance,
  onPetrolMaintenance,
  onEvMaintenance,
}: Readonly<{
  petrolMaintenance: number
  evMaintenance: number
  onPetrolMaintenance: (value: number) => void
  onEvMaintenance: (value: number) => void
}>) {
  return (
    <FilterGroup title="Service">
      <div className="savings-facts">
        <SliderField
          label="Petrol service"
          value={petrolMaintenance}
          min={OWNERSHIP_LIMITS.minMaintenanceInrPerKm}
          max={OWNERSHIP_LIMITS.maxMaintenanceInrPerKm}
          step={0.01}
          display={`${formatInrPerKm(petrolMaintenance)}/km`}
          minLabel={formatInrPerKm(OWNERSHIP_LIMITS.minMaintenanceInrPerKm)}
          maxLabel={formatInrPerKm(OWNERSHIP_LIMITS.maxMaintenanceInrPerKm)}
          onChange={onPetrolMaintenance}
        />
        <SliderField
          label="Amptron service"
          value={evMaintenance}
          min={OWNERSHIP_LIMITS.minMaintenanceInrPerKm}
          max={OWNERSHIP_LIMITS.maxMaintenanceInrPerKm}
          step={0.01}
          display={`${formatInrPerKm(evMaintenance)}/km`}
          minLabel={formatInrPerKm(OWNERSHIP_LIMITS.minMaintenanceInrPerKm)}
          maxLabel={formatInrPerKm(OWNERSHIP_LIMITS.maxMaintenanceInrPerKm)}
          onChange={onEvMaintenance}
        />
      </div>
    </FilterGroup>
  )
}

function PurchaseFilters({
  modelName,
  petrolPurchase,
  amptronPurchase,
  onPetrolPurchase,
  onAmptronPurchase,
}: Readonly<{
  modelName: string
  petrolPurchase: number
  amptronPurchase: number
  onPetrolPurchase: (value: number) => void
  onAmptronPurchase: (value: number) => void
}>) {
  return (
    <FilterGroup title="Purchase">
      <div className="savings-facts">
        <SliderField
          label="Petrol purchase"
          value={petrolPurchase}
          min={OWNERSHIP_LIMITS.minPetrolPurchaseInr}
          max={OWNERSHIP_LIMITS.maxPetrolPurchaseInr}
          step={10}
          display={formatInr(petrolPurchase)}
          minLabel={formatInr(OWNERSHIP_LIMITS.minPetrolPurchaseInr)}
          maxLabel={formatInr(OWNERSHIP_LIMITS.maxPetrolPurchaseInr)}
          onChange={onPetrolPurchase}
        />
        <SliderField
          label={`${modelName} purchase`}
          value={amptronPurchase}
          min={OWNERSHIP_LIMITS.minPetrolPurchaseInr}
          max={OWNERSHIP_LIMITS.maxPetrolPurchaseInr}
          step={10}
          display={formatInr(amptronPurchase)}
          minLabel={formatInr(OWNERSHIP_LIMITS.minPetrolPurchaseInr)}
          maxLabel={formatInr(OWNERSHIP_LIMITS.maxPetrolPurchaseInr)}
          onChange={onAmptronPurchase}
        />
      </div>
    </FilterGroup>
  )
}

function BatteryFilters({
  groupId,
  action,
  year,
  repairCost,
  replaceCost,
  onAction,
  onYear,
  onRepairCost,
  onReplaceCost,
}: Readonly<{
  groupId: string
  action: BatteryAction
  year: number
  repairCost: number
  replaceCost: number
  onAction: (value: BatteryAction) => void
  onYear: (value: number) => void
  onRepairCost: (value: number) => void
  onReplaceCost: (value: number) => void
}>) {
  const workLimits = batteryWorkLimits(action === 'none' ? 'replace' : action)
  const cost = action === 'repair' ? repairCost : replaceCost
  const onCost = action === 'repair' ? onRepairCost : onReplaceCost
  const costLabel = action === 'repair' ? 'Repair cost' : 'Replacement cost'

  return (
    <FilterGroup title="Battery">
      <fieldset className="savings-radios">
        <legend className="savings-field-label">Battery work</legend>
        {BATTERY_ACTIONS.map((item) => (
          <label key={item.id} className="savings-radio">
            <input
              type="radio"
              name={groupId}
              value={item.id}
              checked={action === item.id}
              onChange={() => onAction(item.id)}
            />
            {item.label}
          </label>
        ))}
      </fieldset>
      {action !== 'none' ? (
        <div className="savings-facts">
          <SliderField
            label={action === 'repair' ? 'Repair year' : 'Replacement year'}
            value={year}
            min={OWNERSHIP_LIMITS.minBatteryYear}
            max={OWNERSHIP_LIMITS.maxBatteryYear}
            display={`Year ${year}`}
            minLabel={`${OWNERSHIP_LIMITS.minBatteryYear}`}
            maxLabel={`${OWNERSHIP_LIMITS.maxBatteryYear}`}
            onChange={onYear}
          />
          <SliderField
            label={costLabel}
            value={cost}
            min={workLimits.min}
            max={workLimits.max}
            step={10}
            display={formatInr(cost)}
            minLabel={formatInr(workLimits.min)}
            maxLabel={formatInr(workLimits.max)}
            onChange={onCost}
          />
        </div>
      ) : null}
    </FilterGroup>
  )
}

function FilterGroup({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <fieldset className="savings-filter-group">
      <legend className="savings-filter-title">{title}</legend>
      {children}
    </fieldset>
  )
}

function RunningView({
  modelName,
  result,
}: Readonly<{
  modelName: string
  result: NonNullable<ReturnType<typeof estimateOwnership>>
}>) {
  const peak = savingsBarPeak(
    result.monthlyPetrolEnergyInr,
    result.monthlyElectricEnergyInr,
  )
  const keeps = result.annualEnergySavingsInr >= 0
  return (
    <>
      <figure
        className="savings-compare"
        aria-label={`Petrol scooter ${formatInr(result.monthlyPetrolEnergyInr)} a month. ${modelName} ${formatInr(result.monthlyElectricEnergyInr)} a month.`}
      >
        <div className="savings-cols">
          <SavingsBar
            label="Petrol scooter"
            amount={formatInr(result.monthlyPetrolEnergyInr)}
            heightPct={(result.monthlyPetrolEnergyInr / peak) * 100}
            tone="petrol"
          />
          <SavingsBar
            label={modelName}
            amount={formatInr(result.monthlyElectricEnergyInr)}
            heightPct={(result.monthlyElectricEnergyInr / peak) * 100}
            tone="amptron"
          />
        </div>
        <span className="savings-per">Per month, energy only</span>
      </figure>
      <div
        className={`savings-card${keeps ? ' savings-card--accent' : ''}`}
        aria-live="polite"
      >
        <p className="savings-card-kicker">
          {keeps ? 'You keep each year on fuel' : 'Fuel costs more each year'}
        </p>
        <p className="savings-card-amount">
          {formatInr(Math.abs(result.annualEnergySavingsInr))}
        </p>
      </div>
      <p className="savings-note">
        Electricity includes a charging-loss allowance, so this is what the meter
        sees, not only what the pack stores.
      </p>
    </>
  )
}

function ServiceView({
  modelName,
  result,
}: Readonly<{
  modelName: string
  result: NonNullable<ReturnType<typeof estimateOwnership>>
}>) {
  const peak = savingsBarPeak(
    result.monthlyPetrolServiceInr * 12,
    result.monthlyElectricServiceInr * 12,
  )
  const petrolYear = result.monthlyPetrolServiceInr * 12
  const amptronYear = result.monthlyElectricServiceInr * 12
  const keeps = result.annualServiceSavingsInr >= 0
  return (
    <>
      <figure
        className="savings-compare"
        aria-label={`Petrol scooter service ${formatInr(petrolYear)} a year. ${modelName} ${formatInr(amptronYear)} a year.`}
      >
        <div className="savings-cols">
          <SavingsBar
            label="Petrol scooter"
            amount={formatInr(petrolYear)}
            heightPct={(petrolYear / peak) * 100}
            tone="petrol"
          />
          <SavingsBar
            label={modelName}
            amount={formatInr(amptronYear)}
            heightPct={(amptronYear / peak) * 100}
            tone="amptron"
          />
        </div>
        <span className="savings-per">Per year, routine service</span>
      </figure>
      <div
        className={`savings-card${keeps ? ' savings-card--accent' : ''}`}
        aria-live="polite"
      >
        <p className="savings-card-kicker">
          {keeps ? 'You keep each year on service' : 'Service costs more each year'}
        </p>
        <p className="savings-card-amount">
          {formatInr(Math.abs(result.annualServiceSavingsInr))}
        </p>
      </div>
      <p className="savings-note">
        Petrol needs oil, filters, and a drive belt on a schedule. Amptron still
        needs inspection, brakes, and wear items. The rates are CEEW two-wheeler
        figures. Change them here if your workshop charges differently.
      </p>
    </>
  )
}

function BatteryView({
  modelName,
  result,
  year,
  certifiedRangeKm,
}: Readonly<{
  modelName: string
  result: NonNullable<ReturnType<typeof estimateOwnership>>
  year: number
  certifiedRangeKm: number
}>) {
  const action = result.batteryAction
  const counted = result.batteryIncluded
  const kicker = batteryKicker({
    action,
    counted,
    modelName,
    year,
  })

  const cyclesNote =
    action === 'none'
      ? result.equivalentCyclesOverHorizon
      : result.equivalentCyclesToWork

  return (
    <>
      <div
        className={`savings-card${counted ? ' savings-card--accent' : ''}`}
        aria-live="polite"
      >
        <p className="savings-card-kicker">{kicker}</p>
        <p className="savings-card-amount">
          {formatInr(result.fiveYearBatteryInr)}
        </p>
        {action !== 'none' && !counted ? (
          <p className="savings-card-meta">Not counted in the 5-year total.</p>
        ) : null}
      </div>
      {cyclesNote !== null ? (
        <p className="savings-note">
          At this daily use,{' '}
          {action === 'none' ? 'five years is' : `year ${year} is`} about{' '}
          {Math.round(cyclesNote)} equivalent full charges on a {certifiedRangeKm}{' '}
          km certified range. That is a usage figure, not a battery-life or
          warranty claim.
        </p>
      ) : null}
      <p className="savings-note">
        Repair is cell or BMS work, not a new pack. Replacement is a full pack.
        Both are scenarios you can test. Neither is a prediction that the pack
        will fail.
      </p>
    </>
  )
}

function batteryKicker(options: {
  action: BatteryAction
  counted: boolean
  modelName: string
  year: number
}): string {
  if (options.action === 'none') {
    return 'No battery cost in this 5-year estimate'
  }
  const work = options.action === 'repair' ? 'Repair' : 'Replacement'
  if (options.counted) {
    return `${work} on ${options.modelName} in year ${options.year}`
  }
  return `${work} in year ${options.year} falls outside this 5-year total`
}

function TotalView({
  modelName,
  result,
  bridgeOpen,
  onBridgeOpen,
}: Readonly<{
  modelName: string
  result: NonNullable<ReturnType<typeof estimateOwnership>>
  bridgeOpen: boolean
  onBridgeOpen: (open: boolean) => void
}>) {
  const keeps = result.fiveYearSavingsInr >= 0
  const batteryLabel =
    result.batteryAction === 'repair' ? 'Battery repair' : 'Battery replacement'
  return (
    <>
      <div
        className={`savings-card${keeps ? ' savings-card--accent' : ''}`}
        aria-live="polite"
      >
        <p className="savings-card-kicker">
          {keeps
            ? 'Estimated saving over 5 years'
            : 'This comparison costs more over 5 years'}
        </p>
        <p className="savings-card-amount">
          {formatInr(Math.abs(result.fiveYearSavingsInr))}
        </p>
        <p className="savings-card-meta">{paybackCopy(result.paybackMonths)}</p>
      </div>
      <dl className="savings-kpis">
        <div>
          <dt>Petrol, per km</dt>
          <dd>{formatInrPerKm(result.petrolCostPerKm)}</dd>
        </div>
        <div>
          <dt>{modelName}, per km</dt>
          <dd>{formatInrPerKm(result.amptronCostPerKm)}</dd>
        </div>
        <div>
          <dt>Running cost, per year</dt>
          <dd>
            {result.annualRunningSavingsInr >= 0 ? 'You keep ' : 'Extra '}
            {formatInr(Math.abs(result.annualRunningSavingsInr))}
          </dd>
        </div>
      </dl>
      <details
        className="savings-disclosure"
        open={bridgeOpen}
        onToggle={(event) => onBridgeOpen(event.currentTarget.open)}
      >
        <summary>See what makes up the five-year total</summary>
        {bridgeOpen ? (
          <table className="savings-bridge">
            <thead>
              <tr>
                <th>Cost</th>
                <th>Petrol scooter</th>
                <th>{modelName}</th>
              </tr>
            </thead>
            <tbody>
              <BridgeRow
                label="Purchase"
                petrol={result.petrolPurchaseInr}
                amptron={result.amptronPurchaseInr}
              />
              <BridgeRow
                label="Energy"
                petrol={result.fiveYearPetrolEnergyInr}
                amptron={result.fiveYearElectricEnergyInr}
              />
              <BridgeRow
                label="Service"
                petrol={result.fiveYearPetrolServiceInr}
                amptron={result.fiveYearElectricServiceInr}
              />
              {result.batteryIncluded ? (
                <BridgeRow
                  label={batteryLabel}
                  petrol={0}
                  amptron={result.fiveYearBatteryInr}
                />
              ) : null}
              <BridgeRow
                label="Five-year total"
                petrol={result.petrolTcoInr}
                amptron={result.amptronTcoInr}
                strong
              />
            </tbody>
          </table>
        ) : null}
      </details>
    </>
  )
}

function BridgeRow({
  label,
  petrol,
  amptron,
  strong = false,
}: Readonly<{
  label: string
  petrol: number
  amptron: number
  strong?: boolean
}>) {
  return (
    <tr className={strong ? 'savings-bridge-row--total' : undefined}>
      <th scope="row">{label}</th>
      <td>{formatInr(petrol)}</td>
      <td>{formatInr(amptron)}</td>
    </tr>
  )
}

function paybackCopy(months: number | null): string {
  if (months === 0) {
    return 'At these prices, Amptron costs the same or less to buy.'
  }
  if (months === null) {
    return 'The purchase difference does not recover from running costs in this estimate.'
  }
  const horizonMonths = OWNERSHIP_DEFAULTS.horizonYears * 12
  const label = formatDuration(months)
  if (months > horizonMonths) {
    return `Purchase difference recovers after this 5-year window (${label}).`
  }
  return `Purchase difference recovered in ${label}.`
}

function formatDuration(months: number): string {
  if (months < 12) {
    return `${months} month${months === 1 ? '' : 's'}`
  }
  const years = Math.floor(months / 12)
  const rest = months % 12
  const yearLabel = `${years} year${years === 1 ? '' : 's'}`
  if (rest === 0) return yearLabel
  return `${yearLabel} and ${rest} month${rest === 1 ? '' : 's'}`
}

function SavingsBar({
  label,
  amount,
  heightPct,
  tone,
}: Readonly<{
  label: string
  amount: string
  heightPct: number
  tone: 'petrol' | 'amptron'
}>) {
  const target = heightPct > 0 ? Math.max(heightPct, 8) : 8

  return (
    <div className={`savings-bar savings-bar--${tone}`}>
      <div className="savings-bar-track">
        <strong style={{ bottom: `calc(${target}% + 8px)` }}>{amount}</strong>
        <span
          className="savings-bar-fill"
          aria-hidden="true"
          style={{ height: `${target}%` }}
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
  step = 1,
  display,
  minLabel,
  maxLabel,
  onChange,
}: Readonly<{
  label: string
  value: number
  min: number
  max: number
  step?: number
  display: string
  minLabel: string
  maxLabel: string
  onChange: (value: number) => void
}>) {
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
        step={step}
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
}: Readonly<{
  models: ScooterModel[]
  value: string
  onChange: (slug: string) => void
}>) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = models.find((item) => item.slug === value) ?? models[0]

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
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
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
      >
        {selected?.name ?? 'Choose a model'}
        <span className="savings-select-chevron" aria-hidden="true" />
      </button>
      {open ? (
        <ul className="savings-select-menu" id={listId}>
          {models.map((item) => (
            <li key={item.slug}>
              <button
                type="button"
                aria-current={item.slug === value ? 'true' : undefined}
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
