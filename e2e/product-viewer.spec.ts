import { expect, test } from '@playwright/test'

const VIEWPORTS = [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 430, height: 932 },
] as const

test.describe('Storm product explorer', () => {
  for (const viewport of VIEWPORTS) {
    test(`loads the four-angle viewer at ${viewport.width}x${viewport.height}`, async ({
      page,
    }, testInfo) => {
      if (testInfo.project.name !== 'chromium' && viewport.width !== 390) {
        test.skip()
      }

      await page.setViewportSize(viewport)
      await page.goto('/models/amptron-storm')

      const viewer = page.getByLabel('Amptron Storm product viewer')
      await expect(viewer).toBeVisible()
      // Colour is picked once, in the hero, and drives the viewer.
      const picker = page.getByRole('group', { name: 'Colour' })
      await expect(
        picker.getByRole('button', { name: 'Midnight Navy' }),
      ).toHaveAttribute('aria-pressed', 'true')
      await picker.getByRole('button', { name: 'Crimson Red' }).click()
      await expect(page.getByText('Crimson Red', { exact: true })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Exterior' })).toBeVisible()
      await expect(page.getByRole('tab', { name: '360°' })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Fullscreen' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Reset view' })).toBeVisible()

      const box = await viewer.boundingBox()
      expect(box?.height).toBeGreaterThan(200)
    })
  }

  test('swipes horizontally without stealing vertical page scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/models/amptron-storm')

    const viewer = page.getByLabel('Amptron Storm product viewer')
    await expect(viewer).toBeVisible()
    const start = await viewer.boundingBox()
    expect(start).toBeTruthy()

    await page.mouse.move(start!.x + start!.width / 2, start!.y + start!.height / 2)
    await page.mouse.down()
    await page.mouse.move(start!.x + 40, start!.y + start!.height / 2, { steps: 8 })
    await page.mouse.up()

    await page.evaluate(() => window.scrollTo(0, 0))
    const before = await page.evaluate(() => window.scrollY)
    await page.mouse.move(start!.x + start!.width / 2, start!.y + 40)
    await page.mouse.down()
    await page.mouse.move(start!.x + start!.width / 2, start!.y - 180, {
      steps: 10,
    })
    await page.mouse.up()
    const after = await page.evaluate(() => window.scrollY)
    expect(after).toBeGreaterThanOrEqual(before)
  })

  test('opens fullscreen and returns focus to the control', async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/models/amptron-storm')

    const fullscreen = page.locator('.product-viewer-fullscreen-btn')
    await fullscreen.click()
    await expect(fullscreen).toHaveText(/exit fullscreen/i)
    await fullscreen.click()
    await expect(fullscreen).toHaveText(/^fullscreen$/i)
    if (testInfo.project.name === 'chromium') {
      await expect(fullscreen).toBeFocused()
    }
  })

  test('keeps Volt on the static catalog image', async ({ page }) => {
    await page.goto('/models/amptron-volt')
    await expect(page.getByLabel('Amptron Volt product viewer')).toHaveCount(0)
    await expect(
      page.getByRole('heading', { name: 'Amptron Volt', exact: true }),
    ).toBeVisible()
  })

  test('keeps feature details below the image on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/models/amptron-storm')

    await page.getByRole('tab', { name: 'Features' }).click()
    await page.getByRole('button', { name: 'Battery' }).click()

    const stage = page.locator('.product-viewer-stage')
    const panel = page.locator('.product-viewer-panel')
    await expect(panel).toBeVisible()

    const stageBox = await stage.boundingBox()
    const panelBox = await panel.boundingBox()
    expect(stageBox).toBeTruthy()
    expect(panelBox).toBeTruthy()
    expect(panelBox!.y).toBeGreaterThanOrEqual(stageBox!.y + stageBox!.height - 2)
  })
})
