import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import SavingsCalculator from './SavingsCalculator'
describe('EV comparison journey', () => {
  it('starts blank, calculates entered figures and preserves them across modes', async () => {
    const user = userEvent.setup()
    render(<SavingsCalculator />)
    await user.click(
      screen.getByRole('radio', { name: 'Another electric scooter' }),
    )
    expect(screen.getByText('Add your comparison figures')).toBeVisible()
    const other = within(
      screen.getByRole('group', { name: 'Other electric scooter' }),
    )
    await user.type(other.getByLabelText('Purchase price (₹)'), '90000')
    await user.type(other.getByLabelText('Battery capacity (kWh)'), '3')
    await user.type(other.getByLabelText('Range per full charge (km)'), '100')
    expect(screen.getByRole('table')).toBeVisible()
    expect(
      screen.getByText('Estimated five-year ownership difference'),
    ).toBeVisible()
    await user.click(screen.getByRole('radio', { name: 'A petrol scooter' }))
    expect(screen.getByRole('slider', { name: 'Daily distance' })).toBeVisible()
    await user.click(
      screen.getByRole('radio', { name: 'Another electric scooter' }),
    )
    expect(other.getByLabelText('Purchase price (₹)')).toHaveValue(90000)
    await user.clear(other.getByLabelText('Range per full charge (km)'))
    expect(screen.queryByRole('table')).toBeNull()
  })
})
