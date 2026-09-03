import { useEffect, useRef, useState, type RefObject } from 'react'

/** Never leave content hidden if the observer is slow or unavailable. */
const FALLBACK_MS = 1500

export function useInView<T extends HTMLElement>(
  once = true,
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setInView(true)
        if (once) observer.disconnect()
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    )

    observer.observe(node)
    const fallback = window.setTimeout(() => {
      const rect = node.getBoundingClientRect()
      if (rect.top < window.innerHeight) setInView(true)
    }, FALLBACK_MS)

    return () => {
      observer.disconnect()
      window.clearTimeout(fallback)
    }
  }, [once])

  return [ref, inView]
}
