import { expect, test } from '@playwright/test'

test('rider support opens the assistant', async ({ page }) => {
  await page.goto('/support')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Keep moving')
  await page.getByRole('button', { name: 'Ask about parts' }).click()
  await expect(page.locator('.chatbot-panel')).toBeVisible()
})

test('enquiry navigation preserves the request and is keyboard accessible', async ({
  page,
}) => {
  await page.goto('/#buy')
  await page.getByLabel('Your Name', { exact: true }).fill('A rider draft')
  const buy = page.getByRole('tab', { name: 'Buy Amptron' })
  await buy.focus()
  await page.keyboard.press('End')
  await expect(page.getByRole('tab', { name: 'Stock Amptron' })).toBeFocused()
  await page.getByLabel('Full Name', { exact: true }).fill('A dealer draft')
  await page.getByRole('tab', { name: 'Stock Amptron' }).focus()
  await page.keyboard.press('Home')
  await expect(page.getByLabel('Your Name', { exact: true })).toHaveValue(
    'A rider draft',
  )
})

test('public pages keep one main landmark and fit the viewport', async ({
  page,
}) => {
  for (const route of [
    '/',
    '/models',
    '/support',
    '/about',
    '/book-test-ride',
    '/dealers/locate',
    '/ownership-calculator',
    '/blog',
    '/portal/login',
    '/warranty',
    '/privacy',
    '/terms',
  ]) {
    await page.goto(route)
    await expect(page.locator('main')).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
  }
})
