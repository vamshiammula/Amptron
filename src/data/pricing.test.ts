import { describe, expect, it } from 'vitest'
import {
  EMI_DEFAULTS,
  estimateOwnership,
  estimateSavings,
  formatInr,
  formatInrPerKm,
  kwhPerKm,
  monthlyEmi,
  ownershipCalculatorPath,
} from './pricing'

describe('pricing helpers', () => {
  it('formats rupees with Indian grouping', () => {
    expect(formatInr(109990)).toBe('₹1,09,990')
  })

  it('computes a reducing-balance EMI', () => {
    const emi = monthlyEmi(109990, 9.99, 36, 0)
    expect(emi).toBeGreaterThan(3000)
    expect(emi).toBeLessThan(4000)
    expect(monthlyEmi(120000, 0, 12)).toBe(10000)
    expect(monthlyEmi(0)).toBe(0)
  })

  it('uses default tenure and rate from EMI_DEFAULTS', () => {
    expect(monthlyEmi(100000)).toBe(
      monthlyEmi(
        100000,
        EMI_DEFAULTS.annualRatePct,
        EMI_DEFAULTS.tenureMonths,
        EMI_DEFAULTS.downPaymentInr,
      ),
    )
  })

  it('estimates petrol vs electric running costs from the inputs', () => {
    const result = estimateSavings({
      dailyKm: 30,
      kwhPerKm: kwhPerKm(2.65, 120),
      petrolInrPerLitre: 100,
      petrolKmPerLitre: 40,
      electricityInrPerUnit: 10,
      ridingDaysPerMonth: 25,
    })
    expect(result.monthlyPetrolInr).toBeGreaterThan(result.monthlyElectricInr)
    expect(result.annualSavingsInr).toBe(result.monthlySavingsInr * 12)
  })

  it('formats per-kilometre rates without rounding away paise', () => {
    expect(formatInrPerKm(0.22)).toBe('₹0.22')
    expect(formatInrPerKm(1.5)).toBe('₹1.50')
  })

  it('builds the calculator path with an optional model', () => {
    expect(ownershipCalculatorPath()).toBe('/ownership-calculator')
    expect(ownershipCalculatorPath('amptron-storm')).toBe(
      '/ownership-calculator?model=amptron-storm',
    )
  })

  it('keeps five-year ownership savings signed', () => {
    const result = estimateOwnership({
      dailyKm: 30,
      kwhPerKm: kwhPerKm(2.65, 120),
      petrolInrPerLitre: 100,
      petrolKmPerLitre: 40,
      electricityInrPerUnit: 10,
      ridingDaysPerMonth: 25,
      amptronPurchaseInr: 109990,
      petrolPurchaseInr: 85000,
      chargingLossPct: 10,
      evMaintenanceInrPerKm: 0.22,
      petrolMaintenanceInrPerKm: 0.31,
      batteryAction: 'none',
      batteryWorkYear: 5,
      batteryWorkInr: 48000,
      certifiedRangeKm: 120,
    })
    expect(result.fiveYearSavingsInr).toBe(
      result.petrolTcoInr - result.amptronTcoInr,
    )
    expect(result.horizonYears).toBe(5)
  })
})
