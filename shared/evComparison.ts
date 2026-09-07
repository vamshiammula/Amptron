/** Generic, user-entered EV scenarios. No competitor claims or default advantage. */
export interface ElectricScenario {
  purchase: number
  batteryKwh: number
  rangeKm: number
  servicePerKm: number
  batteryAllowance: number
}
export interface ElectricUsage {
  dailyKm: number
  daysPerMonth: number
  electricity: number
  lossPct: number
}
const valid = (s: ElectricScenario) =>
  Object.values(s).every(Number.isFinite) &&
  s.purchase > 0 &&
  s.batteryKwh > 0 &&
  s.rangeKm > 0 &&
  s.servicePerKm >= 0 &&
  s.batteryAllowance >= 0

export function compareElectric(
  amptron: ElectricScenario,
  other: ElectricScenario,
  usage: ElectricUsage,
) {
  if (
    !valid(amptron) ||
    !valid(other) ||
    !Object.values(usage).every(Number.isFinite) ||
    usage.dailyKm <= 0 ||
    usage.daysPerMonth <= 0 ||
    usage.daysPerMonth > 31 ||
    usage.electricity < 0 ||
    usage.lossPct < 0
  )
    return null
  const monthlyKm = usage.dailyKm * usage.daysPerMonth
  const calculate = (s: ElectricScenario) => {
    const energy =
      ((monthlyKm * s.batteryKwh) / s.rangeKm) *
      usage.electricity *
      (1 + usage.lossPct / 100)
    const service = monthlyKm * s.servicePerKm
    const running = energy + service
    const total = s.purchase + running * 60 + s.batteryAllowance
    return {
      purchase: s.purchase,
      energy,
      service,
      running,
      battery: s.batteryAllowance,
      total,
      perKm: total / (monthlyKm * 60),
    }
  }
  const a = calculate(amptron),
    b = calculate(other)
  return {
    amptron: a,
    other: b,
    monthlyKm,
    monthlyDifference: b.running - a.running,
    purchaseDifference: b.purchase - a.purchase,
    totalDifference: b.total - a.total,
  }
}
