import { useEffect, useState } from 'react'
import { preloadPhases } from '../../lib/productViewerMath'

async function decodeSrc(src: string): Promise<void> {
  const image = new Image()
  image.decoding = 'async'
  image.src = src
  if (typeof image.decode === 'function') {
    await image.decode()
    return
  }
  await new Promise<void>((resolve, reject) => {
    image.addEventListener('load', () => resolve(), { once: true })
    image.addEventListener(
      'error',
      () => reject(new Error(`Could not load ${src}`)),
      {
        once: true,
      },
    )
  })
}

export function useImagePreloader(sources: string[], startIndex: number) {
  const [ready, setReady] = useState<ReadonlySet<string>>(() => new Set())
  const [error, setError] = useState<string | null>(null)
  const sourceKey = sources.join('|')

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const list = sourceKey.length === 0 ? [] : sourceKey.split('|')
      const nextReady = new Set<string>()
      const phases = preloadPhases(startIndex, list.length)
      for (const phase of phases) {
        await Promise.all(
          phase.map(async (index) => {
            const src = list[index]
            if (!src || nextReady.has(src)) return
            try {
              await decodeSrc(src)
              if (cancelled) return
              nextReady.add(src)
              setReady(new Set(nextReady))
            } catch {
              if (!cancelled) setError('A product image could not be loaded.')
            }
          }),
        )
        if (cancelled) return
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [startIndex, sourceKey])

  return {
    ready,
    error,
    isStartReady: Boolean(sources[startIndex] && ready.has(sources[startIndex])),
  }
}
