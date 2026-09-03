import { render, screen } from '@testing-library/react'
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

    const mapsLink = await screen.findByRole('link', { name: 'Open in Maps' })
    expect(mapsLink).toHaveAttribute('target', '_blank')
    expect(mapsLink.getAttribute('href')).toMatch(
      /google\.com\/maps|maps\.apple\.com/,
    )
    expect(mapsLink.getAttribute('href')).toMatch(/Thaltej/)
    expect(await screen.findByText('1 showroom across India')).toBeInTheDocument()
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
