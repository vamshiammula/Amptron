/** EMI terms. Replace with lender figures before launch. */

export const EMI_DEFAULTS = {
  annualRatePct: 9.99,
  tenureMonths: 36,
  downPaymentInr: 0,
} as const

export const PRICE_PLACEHOLDER_NOTE =
  'Indicative. Final ex-showroom price on booking.'

export const EMI_FOOTNOTE = `EMI estimate at ${EMI_DEFAULTS.annualRatePct}% for ${EMI_DEFAULTS.tenureMonths} months, ₹${EMI_DEFAULTS.downPaymentInr} down. Lender terms vary.`

export {
  OWNERSHIP_DEFAULTS,
  OWNERSHIP_LIMITS,
  OWNERSHIP_SOURCES,
  SAVINGS_DEFAULTS,
  SAVINGS_LIMITS,
  batteryRepairInr,
  batteryReplacementInr,
  batteryWorkLimits,
  estimateOwnership,
  estimateSavings,
  kwhPerKm,
  savingsBarPeak,
} from '@shared/savings'
export type {
  BatteryAction,
  OwnershipInput,
  OwnershipResult,
  SavingsInput,
  SavingsResult,
} from '@shared/savings'

export function ownershipCalculatorPath(slug?: string): string {
  if (!slug) return '/ownership-calculator'
  return `/ownership-calculator?model=${encodeURIComponent(slug)}`
}

export function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

export function formatInrPerKm(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function monthlyEmi(
  principalInr: number,
  annualRatePct: number = EMI_DEFAULTS.annualRatePct,
  months: number = EMI_DEFAULTS.tenureMonths,
  downPaymentInr: number = EMI_DEFAULTS.downPaymentInr,
): number {
  const principal = Math.max(0, principalInr - downPaymentInr)
  if (principal === 0 || months <= 0) return 0
  const monthlyRate = annualRatePct / 12 / 100
  if (monthlyRate === 0) return Math.round(principal / months)
  const factor = (1 + monthlyRate) ** months
  return Math.round((principal * monthlyRate * factor) / (factor - 1))
}
