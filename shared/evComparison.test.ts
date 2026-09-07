import { describe, it, expect } from 'vitest'
import { compareElectric } from './evComparison.js'
const scooter = {
  purchase: 100000,
  batteryKwh: 3,
  rangeKm: 100,
  servicePerKm: 0.2,
  batteryAllowance: 0,
}
const usage = { dailyKm: 40, daysPerMonth: 25, electricity: 10, lossPct: 10 }
describe('generic EV comparison', () => {
  it('gives equal scooters no advantage and reconciles the total', () => {
    const r = compareElectric(scooter, scooter, usage)!
    expect(r.monthlyDifference).toBe(0)
    expect(r.totalDifference).toBe(0)
    expect(r.amptron.energy).toBeCloseTo(330)
    expect(r.amptron.total).toBeCloseTo(131800)
  })
  it('includes both battery allowances and preserves a negative outcome', () => {
    const r = compareElectric(
      { ...scooter, batteryAllowance: 20000 },
      { ...scooter, purchase: 90000, batteryAllowance: 5000 },
      usage,
    )!
    expect(r.totalDifference).toBe(-25000)
    expect(r.purchaseDifference).toBe(-10000)
  })
  it('rejects incomplete and non-finite scenarios rather than inventing savings', () => {
    expect(compareElectric(scooter, { ...scooter, rangeKm: 0 }, usage)).toBeNull()
    expect(
      compareElectric(scooter, { ...scooter, purchase: NaN }, usage),
    ).toBeNull()
    expect(
      compareElectric(scooter, scooter, { ...usage, daysPerMonth: 32 }),
    ).toBeNull()
  })
})
