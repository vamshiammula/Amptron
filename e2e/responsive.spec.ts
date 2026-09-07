import { expect, test } from '@playwright/test'

test('studio hero fits desktop and mobile without loading retired media', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('.hero .scooter-stage')).toBeVisible()
  await expect(page.locator('.hero img, .hero video')).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
