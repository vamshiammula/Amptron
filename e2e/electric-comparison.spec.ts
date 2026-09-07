import { test, expect } from '@playwright/test'
test('generic EV comparison uses entered figures and retains the scenario', async ({
  page,
}) => {
  await page.goto('/ownership-calculator')
  await page
    .getByRole('radio', { name: 'Another electric scooter', exact: true })
    .check()
  await expect(page.getByText('Add your comparison figures')).toBeVisible()
  const other = page.getByRole('group', {
    name: 'Other electric scooter',
    exact: true,
  })
  await other.getByLabel('Purchase price (₹)', { exact: true }).fill('90000')
  await other.getByLabel('Battery capacity (kWh)', { exact: true }).fill('3')
  await other.getByLabel('Range per full charge (km)', { exact: true }).fill('100')
  await expect(page.getByRole('table')).toBeVisible()
  await expect(
    page.getByText('₹16,071 more with Amptron', { exact: true }),
  ).toBeVisible()
  await page.getByRole('radio', { name: 'A petrol scooter', exact: true }).check()
  await page
    .getByRole('radio', { name: 'Another electric scooter', exact: true })
    .check()
  await expect(other.getByLabel('Purchase price (₹)', { exact: true })).toHaveValue(
    '90000',
  )
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})
