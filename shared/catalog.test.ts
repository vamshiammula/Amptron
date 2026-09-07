import { describe, expect, it } from 'vitest'
import { catalogSchema, createModelTemplate, duplicateModel } from './catalog.js'

const entry = {
  ...createModelTemplate(),
  slug: 'amptron-next',
  name: 'Amptron Next',
}
describe('model templates', () => {
  it('starts with no media or invented product numbers and stays unpublished', () => {
    expect(entry).toMatchObject({
      published: false,
      image_url: '',
      video_url: '',
      model_3d_url: '',
      price_inr: null,
      certified_range_km: 0,
    })
    expect(catalogSchema.safeParse(entry).success).toBe(true)
  })
  it('does not publish unfinished highlights', () => {
    expect(
      catalogSchema.safeParse({
        ...entry,
        published: true,
        tagline: 'Everyday travel',
        description: 'A model description.',
      }).success,
    ).toBe(false)
  })
  it('duplicates independent drafts without publishing them', () => {
    const copy = duplicateModel({ ...entry, published: true })
    copy.highlights[0]!.label = 'Changed'
    expect(copy.slug).toBe('amptron-next-copy')
    expect(copy.published).toBe(false)
    expect(entry.highlights[0]!.label).toBe('Range')
  })
  it('rejects scripts, network-path URLs, and image files in the 3D slot', () => {
    for (const value of [
      'javascript:alert(1)',
      '//untrusted.test/file.glb',
      '/photo.png',
    ]) {
      expect(
        catalogSchema.safeParse({ ...entry, model_3d_url: value }).success,
      ).toBe(false)
    }
    expect(
      catalogSchema.safeParse({ ...entry, model_3d_url: '/media/next.glb' })
        .success,
    ).toBe(true)
  })
})
