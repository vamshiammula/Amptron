import { describe, expect, it } from 'vitest'
import { stormViewerConfig } from '../data/products/amptron-storm'
import { mapPublishedViewerConfigs } from './productMediaMap'

describe('mapPublishedViewerConfigs', () => {
  it('replaces a local experience with published approved assets', () => {
    const mapped = mapPublishedViewerConfigs(
      [
        {
          id: 1,
          mode: 'charging',
          label: 'Charging',
          lifecycle: 'published',
          start_key: 'open',
          scooter_models: { slug: 'amptron-storm' },
          product_media_assets: [
            {
              object_path: 'products/amptron-storm/charging/1/open.jpg',
              state_key: 'open',
              sequence_index: 0,
              alt: 'Port open',
              width: 1024,
              height: 1024,
              approval: 'approved',
              hotspots: [],
            },
            {
              object_path: 'products/amptron-storm/charging/1/closed.jpg',
              state_key: 'closed',
              sequence_index: 1,
              alt: 'Port closed',
              width: 1024,
              height: 1024,
              approval: 'hold',
              hotspots: [],
            },
          ],
        },
      ],
      (path) => `https://cdn.test/${path}`,
      { 'amptron-storm': stormViewerConfig },
    )

    const charging = mapped['amptron-storm']?.experiences.find(
      (item) => item.id === 'charging',
    )
    expect(charging?.startKey).toBe('open')
    expect(charging?.assets).toHaveLength(1)
    expect(charging?.assets[0]?.src).toContain('open.jpg')
  })
})
