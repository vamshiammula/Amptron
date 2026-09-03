/**
 * Running-cost and five-year ownership comparison used on the public calculator.
 *
 * monthlyKm      = dailyKm × ridingDaysPerMonth
 * petrol energy  = (monthlyKm ÷ km per litre) × ₹ per litre
 * Amptron energy = monthlyKm × (battery kWh ÷ certified range km) × ₹ per unit
 *                  × (1 + charging loss)
 * service        = monthlyKm × ₹ per km (CEEW two-wheeler benchmarks)
 * five-year TCO  = purchase + energy + service + optional battery repair or replacement
 *
 * Petrol price, mileage, electricity, and riding days are inputs, not constants.
 * Certified range and pack size come from the model spec sheet.
 */

export const SAVINGS_DEFAULTS = {
  petrolInrPerLitre: 100,
  petrolKmPerLitre: 40,
  electricityInrPerUnit: 10,
  ridingDaysPerMonth: 25,
  defaultDailyKm: 30,
} as const

export const SAVINGS_LIMITS = {
  minDailyKm: 15,
  maxDailyKm: 150,
  minPetrolInrPerLitre: 70,
  maxPetrolInrPerLitre: 160,
  minPetrolKmPerLitre: 20,
  maxPetrolKmPerLitre: 70,
  minElectricityInrPerUnit: 4,
  maxElectricityInrPerUnit: 20,
  minRidingDaysPerMonth: 10,
  maxRidingDaysPerMonth: 31,
} as const

/**
 * Five-year ownership defaults. Maintenance rates follow CEEW (2024) two-wheeler
 * INR/km figures. Charging loss is a 10% wall-to-pack allowance. Petrol purchase
 * is a typical 110-125 cc scooter, entered like-for-like with the Amptron price.
 * Battery repair or replacement is off unless the user opts into a scenario.
 */
export const OWNERSHIP_DEFAULTS = {
  horizonYears: 5,
  chargingLossPct: 10,
  evMaintenanceInrPerKm: 0.22,
  petrolMaintenanceInrPerKm: 0.31,
  petrolPurchaseInr: 85000,
  batteryWorkYear: 5,
  batteryInrPerKwh: 18000,
  batteryRepairShare: 0.3,
} as const

export const OWNERSHIP_LIMITS = {
  minChargingLossPct: 0,
  maxChargingLossPct: 25,
  minMaintenanceInrPerKm: 0.05,
  maxMaintenanceInrPerKm: 1,
  minPetrolPurchaseInr: 20000,
  maxPetrolPurchaseInr: 200000,
  minBatteryYear: 3,
  maxBatteryYear: 8,
  minBatteryRepairInr: 5000,
  maxBatteryRepairInr: 60000,
  minBatteryReplaceInr: 20000,
  maxBatteryReplaceInr: 150000,
} as const

export type BatteryAction = 'none' | 'repair' | 'replace'

export const OWNERSHIP_SOURCES = [
  {
    name: 'CEEW',
    href: 'https://www.ceew.in/publications/cost-of-ownership-for-road-transport-sector-for-different-vehicle-segments-fuels-and-powertrains',
    note: 'Two-wheeler maintenance of ₹0.22/km electric and ₹0.31/km petrol.',
  },
  {
    name: 'NITI Aayog e-Amrit',
    href: 'https://e-amrit.niti.gov.in/journey-cost-calculator',
    note: 'Usage-driven energy comparison. Electric powertrains need less routine service.',
  },
  {
    name: 'ICCT',
    href: 'https://theicct.org/sites/default/files/publications/E2W-cost-2030-India-jul2021.pdf',
    note: 'Little electric maintenance in the first five years. Pack repair or replacement is a later-year scenario, not a promise.',
  },
] as const

/**
 * Shared chart ceiling. Defaults sit below 100% so the petrol bar can grow
 * when daily km, price, or mileage change. Extreme inputs still cap at 100%.
 */
export function savingsBarPeak(
  monthlyPetrolInr: number,
  monthlyElectricInr: number,
): number {
  const typicalHigh =
    (((SAVINGS_LIMITS.maxDailyKm / 2) * SAVINGS_DEFAULTS.ridingDaysPerMonth) /
      SAVINGS_DEFAULTS.petrolKmPerLitre) *
    SAVINGS_DEFAULTS.petrolInrPerLitre
  return Math.max(monthlyPetrolInr, monthlyElectricInr, typicalHigh, 1)
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

export function kwhPerKm(batteryKwh: number, certifiedRangeKm: number): number {
  if (certifiedRangeKm <= 0) return 0
  return batteryKwh / certifiedRangeKm
}

export function batteryReplacementInr(batteryKwh: number): number {
  const kwh = Math.max(0, batteryKwh)
  return Math.round(kwh * OWNERSHIP_DEFAULTS.batteryInrPerKwh)
}

export function batteryRepairInr(batteryKwh: number): number {
  return clamp(
    Math.round(batteryReplacementInr(batteryKwh) * OWNERSHIP_DEFAULTS.batteryRepairShare),
    OWNERSHIP_LIMITS.minBatteryRepairInr,
    OWNERSHIP_LIMITS.maxBatteryRepairInr,
  )
}

export function batteryWorkLimits(action: BatteryAction): {
  min: number
  max: number
} {
  if (action === 'repair') {
    return {
      min: OWNERSHIP_LIMITS.minBatteryRepairInr,
      max: OWNERSHIP_LIMITS.maxBatteryRepairInr,
    }
  }
  return {
    min: OWNERSHIP_LIMITS.minBatteryReplaceInr,
    max: OWNERSHIP_LIMITS.maxBatteryReplaceInr,
  }
}

export interface SavingsInput {
  dailyKm: number
  kwhPerKm: number
  petrolInrPerLitre: number
  petrolKmPerLitre: number
  electricityInrPerUnit: number
  ridingDaysPerMonth: number
}

export interface SavingsResult {
  monthlyKm: number
  monthlyPetrolInr: number
  monthlyElectricInr: number
  monthlySavingsInr: number
  annualSavingsInr: number
}

export interface OwnershipInput extends SavingsInput {
  amptronPurchaseInr: number
  petrolPurchaseInr: number
  chargingLossPct: number
  evMaintenanceInrPerKm: number
  petrolMaintenanceInrPerKm: number
  batteryAction: BatteryAction
  batteryWorkYear: number
  batteryWorkInr: number
  certifiedRangeKm: number
}

export interface OwnershipResult {
  monthlyKm: number
  annualKm: number
  horizonYears: number
  monthlyPetrolEnergyInr: number
  monthlyElectricEnergyInr: number
  monthlyPetrolServiceInr: number
  monthlyElectricServiceInr: number
  monthlyEnergySavingsInr: number
  monthlyRunningSavingsInr: number
  annualEnergySavingsInr: number
  annualServiceSavingsInr: number
  annualRunningSavingsInr: number
  fiveYearPetrolEnergyInr: number
  fiveYearElectricEnergyInr: number
  fiveYearPetrolServiceInr: number
  fiveYearElectricServiceInr: number
  fiveYearBatteryInr: number
  petrolPurchaseInr: number
  amptronPurchaseInr: number
  petrolTcoInr: number
  amptronTcoInr: number
  fiveYearSavingsInr: number
  petrolCostPerKm: number
  amptronCostPerKm: number
  paybackMonths: number | null
  equivalentCyclesToWork: number | null
  equivalentCyclesOverHorizon: number
  batteryIncluded: boolean
  batteryAction: BatteryAction
}

export function estimateSavings(input: SavingsInput): SavingsResult {
  const dailyKm = clamp(
    input.dailyKm,
    SAVINGS_LIMITS.minDailyKm,
    SAVINGS_LIMITS.maxDailyKm,
  )
  const days = clamp(
    input.ridingDaysPerMonth,
    SAVINGS_LIMITS.minRidingDaysPerMonth,
    SAVINGS_LIMITS.maxRidingDaysPerMonth,
  )
  const kmPerLitre = clamp(
    input.petrolKmPerLitre,
    SAVINGS_LIMITS.minPetrolKmPerLitre,
    SAVINGS_LIMITS.maxPetrolKmPerLitre,
  )
  const petrolPrice = clamp(
    input.petrolInrPerLitre,
    SAVINGS_LIMITS.minPetrolInrPerLitre,
    SAVINGS_LIMITS.maxPetrolInrPerLitre,
  )
  const unitPrice = clamp(
    input.electricityInrPerUnit,
    SAVINGS_LIMITS.minElectricityInrPerUnit,
    SAVINGS_LIMITS.maxElectricityInrPerUnit,
  )
  const consumption = Math.max(0, input.kwhPerKm)

  const monthlyKm = dailyKm * days
  const monthlyPetrolInr =
    kmPerLitre === 0 ? 0 : (monthlyKm / kmPerLitre) * petrolPrice
  const monthlyElectricInr = monthlyKm * consumption * unitPrice
  const monthlySavingsInr = monthlyPetrolInr - monthlyElectricInr
  const monthlyRounded = Math.round(monthlySavingsInr)

  return {
    monthlyKm,
    monthlyPetrolInr: Math.round(monthlyPetrolInr),
    monthlyElectricInr: Math.round(monthlyElectricInr),
    monthlySavingsInr: monthlyRounded,
    annualSavingsInr: monthlyRounded * 12,
  }
}

function paybackMonths(options: {
  extraPurchaseInr: number
  monthlyRunningSavingsInr: number
  batteryIncluded: boolean
  batteryWorkYear: number
  batteryWorkInr: number
}): number | null {
  const extra = options.extraPurchaseInr
  const monthly = options.monthlyRunningSavingsInr
  if (extra <= 0) return 0

  const batteryMonth =
    options.batteryIncluded && options.batteryWorkInr > 0
      ? options.batteryWorkYear * 12
      : null

  let cumulative = 0
  const maxMonths = 120
  for (let month = 1; month <= maxMonths; month += 1) {
    cumulative += monthly
    if (batteryMonth === month) cumulative -= options.batteryWorkInr
    if (cumulative >= extra) return month
  }
  return null
}

export function estimateOwnership(input: OwnershipInput): OwnershipResult {
  const energy = estimateSavings(input)
  const lossPct =
    clamp(
      input.chargingLossPct,
      OWNERSHIP_LIMITS.minChargingLossPct,
      OWNERSHIP_LIMITS.maxChargingLossPct,
    ) / 100
  const evMaint = clamp(
    input.evMaintenanceInrPerKm,
    OWNERSHIP_LIMITS.minMaintenanceInrPerKm,
    OWNERSHIP_LIMITS.maxMaintenanceInrPerKm,
  )
  const petrolMaint = clamp(
    input.petrolMaintenanceInrPerKm,
    OWNERSHIP_LIMITS.minMaintenanceInrPerKm,
    OWNERSHIP_LIMITS.maxMaintenanceInrPerKm,
  )
  const petrolPurchase = clamp(
    input.petrolPurchaseInr,
    OWNERSHIP_LIMITS.minPetrolPurchaseInr,
    OWNERSHIP_LIMITS.maxPetrolPurchaseInr,
  )
  const amptronPurchase = clamp(
    Math.round(input.amptronPurchaseInr),
    OWNERSHIP_LIMITS.minPetrolPurchaseInr,
    OWNERSHIP_LIMITS.maxPetrolPurchaseInr,
  )
  const batteryAction: BatteryAction =
    input.batteryAction === 'repair' || input.batteryAction === 'replace'
      ? input.batteryAction
      : 'none'
  const batteryYear = clamp(
    input.batteryWorkYear,
    OWNERSHIP_LIMITS.minBatteryYear,
    OWNERSHIP_LIMITS.maxBatteryYear,
  )
  const workLimits = batteryWorkLimits(
    batteryAction === 'none' ? 'replace' : batteryAction,
  )
  const batteryCost = clamp(input.batteryWorkInr, workLimits.min, workLimits.max)
  const rangeKm = Math.max(0, input.certifiedRangeKm)
  const years = OWNERSHIP_DEFAULTS.horizonYears
  const months = years * 12

  const consumption = Math.max(0, input.kwhPerKm)
  const unitPrice = clamp(
    input.electricityInrPerUnit,
    SAVINGS_LIMITS.minElectricityInrPerUnit,
    SAVINGS_LIMITS.maxElectricityInrPerUnit,
  )
  const monthlyPetrolEnergyInr = energy.monthlyPetrolInr
  const monthlyElectricEnergyInr = Math.round(
    energy.monthlyKm * consumption * unitPrice * (1 + lossPct),
  )
  const monthlyPetrolServiceInr = Math.round(energy.monthlyKm * petrolMaint)
  const monthlyElectricServiceInr = Math.round(energy.monthlyKm * evMaint)
  const monthlyEnergySavingsInr = monthlyPetrolEnergyInr - monthlyElectricEnergyInr
  const monthlyRunningSavingsInr =
    monthlyEnergySavingsInr + (monthlyPetrolServiceInr - monthlyElectricServiceInr)

  const fiveYearPetrolEnergyInr = monthlyPetrolEnergyInr * months
  const fiveYearElectricEnergyInr = monthlyElectricEnergyInr * months
  const fiveYearPetrolServiceInr = monthlyPetrolServiceInr * months
  const fiveYearElectricServiceInr = monthlyElectricServiceInr * months
  const batteryIncluded = batteryAction !== 'none' && batteryYear <= years
  const fiveYearBatteryInr = batteryIncluded ? Math.round(batteryCost) : 0

  const petrolTcoInr =
    petrolPurchase + fiveYearPetrolEnergyInr + fiveYearPetrolServiceInr
  const amptronTcoInr =
    amptronPurchase +
    fiveYearElectricEnergyInr +
    fiveYearElectricServiceInr +
    fiveYearBatteryInr
  const fiveYearSavingsInr = petrolTcoInr - amptronTcoInr

  const annualKm = energy.monthlyKm * 12
  const fiveYearKm = annualKm * years
  const petrolCostPerKm = fiveYearKm === 0 ? 0 : petrolTcoInr / fiveYearKm
  const amptronCostPerKm = fiveYearKm === 0 ? 0 : amptronTcoInr / fiveYearKm

  const equivalentCyclesOverHorizon =
    rangeKm === 0 ? 0 : (annualKm * years) / rangeKm
  const equivalentCyclesToWork =
    rangeKm === 0 ? null : (annualKm * batteryYear) / rangeKm

  return {
    monthlyKm: energy.monthlyKm,
    annualKm,
    horizonYears: years,
    monthlyPetrolEnergyInr,
    monthlyElectricEnergyInr,
    monthlyPetrolServiceInr,
    monthlyElectricServiceInr,
    monthlyEnergySavingsInr,
    monthlyRunningSavingsInr,
    annualEnergySavingsInr: monthlyEnergySavingsInr * 12,
    annualServiceSavingsInr:
      (monthlyPetrolServiceInr - monthlyElectricServiceInr) * 12,
    annualRunningSavingsInr: monthlyRunningSavingsInr * 12,
    fiveYearPetrolEnergyInr,
    fiveYearElectricEnergyInr,
    fiveYearPetrolServiceInr,
    fiveYearElectricServiceInr,
    fiveYearBatteryInr,
    petrolPurchaseInr: petrolPurchase,
    amptronPurchaseInr: amptronPurchase,
    petrolTcoInr,
    amptronTcoInr,
    fiveYearSavingsInr,
    petrolCostPerKm,
    amptronCostPerKm,
    paybackMonths: paybackMonths({
      extraPurchaseInr: amptronPurchase - petrolPurchase,
      monthlyRunningSavingsInr,
      batteryIncluded,
      batteryWorkYear: batteryYear,
      batteryWorkInr: fiveYearBatteryInr,
    }),
    equivalentCyclesToWork,
    equivalentCyclesOverHorizon,
    batteryIncluded,
    batteryAction,
  }
}
