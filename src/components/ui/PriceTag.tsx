import {
  EMI_FOOTNOTE,
  PRICE_PLACEHOLDER_NOTE,
  formatInr,
  monthlyEmi,
} from '../../data/pricing'
import type { ModelPricing } from '../../data/models'

interface PriceTagProps {
  pricing?: ModelPricing
  compact?: boolean
}

export default function PriceTag({ pricing, compact = false }: PriceTagProps) {
  if (!pricing) return null

  const emi = monthlyEmi(pricing.exShowroomInr)
  const note = pricing.placeholder
    ? PRICE_PLACEHOLDER_NOTE
    : (pricing.note ?? EMI_FOOTNOTE)

  return (
    <div className={`price-tag${compact ? ' price-tag--compact' : ''}`}>
      <p className="price-tag-amount">
        <span className="price-tag-kicker">Starting at</span>
        <strong>{formatInr(pricing.exShowroomInr)}</strong>
      </p>
      <p className="price-tag-emi">or {formatInr(emi)}/month*</p>
      {compact ? null : <p className="price-tag-note">*{note}</p>}
    </div>
  )
}
