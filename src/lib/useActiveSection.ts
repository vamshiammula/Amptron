import { useEffect, useState } from 'react'

/**
 * Track which of the given section ids is closest to the top of the viewport,
 * for highlighting in-page navigation.
 */
export function useActiveSection(ids: string[], offset = 160): string {
  const [active, setActive] = useState(ids[0] ?? '')

  useEffect(() => {
    if (typeof window === 'undefined') return
    let frame = 0

    const update = () => {
      frame = 0
      let current = ids[0] ?? ''
      for (const id of ids) {
        const node = document.getElementById(id)
        if (!node) continue
        if (node.getBoundingClientRect().top - offset <= 0) current = id
      }
      setActive((prev) => (prev === current ? prev : current))
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [ids, offset])

  return active
}
