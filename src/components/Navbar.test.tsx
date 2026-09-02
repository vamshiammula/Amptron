import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Navbar from './Navbar'

function drawer() {
  return screen.getByRole('navigation', { name: 'Mobile', hidden: true })
}

describe('Navbar', () => {
  it('keeps the mobile drawer collapsed and inert by default', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(drawer()).toHaveAttribute('inert')
    expect(drawer()).not.toHaveClass('is-open')
  })

  it('opens and closes the drawer from the toggle', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Open menu' }))

    const toggle = screen.getByRole('button', { name: 'Close menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(drawer()).toHaveClass('is-open')
    expect(drawer()).not.toHaveAttribute('inert')

    await user.click(toggle)

    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(drawer()).toHaveAttribute('inert')
  })

  it('points the toggle at the drawer it controls', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )

    const toggle = screen.getByRole('button', { name: 'Open menu' })
    expect(toggle).toHaveAttribute('aria-controls', drawer().id)
  })

  it('closes the drawer on Escape', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(drawer()).toHaveClass('is-open')

    await user.keyboard('{Escape}')

    expect(drawer()).not.toHaveClass('is-open')
  })

  it('closes the drawer after following a link', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.click(
      screen.getByRole('navigation', { name: 'Mobile' }).querySelector('a')!,
    )

    expect(drawer()).not.toHaveClass('is-open')
  })
})
