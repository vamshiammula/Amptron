import { useId } from 'react'

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
  const id = useId()
  return (
    <div className="filter-field">
      <label className="filter-field-label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="filter-select-btn"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}
