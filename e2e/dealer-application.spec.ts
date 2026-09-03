import { expect, test, type Page } from '@playwright/test'
import { E2E_ADMIN_KEY } from '../playwright.config'

const application = {
  fullName: 'Priya Raman',
  phone: '+91 98765 43210',
  city: 'Pune, Maharashtra',
  profile:
    'We run two multi-brand two-wheeler showrooms in Pune with a combined 14 years of retail experience.',
}

/** Unique per test so the API's duplicate-email rule never trips the run. */
function uniqueEmail(): string {
  return `dealer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

async function fillApplication(page: Page, email: string) {
  await page.getByLabel('Full Name').fill(application.fullName)
  await page.getByLabel('Business Email').fill(email)
  await page.getByLabel('Mobile / WhatsApp').fill(application.phone)
  await page.getByLabel('City & State').fill(application.city)
  await page
    .getByLabel('Brief Showroom Experience & Profile')
    .fill(application.profile)
}

test.describe('dealer application', () => {
  test('landing page loads with its hero and fleet', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { level: 1, name: /powering india's/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Choose your Amptron' }),
    ).toBeVisible()
    await expect(
      page.getByLabel('Amptron electric scooter product showcase'),
    ).toBeVisible()
    await expect(
      page.getByRole('img', { name: /electric scooter/i }).first(),
    ).toBeVisible()
  })

  test('a dealer can submit an application end to end', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Stock Amptron' }).first().click()

    await fillApplication(page, uniqueEmail())

    const [response] = await Promise.all([
      page.waitForResponse(
        (candidate) =>
          candidate.url().includes('/api/applications') &&
          candidate.request().method() === 'POST',
      ),
      page.getByRole('button', { name: /submit b2b application/i }).click(),
    ])

    expect(response.status()).toBe(201)
    await expect(page.getByRole('status')).toContainText(/2 business days/i)
    await expect(
      page.getByRole('button', { name: /submit another application/i }),
    ).toBeVisible()
  })

  test('invalid input is rejected in the browser before any request', async ({
    page,
  }) => {
    await page.goto('/#contact')

    let requests = 0
    page.on('request', (request) => {
      if (request.url().includes('/api/applications')) requests += 1
    })

    await page.getByLabel('Full Name').fill('A')
    await page.getByLabel('Business Email').fill('not-an-email')
    await page.getByRole('button', { name: /submit b2b application/i }).click()

    await expect(page.getByText(/please enter your full name/i)).toBeVisible()
    await expect(page.getByText(/valid email/i)).toBeVisible()
    expect(requests).toBe(0)
  })

  test('the same email cannot apply twice', async ({ page }) => {
    const email = uniqueEmail()

    await page.goto('/#contact')
    await fillApplication(page, email)
    await page.getByRole('button', { name: /submit b2b application/i }).click()
    await expect(page.getByRole('status')).toBeVisible()

    await page.getByRole('button', { name: /submit another application/i }).click()
    await fillApplication(page, email)
    await page.getByRole('button', { name: /submit b2b application/i }).click()

    await expect(page.getByText(/already been submitted/i)).toBeVisible()
  })

  test('a failing API surfaces a retryable error', async ({ page }) => {
    await page.route('**/api/applications', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'internal_error',
          message: 'Something went wrong on our side. Please retry.',
        }),
      }),
    )

    await page.goto('/#contact')
    await fillApplication(page, uniqueEmail())
    await page.getByRole('button', { name: /submit b2b application/i }).click()

    await expect(page.getByRole('alert')).toContainText(/something went wrong/i)
    await expect(
      page.getByRole('button', { name: /submit b2b application/i }),
    ).toBeEnabled()
  })

  test('the API keeps applications private without the admin key', async ({
    request,
  }) => {
    const noKey = await request.get('/api/applications')
    expect(noKey.status()).toBe(401)

    const wrongKey = await request.get('/api/applications', {
      headers: { 'x-admin-key': 'not-the-admin-key-not-the-admin-key' },
    })
    expect(wrongKey.status()).toBe(401)
  })

  test('the admin key can read submitted applications', async ({ request }) => {
    const email = uniqueEmail()

    await request.post('/api/applications', {
      data: { ...application, email },
    })

    const response = await request.get('/api/applications', {
      headers: { 'x-admin-key': E2E_ADMIN_KEY },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(
      body.applications.some((row: { email: string }) => row.email === email),
    ).toBe(true)
  })

  test('health endpoints report the service state', async ({ request }) => {
    const live = await request.get('/api/health')
    expect(live.ok()).toBe(true)
    expect((await live.json()).status).toBe('ok')

    const ready = await request.get('/api/health/ready')
    expect(ready.ok()).toBe(true)
  })
})
