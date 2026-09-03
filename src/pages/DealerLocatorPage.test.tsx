import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DealerLocatorPage from './DealerLocatorPage'

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    json: async () => body,
  } as Response
}

describe('Dealer locator', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          dealers: [
            {
              id: 'd1',
              name: 'Greenline EV Hub',
              city: 'Ahmedabad',
              state: 'Gujarat',
              area: 'Thaltej',
              phone: '+91 95101 30001',
            },
            {
              id: 'd2',
              name: 'Coastal Amptron',
              city: 'Kochi',
              state: 'Kerala',
              area: 'Edapally',
              phone: '+91 95101 30002',
            },
          ],
        }),
      ),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('opens a showroom in Maps from the listing card', async () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <DealerLocatorPage />
        </MemoryRouter>
      </HelmetProvider>,
    )

    const mapsLink = await screen.findAllByRole('link', { name: 'Open in Maps' })
    expect(mapsLink[0]).toHaveAttribute('target', '_blank')
    expect(mapsLink[0]?.getAttribute('href')).toMatch(
      /google\.com\/maps|maps\.apple\.com/,
    )
    expect(mapsLink[0]?.getAttribute('href')).toMatch(/Thaltej/)
    expect(await screen.findByText('2 showrooms across India')).toBeInTheDocument()
  })

  it('filters showrooms from branded state and city menus', async () => {
    const user = userEvent.setup()
    render(
      <HelmetProvider>
        <MemoryRouter>
          <DealerLocatorPage />
        </MemoryRouter>
      </HelmetProvider>,
    )

    await screen.findByText('2 showrooms across India')
    await user.click(screen.getByRole('button', { name: 'State: All States' }))
    await user.click(screen.getByRole('option', { name: 'Gujarat' }))

    expect(screen.getByRole('button', { name: 'State: Gujarat' })).toBeVisible()
    expect(screen.getByText('1 showroom in Gujarat')).toBeVisible()
    expect(screen.getByText('Greenline EV Hub')).toBeVisible()
    expect(screen.queryByText('Coastal Amptron')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'City: All Cities' }))
    await user.click(screen.getByRole('option', { name: 'Ahmedabad' }))
    expect(screen.getByText('1 showroom in Ahmedabad')).toBeVisible()
  })

  it('names the city when All States is selected with a city', async () => {
    const user = userEvent.setup()
    render(
      <HelmetProvider>
        <MemoryRouter>
          <DealerLocatorPage />
        </MemoryRouter>
      </HelmetProvider>,
    )

    await screen.findByText('2 showrooms across India')
    await user.click(screen.getByRole('button', { name: 'City: All Cities' }))
    await user.click(screen.getByRole('option', { name: 'Kochi' }))

    expect(screen.getByRole('button', { name: 'State: All States' })).toBeVisible()
    expect(screen.getByText('1 showroom in Kochi')).toBeVisible()
    expect(screen.queryByText('1 showroom across India')).toBeNull()
    expect(screen.queryByText('Greenline EV Hub')).toBeNull()
  })

  it('offers direct purchase when no showroom matches', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ dealers: [] })),
    )
    render(
      <HelmetProvider>
        <MemoryRouter>
          <DealerLocatorPage />
        </MemoryRouter>
      </HelmetProvider>,
    )

    expect(
      await screen.findByText('No showrooms for this filter yet.'),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('link', { name: 'Buy Amptron' }).length,
    ).toBeGreaterThan(0)
  })
})
