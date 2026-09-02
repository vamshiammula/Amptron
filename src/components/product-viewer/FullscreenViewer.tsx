import { useEffect, useRef, type ReactNode } from 'react'

export default function FullscreenViewer({
  active,
  fallback,
  label,
  onClose,
  children,
}: Readonly<{
  active: boolean
  fallback: boolean
  label: string
  onClose: () => void
  children: ReactNode
}>) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active || !fallback) return
    const current = document.activeElement
    previousFocus.current = current instanceof HTMLElement ? current : null
    closeRef.current?.focus()
    return () => {
      previousFocus.current?.focus()
    }
  }, [active, fallback])

  if (!active || !fallback) return children

  return (
    <dialog
      open
      className="product-viewer-fullscreen product-viewer-fullscreen--fallback"
      aria-label={label}
    >
      <div className="product-viewer-fullscreen-bar">
        <p>{label}</p>
        <button
          ref={closeRef}
          type="button"
          aria-label="Exit fullscreen"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  )
}
