interface SectionHeaderProps {
  eyebrow?: string
  title: string
  sub?: string
  light?: boolean
  align?: 'center' | 'left'
}

export default function SectionHeader({
  eyebrow,
  title,
  sub,
  light = false,
  align = 'center',
}: SectionHeaderProps) {
  return (
    <header
      className={`section-header${align === 'left' ? ' section-header--left' : ''}`}
    >
      {eyebrow ? (
        <div className="eyebrow">
          <span className="eyebrow-bar" />
          {eyebrow}
        </div>
      ) : null}
      <h2 className={`section-title${light ? ' section-title--light' : ''}`}>
        {title}
      </h2>
      {sub ? <p className="section-sub">{sub}</p> : null}
    </header>
  )
}
