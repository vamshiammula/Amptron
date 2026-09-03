import { useEffect, useId, useRef, useState } from 'react'

interface FilterSelectProps {
  label: string
  value: string
  options: string[]
  placeholder: string
  onChange: (value: string) => void
}

export default function FilterSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
}: Readonly<FilterSelectProps>) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const display = value || placeholder
  const items = [
    { value: '', label: placeholder },
    ...options.map((option) => ({ value: option, label: option })),
  ]

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="filter-field">
      <span className="filter-field-label">{label}</span>
      <div className="filter-select" ref={rootRef}>
        <button
          type="button"
          className="filter-select-btn"
          aria-label={`${label}: ${display}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((current) => !current)}
        >
          {display}
          <span className="filter-select-chevron" aria-hidden="true" />
        </button>
        {open ? (
          <ul
            className="filter-select-menu"
            id={listId}
            role="listbox"
            aria-label={label}
          >
            {items.map((item) => (
              <li key={item.value || 'all'}>
                <button
                  type="button"
                  role="option"
                  aria-selected={item.value === value}
                  className={item.value === value ? 'is-active' : undefined}
                  onClick={() => {
                    onChange(item.value)
                    setOpen(false)
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
