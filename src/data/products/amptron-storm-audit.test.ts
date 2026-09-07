import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { stormViewerConfig } from './amptron-storm'

interface AuditAsset {
  canonicalPath: string
  byteSize: number
  checksum: string
  approval: 'approved' | 'hold'
}

interface AuditManifest {
  note: string
  assets: AuditAsset[]
}

const audit = JSON.parse(
  readFileSync(
    join(process.cwd(), 'src/data/products/amptron-storm-audit.json'),
    'utf8',
  ),
) as AuditManifest

describe('Archived Amptron Storm media audit', () => {
  it('records every source file with a checksum and approval flag', () => {
    expect(audit.assets).toHaveLength(30)
    expect(audit.note).toMatch(/not a 360/i)

    const approved = audit.assets.filter((asset) => asset.approval === 'approved')
    const held = audit.assets.filter((asset) => asset.approval === 'hold')
    expect(approved.length).toBeGreaterThanOrEqual(18)
    expect(held.length).toBeGreaterThanOrEqual(8)

    for (const asset of audit.assets) {
      // This is historical metadata; retired source binaries are not required to build the app.
      expect(asset.canonicalPath).toMatch(/^products\/amptron-storm\//)
      expect(asset.byteSize).toBeGreaterThan(0)
      expect(asset.checksum).toMatch(/^[a-f0-9]{64}$/)
    }
  })

  it('does not publish held or 360 modes on the local Storm viewer', () => {
    const visible = stormViewerConfig.experiences.filter(
      (experience) => experience.enabled && experience.assets.length > 0,
    )
    expect(visible.map((experience) => experience.id)).toEqual([
      'exterior',
      'seat',
      'storage',
      'battery',
      'charging',
    ])
    expect(
      stormViewerConfig.experiences.find((item) => item.id === '360')?.enabled,
    ).toBe(false)
  })
})
