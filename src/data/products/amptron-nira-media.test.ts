import { describe, expect, it } from 'vitest'
import { scooterModels } from '../models'
import { NIRA_MEDIA_BASE, niraMedia } from './amptron-nira-media'

describe('Amptron NIRA catalog media', () => {
  const nira = scooterModels.find((model) => model.slug === 'amptron-nira')

  it('is the featured local model with hosted GLB and named stills', () => {
    expect(nira).toBeDefined()
    expect(nira?.featured).toBe(true)
    expect(nira?.model3d).toBe(niraMedia.model3d)
    expect(nira?.image).toBe(niraMedia.hero)
    expect(niraMedia.model3d).toBe(`${NIRA_MEDIA_BASE}/amptron-nira.glb`)
    expect(niraMedia.hero).toMatch(
      /amptron-nira-pearl-ivory-front-left-image-[a-f0-9]+\.webp$/,
    )
    expect(NIRA_MEDIA_BASE).toMatch(
      /\/storage\/v1\/object\/public\/site-media\/products\/amptron-nira$/,
    )
  })

  it('keeps reserved lifestyle filenames for later photography', () => {
    expect(niraMedia.chapters).toEqual({
      neighbourhood: `${NIRA_MEDIA_BASE}/amptron-nira-neighbourhood.jpg`,
      frontLeftRiding: `${NIRA_MEDIA_BASE}/amptron-nira-front-left-riding.jpg`,
      batteryCutaway: `${NIRA_MEDIA_BASE}/amptron-nira-underfloor-battery-cutaway.jpg`,
      seatOpenHelmets: `${NIRA_MEDIA_BASE}/amptron-nira-seat-open-helmets.jpg`,
      batteryAndCharger: `${NIRA_MEDIA_BASE}/amptron-nira-battery-and-charger.jpg`,
      serviceExploded: `${NIRA_MEDIA_BASE}/amptron-nira-service-exploded.jpg`,
    })
  })
})
