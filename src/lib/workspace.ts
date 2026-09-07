export function displayStatus(value: string) {
  const text = value.replaceAll('_', ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}
export function displayDate(value?: string) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date)
    : '—'
}
export function csvText(rows: readonly (readonly unknown[])[]) {
  return (
    '\uFEFF' +
    rows
      .map((row) =>
        row
          .map((cell) => {
            let value = String(cell ?? '')
            if (/^[\s]*[=+@-]/.test(value)) value = "'" + value
            return '"' + value.replaceAll('"', '""') + '"'
          })
          .join(','),
      )
      .join('\r\n')
  )
}
export function exportCsv(name: string, rows: readonly (readonly unknown[])[]) {
  const url = URL.createObjectURL(
    new Blob([csvText(rows)], { type: 'text/csv;charset=utf-8' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = `amptron-${name}.csv`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
