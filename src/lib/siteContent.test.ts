import { describe, expect, it } from 'vitest'
import { mapBlogPost, mapScooterModel, mapSiteMedia } from './siteContentMap'

describe('site content mappers', () => {
  it('maps a scooter model row into the catalog shape', () => {
    const model = mapScooterModel({
      slug: 'amptron-volt',
      name: 'Amptron Volt',
      tagline: 'City commuter',
      description: 'Short-range scooter',
      image_url: 'https://example.test/volt.webp',
      featured: true,
      highlights: [{ label: 'Range', value: '80 km', note: 'City' }],
      specs: [{ label: 'Weight', value: '89 kg' }],
      features: ['Digital dashboard'],
    })

    expect(model).toMatchObject({
      slug: 'amptron-volt',
      name: 'Amptron Volt',
      tagline: 'City commuter',
      description: 'Short-range scooter',
      image: 'https://example.test/volt.webp',
      featured: true,
      highlights: [{ label: 'Range', value: '80 km', note: 'City' }],
      specs: [{ label: 'Weight', value: '89 kg' }],
      features: ['Digital dashboard'],
      batteryKwh: 0,
      certifiedRangeKm: 0,
    })
  })

  it('rejects incomplete model rows', () => {
    expect(
      mapScooterModel({
        slug: '',
        name: 'Volt',
        tagline: '',
        description: '',
        image_url: 'https://example.test/volt.webp',
        featured: false,
        highlights: [],
        specs: [],
        features: [],
      }),
    ).toBeNull()
  })

  it('maps blog posts and keeps the calendar date', () => {
    expect(
      mapBlogPost({
        slug: 'dealer-playbook',
        title: 'Dealer Playbook',
        excerpt: 'Launch guide',
        published_at: '2026-08-20T00:00:00+00:00',
      }),
    ).toEqual({
      slug: 'dealer-playbook',
      title: 'Dealer Playbook',
      excerpt: 'Launch guide',
      publishedAt: '2026-08-20',
    })
  })

  it('fills site media from keys and keeps local fallbacks', () => {
    const media = mapSiteMedia(
      [
        { key: 'hero_video', url: 'https://example.test/hero.mp4' },
        { key: 'hero_poster', url: '' },
      ],
      {
        heroVideo: '',
        heroPoster: '/local-poster.webp',
        techCutaway: '/local-cutaway.webp',
      },
    )

    expect(media).toEqual({
      heroVideo: 'https://example.test/hero.mp4',
      heroPoster: '/local-poster.webp',
      techCutaway: '/local-cutaway.webp',
    })
  })
})
