import type { PropsWithChildren } from 'react'
import { useInView } from '../../lib/useInView'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'

interface RevealProps extends PropsWithChildren {
  className?: string
  as?: 'div' | 'section' | 'article' | 'li'
}

export default function Reveal({
  children,
  className = '',
  as: Tag = 'div',
}: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const shown = reduced || inView

  return (
    <Tag
      ref={ref as never}
      className={`reveal${shown ? ' is-in' : ''}${className ? ` ${className}` : ''}`}
    >
      {children}
    </Tag>
  )
}
