import { expect, test } from '@playwright/test'

test('keeps the sticky Buy Amptron control off the hero', async ({
  page,
}, testInfo) => {
  await page.setViewportSize(
    testInfo.project.name === 'mobile-safari'
      ? { width: 390, height: 844 }
      : { width: 1280, height: 800 },
  )
  await page.goto('/models/amptron-volt')

  const subnav = page.getByRole('navigation', { name: 'On this page' })
  const stickyBuy = subnav.getByRole('link', { name: 'Buy Amptron' })

  await expect(stickyBuy).toHaveCount(0)
  await expect(
    page.locator('#overview').getByRole('link', { name: 'Buy Amptron' }),
  ).toBeVisible()

  await page.locator('#features').scrollIntoViewIfNeeded()

  if (testInfo.project.name === 'mobile-safari') {
    await expect(page.locator('.model-subnav-buy')).toBeHidden()
    return
  }

  await expect(stickyBuy).toBeVisible()

  await page.locator('#overview h1').scrollIntoViewIfNeeded()
  await expect(stickyBuy).toHaveCount(0)
})
