/**
 * Running-cost comparison used on the public calculator.
 *
 * monthlyKm      = dailyKm × ridingDaysPerMonth
 * petrol / month = (monthlyKm ÷ km per litre) × ₹ per litre
 * Amptron / month = monthlyKm × (battery kWh ÷ certified range km) × ₹ per unit
 * you keep / year = (petrol − Amptron) × 12
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
 * Shared chart ceiling. Defaults sit below 100% so the petrol bar can grow
 * when daily km, price, or mileage change. Extreme inputs still cap at 100%.
 */
export function savingsBarPeak(
  monthlyPetrolInr: number,
  monthlyElectricInr: number,
): number {
  const typicalHigh =
    (SAVINGS_LIMITS.maxDailyKm / 2) *
    SAVINGS_DEFAULTS.ridingDaysPerMonth /
    SAVINGS_DEFAULTS.petrolKmPerLitre *
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
  const monthlySavingsInr = Math.max(0, monthlyPetrolInr - monthlyElectricInr)
  const monthlyRounded = Math.round(monthlySavingsInr)

  return {
    monthlyKm,
    monthlyPetrolInr: Math.round(monthlyPetrolInr),
    monthlyElectricInr: Math.round(monthlyElectricInr),
    monthlySavingsInr: monthlyRounded,
    annualSavingsInr: monthlyRounded * 12,
  }
}
