import { describe, expect, it } from 'vitest'
import {
  SAVINGS_DEFAULTS,
  estimateSavings,
  kwhPerKm,
  savingsBarPeak,
} from './savings.js'

const storm = kwhPerKm(2.65, 120)

describe('savings formula', () => {
  it('uses petrol price, mileage, and days as inputs, not locked constants', () => {
    const base = estimateSavings({
      dailyKm: 30,
      kwhPerKm: storm,
      petrolInrPerLitre: SAVINGS_DEFAULTS.petrolInrPerLitre,
      petrolKmPerLitre: 40,
      electricityInrPerUnit: SAVINGS_DEFAULTS.electricityInrPerUnit,
      ridingDaysPerMonth: SAVINGS_DEFAULTS.ridingDaysPerMonth,
    })
    const dearerPetrol = estimateSavings({
      dailyKm: 30,
      kwhPerKm: storm,
      petrolInrPerLitre: 120,
      petrolKmPerLitre: 40,
      electricityInrPerUnit: SAVINGS_DEFAULTS.electricityInrPerUnit,
      ridingDaysPerMonth: SAVINGS_DEFAULTS.ridingDaysPerMonth,
    })
    const thirstierScooter = estimateSavings({
      dailyKm: 30,
      kwhPerKm: storm,
      petrolInrPerLitre: SAVINGS_DEFAULTS.petrolInrPerLitre,
      petrolKmPerLitre: 30,
      electricityInrPerUnit: SAVINGS_DEFAULTS.electricityInrPerUnit,
      ridingDaysPerMonth: SAVINGS_DEFAULTS.ridingDaysPerMonth,
    })

    expect(dearerPetrol.monthlyPetrolInr).toBeGreaterThan(base.monthlyPetrolInr)
    expect(thirstierScooter.monthlyPetrolInr).toBeGreaterThan(
      base.monthlyPetrolInr,
    )
    expect(base.annualSavingsInr).toBe(base.monthlySavingsInr * 12)
  })

  it('matches the written petrol formula for a round trip', () => {
    const result = estimateSavings({
      dailyKm: 40,
      kwhPerKm: 0.02,
      petrolInrPerLitre: 100,
      petrolKmPerLitre: 40,
      electricityInrPerUnit: 10,
      ridingDaysPerMonth: 25,
    })
    // 40 km × 25 days = 1,000 km. 1,000 / 40 km/l × ₹100 = ₹2,500.
    expect(result.monthlyKm).toBe(1000)
    expect(result.monthlyPetrolInr).toBe(2500)
    // 1,000 km × 0.02 kWh/km × ₹10 = ₹200.
    expect(result.monthlyElectricInr).toBe(200)
    expect(result.monthlySavingsInr).toBe(2300)
  })

  it('leaves headroom so the petrol bar can grow from the default figure', () => {
    const peak = savingsBarPeak(1875, 188)
    expect(peak).toBeGreaterThan(1875)
    expect(1875 / peak).toBeCloseTo(0.4, 1)
    expect(savingsBarPeak(7000, 500)).toBe(7000)
  })
})
