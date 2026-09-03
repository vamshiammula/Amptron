import { describe, expect, it } from 'vitest'
import {
  OWNERSHIP_DEFAULTS,
  OWNERSHIP_LIMITS,
  SAVINGS_DEFAULTS,
  batteryRepairInr,
  batteryReplacementInr,
  estimateOwnership,
  estimateSavings,
  kwhPerKm,
  savingsBarPeak,
} from './savings.js'

const storm = kwhPerKm(2.65, 120)

function stormOwnership(
  overrides: Partial<Parameters<typeof estimateOwnership>[0]> = {},
) {
  return estimateOwnership({
    dailyKm: 30,
    kwhPerKm: storm,
    petrolInrPerLitre: SAVINGS_DEFAULTS.petrolInrPerLitre,
    petrolKmPerLitre: 40,
    electricityInrPerUnit: SAVINGS_DEFAULTS.electricityInrPerUnit,
    ridingDaysPerMonth: SAVINGS_DEFAULTS.ridingDaysPerMonth,
    amptronPurchaseInr: 109990,
    petrolPurchaseInr: OWNERSHIP_DEFAULTS.petrolPurchaseInr,
    chargingLossPct: OWNERSHIP_DEFAULTS.chargingLossPct,
    evMaintenanceInrPerKm: OWNERSHIP_DEFAULTS.evMaintenanceInrPerKm,
    petrolMaintenanceInrPerKm: OWNERSHIP_DEFAULTS.petrolMaintenanceInrPerKm,
    batteryAction: 'none',
    batteryWorkYear: OWNERSHIP_DEFAULTS.batteryWorkYear,
    batteryWorkInr: batteryReplacementInr(2.65),
    certifiedRangeKm: 120,
    ...overrides,
  })
}

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
    expect(thirstierScooter.monthlyPetrolInr).toBeGreaterThan(base.monthlyPetrolInr)
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

describe('five-year ownership', () => {
  it('applies charging loss to electricity drawn from the wall', () => {
    const none = stormOwnership({ chargingLossPct: 0 })
    const withLoss = stormOwnership({ chargingLossPct: 10 })
    expect(withLoss.monthlyElectricEnergyInr).toBeGreaterThan(
      none.monthlyElectricEnergyInr,
    )
    expect(
      withLoss.monthlyElectricEnergyInr / none.monthlyElectricEnergyInr,
    ).toBeCloseTo(1.1, 1)
  })

  it('scales service with kilometres using the CEEW rates', () => {
    const result = stormOwnership()
    expect(result.monthlyKm).toBe(750)
    expect(result.monthlyPetrolServiceInr).toBe(Math.round(750 * 0.31))
    expect(result.monthlyElectricServiceInr).toBe(Math.round(750 * 0.22))
    expect(result.annualServiceSavingsInr).toBe(
      (result.monthlyPetrolServiceInr - result.monthlyElectricServiceInr) * 12,
    )
  })

  it('keeps battery replacement out of the default five-year total', () => {
    const result = stormOwnership()
    expect(result.batteryIncluded).toBe(false)
    expect(result.fiveYearBatteryInr).toBe(0)
    expect(result.amptronTcoInr).toBe(
      result.amptronPurchaseInr +
        result.fiveYearElectricEnergyInr +
        result.fiveYearElectricServiceInr,
    )
  })

  it('adds a battery scenario only when opted in and the year falls inside the horizon', () => {
    const inside = stormOwnership({
      batteryAction: 'replace',
      batteryWorkYear: 5,
      batteryWorkInr: 48000,
    })
    const afterHorizon = stormOwnership({
      batteryAction: 'replace',
      batteryWorkYear: 8,
      batteryWorkInr: 48000,
    })
    expect(inside.batteryIncluded).toBe(true)
    expect(inside.batteryAction).toBe('replace')
    expect(inside.fiveYearBatteryInr).toBe(48000)
    expect(inside.amptronTcoInr).toBeGreaterThan(stormOwnership().amptronTcoInr)
    expect(afterHorizon.batteryIncluded).toBe(false)
    expect(afterHorizon.fiveYearBatteryInr).toBe(0)
  })

  it('treats pack repair as a cheaper battery scenario than replacement', () => {
    const repair = stormOwnership({
      batteryAction: 'repair',
      batteryWorkYear: 5,
      batteryWorkInr: 14000,
    })
    const replace = stormOwnership({
      batteryAction: 'replace',
      batteryWorkYear: 5,
      batteryWorkInr: 48000,
    })
    expect(repair.batteryIncluded).toBe(true)
    expect(repair.fiveYearBatteryInr).toBe(14000)
    expect(replace.fiveYearBatteryInr).toBe(48000)
    expect(repair.amptronTcoInr).toBeLessThan(replace.amptronTcoInr)
  })

  it('reports equivalent full charges from usage, not a failure date', () => {
    const result = stormOwnership({
      batteryAction: 'replace',
      batteryWorkYear: 5,
    })
    expect(result.annualKm).toBe(9000)
    expect(result.equivalentCyclesOverHorizon).toBeCloseTo((9000 * 5) / 120)
    expect(result.equivalentCyclesToWork).toBeCloseTo((9000 * 5) / 120)
  })

  it('allows a negative five-year saving when Amptron costs more', () => {
    const result = stormOwnership({
      amptronPurchaseInr: 175000,
      petrolPurchaseInr: 50000,
      batteryAction: 'replace',
      batteryWorkYear: 3,
      batteryWorkInr: 120000,
    })
    expect(result.fiveYearSavingsInr).toBeLessThan(0)
    expect(result.fiveYearSavingsInr).toBe(
      result.petrolTcoInr - result.amptronTcoInr,
    )
  })

  it('clamps purchase prices to ₹20,000–₹2,00,000', () => {
    expect(stormOwnership({ petrolPurchaseInr: 0 }).petrolPurchaseInr).toBe(
      OWNERSHIP_LIMITS.minPetrolPurchaseInr,
    )
    expect(stormOwnership({ petrolPurchaseInr: 500000 }).petrolPurchaseInr).toBe(
      OWNERSHIP_LIMITS.maxPetrolPurchaseInr,
    )
    expect(stormOwnership({ amptronPurchaseInr: 0 }).amptronPurchaseInr).toBe(
      OWNERSHIP_LIMITS.minPetrolPurchaseInr,
    )
    expect(
      stormOwnership({ amptronPurchaseInr: 500000 }).amptronPurchaseInr,
    ).toBe(OWNERSHIP_LIMITS.maxPetrolPurchaseInr)
    expect(OWNERSHIP_LIMITS.minPetrolPurchaseInr).toBe(20000)
    expect(OWNERSHIP_LIMITS.maxPetrolPurchaseInr).toBe(200000)
  })

  it('computes payback from the purchase gap and monthly running saving', () => {
    const cheaperToBuy = stormOwnership({
      amptronPurchaseInr: 80000,
      petrolPurchaseInr: 85000,
    })
    expect(cheaperToBuy.paybackMonths).toBe(0)

    const never = stormOwnership({
      amptronPurchaseInr: 180000,
      petrolPurchaseInr: 50000,
      batteryAction: 'replace',
      batteryWorkYear: 3,
      batteryWorkInr: 150000,
    })
    expect(never.paybackMonths).toBeNull()

    const typical = stormOwnership()
    expect(typical.monthlyRunningSavingsInr).toBeGreaterThan(0)
    expect(typical.paybackMonths).toBe(
      Math.ceil(
        (typical.amptronPurchaseInr - typical.petrolPurchaseInr) /
          typical.monthlyRunningSavingsInr,
      ),
    )
  })

  it('delays payback when a battery cost falls before the purchase gap is recovered', () => {
    const without = stormOwnership({
      amptronPurchaseInr: 120000,
      petrolPurchaseInr: 50000,
    })
    const withBattery = stormOwnership({
      amptronPurchaseInr: 120000,
      petrolPurchaseInr: 50000,
      batteryAction: 'replace',
      batteryWorkYear: 3,
      batteryWorkInr: 80000,
    })
    expect(without.paybackMonths).not.toBeNull()
    expect(withBattery.paybackMonths).toBeGreaterThan(without.paybackMonths!)
  })

  it('prices replacement and repair from pack capacity', () => {
    expect(batteryReplacementInr(2.65)).toBe(Math.round(2.65 * 18000))
    expect(batteryRepairInr(2.65)).toBe(
      Math.round(batteryReplacementInr(2.65) * OWNERSHIP_DEFAULTS.batteryRepairShare),
    )
  })
})
