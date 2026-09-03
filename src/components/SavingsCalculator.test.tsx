import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import SavingsCalculator from './SavingsCalculator'

describe('SavingsCalculator', () => {
  it('starts on running cost with energy filters on that tab', () => {
    render(<SavingsCalculator />)

    expect(screen.getByRole('tab', { name: 'Running cost' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByText(/per month, energy only/i)).toBeVisible()
    expect(screen.getByRole('slider', { name: /petrol price/i })).toBeVisible()
    expect(screen.queryByRole('slider', { name: /petrol service/i })).toBeNull()
    expect(screen.queryByText(/estimated saving over 5 years/i)).toBeNull()
  })

  it('puts service rates on the service tab and all filters on the five-year tab', async () => {
    const user = userEvent.setup()
    render(<SavingsCalculator />)

    await user.click(screen.getByRole('tab', { name: 'Service' }))
    expect(screen.getByText(/per year, routine service/i)).toBeVisible()
    expect(screen.getByRole('slider', { name: /petrol service/i })).toBeVisible()
    expect(screen.getByRole('slider', { name: /amptron service/i })).toBeVisible()
    expect(screen.queryByRole('slider', { name: /petrol price/i })).toBeNull()
    expect(screen.queryByText(/see what makes up the five-year total/i)).toBeNull()

    await user.click(screen.getByRole('tab', { name: '5-year total' }))
    expect(screen.getByText(/estimated saving over 5 years/i)).toBeVisible()
    expect(screen.getByRole('slider', { name: /petrol price/i })).toBeVisible()
    expect(screen.getByRole('slider', { name: /petrol service/i })).toBeVisible()
    const petrolPurchase = screen.getByRole('slider', { name: /petrol purchase/i })
    const amptronPurchase = screen.getByRole('slider', {
      name: /amptron storm purchase/i,
    })
    expect(petrolPurchase).toBeVisible()
    expect(petrolPurchase).toHaveAttribute('min', '20000')
    expect(petrolPurchase).toHaveAttribute('max', '200000')
    expect(amptronPurchase).toHaveAttribute('min', '20000')
    expect(amptronPurchase).toHaveAttribute('max', '200000')
    expect(screen.getAllByText('₹20,000')).toHaveLength(2)
    expect(screen.getAllByText('₹2,00,000')).toHaveLength(2)
    expect(screen.getByRole('radio', { name: 'Leave out' })).toBeVisible()
    expect(screen.getByText(/see what makes up the five-year total/i)).toBeVisible()
    expect(screen.queryByRole('table')).toBeNull()

    await user.click(screen.getByText(/see what makes up the five-year total/i))
    const bridge = screen.getByRole('table')
    expect(bridge).toBeVisible()
    expect(within(bridge).getByText('Purchase')).toBeVisible()
    expect(within(bridge).getByText('Energy')).toBeVisible()
    expect(within(bridge).getByText('Service')).toBeVisible()
    expect(within(bridge).queryByText('Battery repair')).toBeNull()
    expect(within(bridge).queryByText('Battery replacement')).toBeNull()
  })

  it('keeps battery work on its own tab, with repair or replacement', async () => {
    const user = userEvent.setup()
    render(<SavingsCalculator />)

    await user.click(screen.getByRole('tab', { name: 'Battery' }))
    expect(
      screen.getByText(/no battery cost in this 5-year estimate/i),
    ).toBeVisible()
    expect(screen.getByRole('radio', { name: 'Leave out' })).toBeChecked()
    expect(screen.queryByRole('slider', { name: /repair year/i })).toBeNull()
    expect(screen.queryByRole('slider', { name: /replacement year/i })).toBeNull()

    await user.click(screen.getByRole('radio', { name: 'Repair the pack' }))
    expect(screen.getByRole('slider', { name: /repair year/i })).toBeVisible()
    expect(screen.getByRole('slider', { name: /repair cost/i })).toBeVisible()
    expect(screen.getByText(/repair on/i)).toBeVisible()
    expect(screen.getByText(/equivalent full charges/i)).toBeVisible()

    await user.click(screen.getByRole('tab', { name: '5-year total' }))
    await user.click(screen.getByText(/see what makes up the five-year total/i))
    expect(screen.getByText('Battery repair')).toBeVisible()
  })

  it('updates the live result when daily distance changes', () => {
    render(<SavingsCalculator />)

    const amount = screen
      .getByText(/you keep each year on fuel/i)
      .closest('.savings-card')
    const before = amount?.textContent

    fireEvent.change(screen.getByRole('slider', { name: /daily distance/i }), {
      target: { value: '150' },
    })

    expect(amount?.textContent).not.toBe(before)
  })
})
