import { render, screen } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
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
        <DealerLocatorPage />
      </HelmetProvider>,
    )

    const mapsLink = await screen.findByRole('link', { name: 'Open in Maps' })
    expect(mapsLink).toHaveAttribute('target', '_blank')
    expect(mapsLink.getAttribute('href')).toMatch(
      /google\.com\/maps|maps\.apple\.com/,
    )
    expect(mapsLink.getAttribute('href')).toMatch(/Thaltej/)
  })
})
