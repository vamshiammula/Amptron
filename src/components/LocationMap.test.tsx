import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HEADQUARTERS } from '../data/headquarters'
import { mapsSearchUrl } from '../lib/maps'
import LocationMap from './LocationMap'

describe('LocationMap', () => {
  it('opens headquarters in the visitor’s maps app', () => {
    render(<LocationMap />)

    const link = screen.getByRole('link', {
      name: 'Open Amptron headquarters in Maps',
    })
    expect(link).toHaveAttribute('href', mapsSearchUrl(HEADQUARTERS.mapsQuery))
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
