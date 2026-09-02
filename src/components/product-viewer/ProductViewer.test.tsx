import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { scooterModels } from '../../data/models'
import { stormViewerConfig } from '../../data/products/amptron-storm'
import ProductViewer from './ProductViewer'

const storm = scooterModels.find((model) => model.slug === 'amptron-storm')!

describe('ProductViewer', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    })
    class FakeObserver {
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal('ResizeObserver', FakeObserver)
  })

  it('renders the Storm exterior explorer without a 360 label', async () => {
    const user = userEvent.setup()
    render(<ProductViewer model={storm} config={stormViewerConfig} />)

    expect(screen.getByLabelText('Amptron Storm product viewer')).toBeVisible()
    expect(screen.getByText(/midnight navy/i)).toBeVisible()
    expect(screen.queryByRole('tab', { name: '360°' })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Exterior' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    await user.click(screen.getByRole('tab', { name: 'Seat' }))
    expect(screen.getByRole('button', { name: 'Open seat' })).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Close seat' }),
    ).not.toBeInTheDocument()
  })

  it('exposes features and hides held lights, dashboard, and 360 modes', () => {
    render(<ProductViewer model={storm} config={stormViewerConfig} />)
    expect(screen.getByRole('tab', { name: 'Features' })).toBeVisible()
    expect(screen.queryByRole('tab', { name: 'Lights' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Dashboard' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: '360°' })).not.toBeInTheDocument()
  })

  it('rotates named exterior angles with the keyboard', async () => {
    const user = userEvent.setup()
    render(<ProductViewer model={storm} config={stormViewerConfig} />)
    const viewer = screen.getByLabelText('Amptron Storm product viewer')
    viewer.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('img', { name: /from the front/i })).toBeInTheDocument()
  })

  it('steps angles with the arrows and jumps with the angle dots', async () => {
    const user = userEvent.setup()
    render(<ProductViewer model={storm} config={stormViewerConfig} />)

    await user.click(screen.getByRole('button', { name: 'Next angle' }))
    expect(screen.getByRole('img', { name: /from the front/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show rear view' }))
    expect(screen.getByRole('img', { name: /from the rear/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show rear view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('switches colourways and discloses digital previews', async () => {
    const user = userEvent.setup()
    render(<ProductViewer model={storm} config={stormViewerConfig} />)

    expect(screen.getByText(/color · midnight navy/i)).toBeVisible()
    expect(screen.queryByText(/digital colour preview/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Color Crimson Red' }))
    expect(screen.getByText(/color · crimson red/i)).toBeVisible()
    expect(screen.getByText(/digital colour preview/i)).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Color Midnight Navy' }))
    expect(screen.queryByText(/digital colour preview/i)).not.toBeInTheDocument()
  })

  it('walks the seat and storage flow with on-stage actions and a state chip', async () => {
    const user = userEvent.setup()
    render(<ProductViewer model={storm} config={stormViewerConfig} />)

    await user.click(screen.getByRole('tab', { name: 'Seat' }))
    expect(screen.getByText('Seat · Closed')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Open seat' }))
    expect(screen.getByText('Seat · Open')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Close seat' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Explore storage' }))
    expect(screen.getByRole('tab', { name: 'Storage' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByText('Storage', { selector: 'p' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Back to seat' }))
    expect(screen.getByRole('tab', { name: 'Seat' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('opens feature details below the stage with prev/next browsing', async () => {
    const user = userEvent.setup()
    render(<ProductViewer model={storm} config={stormViewerConfig} />)

    await user.click(screen.getByRole('tab', { name: 'Features' }))
    await user.click(screen.getByRole('button', { name: 'Battery' }))
    expect(screen.getByRole('heading', { name: 'Battery' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Battery' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    await user.click(screen.getByRole('button', { name: 'Next feature' }))
    expect(
      screen.queryByRole('heading', { name: 'Battery' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close feature details' }))
    expect(
      screen.queryByRole('button', { name: 'Close feature details' }),
    ).not.toBeInTheDocument()
  })

  it('closes the feature panel when the angle changes', async () => {
    const user = userEvent.setup()
    render(<ProductViewer model={storm} config={stormViewerConfig} />)

    await user.click(screen.getByRole('tab', { name: 'Features' }))
    await user.click(screen.getByRole('button', { name: 'Battery' }))
    await user.click(screen.getByRole('button', { name: 'Next angle' }))
    expect(
      screen.queryByRole('button', { name: 'Close feature details' }),
    ).not.toBeInTheDocument()
  })

  it('keeps keyboard rotation when motion is reduced', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    })
    const user = userEvent.setup()
    render(<ProductViewer model={storm} config={stormViewerConfig} />)
    const viewer = screen.getByLabelText('Amptron Storm product viewer')
    viewer.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('img', { name: /from the front/i })).toBeInTheDocument()
  })
})
