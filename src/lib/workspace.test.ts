import { expect, it } from 'vitest'
import { csvText, displayDate, displayStatus } from './workspace'
it('exports quoted multiline CSV and neutralizes spreadsheet formulas', () => {
  const csv = csvText([
    ['Name', 'Note'],
    ['A, B', 'line one\nline "two"'],
    ['=HYPERLINK("x")', ' +SUM(1,2)'],
  ])
  expect(csv).toContain('"A, B","line one\nline ""two"""')
  expect(csv).toContain('"\'=HYPERLINK')
  expect(csv).toContain('"\' +SUM')
})
it('formats statuses and missing dates consistently', () => {
  expect(displayStatus('in_dispatch')).toBe('In dispatch')
  expect(displayDate('bad')).toBe('—')
})
