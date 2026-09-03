import { useEffect, useState } from 'react'
import { useInView } from '../../lib/useInView'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'

interface StatCounterProps {
  value: number
  suffix?: string
  label: string
  decimals?: number
}

export default function StatCounter({
  value,
  suffix = '',
  label,
  decimals = 0,
}: StatCounterProps) {
  const [ref, inView] = useInView<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (!inView || reduced) return

    const duration = 900
    const started = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration)
      const eased = 1 - (1 - progress) ** 3
      setShown(value * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, reduced, value])

  const current = reduced ? (inView ? value : 0) : shown
  const display =
    decimals > 0
      ? current.toFixed(decimals)
      : Math.round(current).toLocaleString('en-IN')

  return (
    <div className="stat-counter" ref={ref}>
      <strong>
        {display}
        {suffix}
      </strong>
      <span>{label}</span>
    </div>
  )
}
