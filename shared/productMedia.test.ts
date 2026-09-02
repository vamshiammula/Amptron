import { describe, expect, it } from 'vitest'
import {
  canonicalObjectPath,
  indexesAreContiguous,
  matchingSequenceDimensions,
  sanitizeStateKey,
  validateUploadMeta,
} from './productMedia.js'

describe('product media naming', () => {
  it('names exterior, state, and 360 objects consistently', () => {
    expect(
      canonicalObjectPath({
        modelSlug: 'amptron-storm',
        mode: 'exterior',
        setId: 12,
        stateKey: 'Front Left',
        sequenceIndex: 0,
        mimeType: 'image/jpeg',
      }),
    ).toBe('products/amptron-storm/exterior/12/angle-front-left.jpg')

    expect(
      canonicalObjectPath({
        modelSlug: 'amptron-storm',
        mode: 'seat',
        setId: 12,
        stateKey: 'open',
        sequenceIndex: 1,
        mimeType: 'image/jpeg',
      }),
    ).toBe('products/amptron-storm/seat/12/open.jpg')

    expect(
      canonicalObjectPath({
        modelSlug: 'amptron-storm',
        mode: '360',
        setId: 9,
        stateKey: 'frame',
        sequenceIndex: 3,
        mimeType: 'image/jpeg',
      }),
    ).toBe('products/amptron-storm/360/9/frame-003.jpg')
  })

  it('sanitizes state keys', () => {
    expect(sanitizeStateKey(' Front Left ')).toBe('front-left')
  })

  it('requires contiguous sequences and matching dimensions', () => {
    expect(indexesAreContiguous([0, 1, 2])).toBe(true)
    expect(indexesAreContiguous([1, 2, 3])).toBe(true)
    expect(indexesAreContiguous([0, 2])).toBe(false)
    expect(
      matchingSequenceDimensions([
        { width: 1024, height: 1024 },
        { width: 1024, height: 1024 },
      ]),
    ).toBe(true)
    expect(
      matchingSequenceDimensions([
        { width: 1024, height: 1024 },
        { width: 800, height: 1024 },
      ]),
    ).toBe(false)
  })

  it('rejects incomplete upload metadata', () => {
    expect(
      validateUploadMeta({
        mimeType: 'image/gif',
        byteSize: 10,
        width: 10,
        height: 10,
        alt: 'Storm front',
        checksum: 'a'.repeat(64),
      }),
    ).toMatch(/unsupported/i)
    expect(
      validateUploadMeta({
        mimeType: 'image/jpeg',
        byteSize: 10,
        width: 10,
        height: 10,
        alt: 'ok',
        checksum: 'a'.repeat(64),
      }),
    ).toMatch(/alt/i)
    expect(
      validateUploadMeta({
        mimeType: 'image/jpeg',
        byteSize: 10,
        width: 10,
        height: 10,
        alt: 'Storm front',
        checksum: 'a'.repeat(64),
      }),
    ).toBeNull()
  })
})
