import { useEffect, type KeyboardEvent } from 'react'
export default function WorkspaceTabs({
  items,
  active,
  onChange,
  prefix,
}: {
  items: readonly { id: string; label: string; count?: number }[]
  active: string
  onChange: (id: string) => void
  prefix: string
}) {
  useEffect(() => {
    const selected = document.getElementById(`${prefix}-tab-${active}`)
    const list = selected?.parentElement
    if (selected && list && list.scrollWidth > list.clientWidth)
      list.scrollLeft = selected.offsetLeft - list.offsetLeft - 12
  }, [active, prefix])
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!keys.includes(event.key)) return
    event.preventDefault()
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + items.length) %
            items.length
    onChange(items[next].id)
    document.getElementById(`${prefix}-tab-${items[next].id}`)?.focus()
  }
  return (
    <nav
      className="ops-toolbar"
      aria-label={`${prefix === 'ops' ? 'Admin' : 'Dealer'} sections`}
    >
      <div className="portal-tabs" role="tablist">
        {items.map((item, index) => (
          <button
            key={item.id}
            role="tab"
            id={`${prefix}-tab-${item.id}`}
            aria-selected={active === item.id}
            aria-controls={`${prefix}-panel-${item.id}`}
            tabIndex={active === item.id ? 0 : -1}
            className={active === item.id ? 'is-active' : ''}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => navigate(event, index)}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="ops-tab-count">{item.count}</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
