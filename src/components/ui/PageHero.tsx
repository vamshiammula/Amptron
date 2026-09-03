import type { ReactNode } from 'react'

interface PageHeroProps {
  eyebrow?: string
  title: string
  lede?: string
  /** Optional actions or meta rendered under the lede. */
  children?: ReactNode
  /** Optional media rendered beside the copy on wide screens. */
  aside?: ReactNode
  tone?: 'fog' | 'navy'
  narrow?: boolean
}

export default function PageHero({
  eyebrow,
  title,
  lede,
  children,
  aside,
  tone = 'fog',
  narrow = false,
}: PageHeroProps) {
  const classes = ['page-hero', `page-hero--${tone}`]
  if (aside) classes.push('page-hero--split')

  return (
    <section className={classes.join(' ')}>
      <div
        className={`wrap page-hero-inner${narrow ? ' page-hero-inner--narrow' : ''}`}
      >
        <div className="page-hero-copy">
          {eyebrow ? (
            <div className="eyebrow">
              <span className="eyebrow-bar" />
              {eyebrow}
            </div>
          ) : null}
          <h1>{title}</h1>
          {lede ? <p className="page-hero-lede">{lede}</p> : null}
          {children ? <div className="page-hero-actions">{children}</div> : null}
        </div>
        {aside ? <div className="page-hero-aside">{aside}</div> : null}
      </div>
    </section>
  )
}
