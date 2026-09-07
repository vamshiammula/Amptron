export default function MediaPlaceholder({
  label = 'Amptron',
  compact = false,
}: {
  label?: string
  compact?: boolean
}) {
  return (
    <div
      className={`media-placeholder${compact ? ' media-placeholder--compact' : ''}`}
      aria-label={`${label}: photography coming soon`}
    >
      <span className="media-placeholder-index" aria-hidden="true">
        AMPTRON / ELECTRIC
      </span>
      <strong>{label.replace(/^Amptron\s*/i, '') || 'Amptron'}</strong>
      <span>Photography coming soon</span>
    </div>
  )
}
