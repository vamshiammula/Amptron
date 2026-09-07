import { expect, test } from '@playwright/test'

test('homepage film fits desktop and mobile and keeps the product studio in Explore', async ({
  page,
}) => {
  const heavyRequests: string[] = []
  page.on('request', (request) => {
    if (
      /\.glb(?:\?|$)|model-viewer.*\.js|\/products\/amptron-storm\//.test(
        request.url(),
      )
    )
      heavyRequests.push(request.url())
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('.hero .hero-film')).toBeVisible()
  await expect(page.locator('.hero .scooter-stage')).toHaveCount(0)
  await expect(
    page.locator('.hero-film').getByRole('link', { name: /Explore NIRA/ }),
  ).toHaveAttribute('href', '/models/amptron-nira')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  expect(heavyRequests).toEqual([])
})
