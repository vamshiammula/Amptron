import { describe, expect, it } from 'vitest'
import { mapsSearchUrl } from './maps'

const query = 'Amptron Manufacturing Pvt. Ltd., IMT Manesar, Gurugram'
const encoded = encodeURIComponent(query)

describe('mapsSearchUrl', () => {
  it('opens Google Maps in a browser or on Android', () => {
    expect(mapsSearchUrl(query, 'Mozilla/5.0 (Linux; Android 14)')).toBe(
      `https://www.google.com/maps/search/?api=1&query=${encoded}`,
    )
  })

  it('opens Apple Maps on iPhone', () => {
    expect(
      mapsSearchUrl(
        query,
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
      ),
    ).toBe(`https://maps.apple.com/?q=${encoded}`)
  })

  it('opens Apple Maps on iPadOS, which reports as Macintosh', () => {
    expect(
      mapsSearchUrl(
        query,
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      ),
    ).toBe(`https://maps.apple.com/?q=${encoded}`)
  })
})
