import { describe, expect, it } from 'vitest'
import { resolveViewerRenderer } from './resolveViewerRenderer'
import ExteriorAngleViewer from './ExteriorAngleViewer'

describe('resolveViewerRenderer', () => {
  it('keeps the still-frame explorer until a verified 360 sequence exists', () => {
    expect(resolveViewerRenderer('angles')).toBe(ExteriorAngleViewer)
    expect(resolveViewerRenderer('sequence')).toBe(ExteriorAngleViewer)
    expect(resolveViewerRenderer('threejs')).toBe(ExteriorAngleViewer)
  })
})
