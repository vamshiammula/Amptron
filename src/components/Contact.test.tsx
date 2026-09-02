import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Contact from './Contact'

const validEntries = {
  'Full Name': 'Priya Raman',
  'Business Email': 'priya@raman-motors.co.in',
  'Mobile / WhatsApp': '+91 98765 43210',
  'City & State': 'Pune, Maharashtra',
  'Brief Showroom Experience & Profile':
    'We run two multi-brand two-wheeler showrooms in Pune with 14 years of retail experience.',
}

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  for (const [label, value] of Object.entries(validEntries)) {
    await user.type(screen.getByLabelText(label), value)
  }
}

function mockFetch(implementation: () => Promise<Response>) {
  const fetchMock = vi.fn<typeof fetch>(() => implementation())
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('Contact form', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('submits a rider buy request with a direct-purchase prefix', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch(async () =>
      jsonResponse(201, { message: 'Application received.' }),
    )
    render(<Contact />)

    await user.type(screen.getByLabelText('Your Name'), 'Priya Raman')
    await user.type(screen.getByLabelText('Email'), 'priya@example.com')
    await user.type(screen.getByLabelText('Mobile Number'), '+91 98765 43210')
    await user.type(
      screen.getByLabelText('City', { exact: true }),
      'Pune, Maharashtra',
    )
    await user.type(
      screen.getByLabelText('What would you like to buy or book?'),
      'I want to buy Amptron Storm and book a test ride this weekend.',
    )
    await user.click(screen.getByRole('button', { name: /request to buy/i }))

    expect(await screen.findByText(/application received/i)).toBeVisible()
    const [, init] = fetchMock.mock.calls[0]!
    expect(JSON.parse(String(init?.body)).profile).toMatch(
      /^Direct purchase or test-ride\. /,
    )
  })

  it('renders every application field', () => {
    render(<Contact />)

    for (const label of Object.keys(validEntries)) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
    expect(
      screen.getByRole('button', { name: /submit b2b application/i }),
    ).toBeEnabled()
    expect(screen.getByRole('heading', { name: 'Buy Amptron' })).toBeVisible()
    expect(screen.getByRole('button', { name: /request to buy/i })).toBeEnabled()
  })

  it('shows validation messages without calling the API', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch(async () => jsonResponse(201, {}))
    render(<Contact />)

    await user.click(
      screen.getByRole('button', { name: /submit b2b application/i }),
    )

    expect(await screen.findByText(/please enter your full name/i)).toBeVisible()
    expect(screen.getByText(/valid email/i)).toBeVisible()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('marks invalid fields for assistive technology and focuses the first one', async () => {
    const user = userEvent.setup()
    mockFetch(async () => jsonResponse(201, {}))
    render(<Contact />)

    await user.click(
      screen.getByRole('button', { name: /submit b2b application/i }),
    )

    const nameInput = screen.getByLabelText('Full Name')
    await waitFor(() => expect(nameInput).toHaveAttribute('aria-invalid', 'true'))
    expect(nameInput).toHaveAttribute('aria-describedby', 'fullName-error')
    expect(nameInput).toHaveFocus()
  })

  it('clears a field message as soon as the visitor edits it', async () => {
    const user = userEvent.setup()
    mockFetch(async () => jsonResponse(201, {}))
    render(<Contact />)

    await user.click(
      screen.getByRole('button', { name: /submit b2b application/i }),
    )
    expect(await screen.findByText(/please enter your full name/i)).toBeVisible()

    await user.type(screen.getByLabelText('Full Name'), 'Priya')

    await waitFor(() =>
      expect(
        screen.queryByText(/please enter your full name/i),
      ).not.toBeInTheDocument(),
    )
  })

  it('submits normalised data and confirms success', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch(async () =>
      jsonResponse(201, {
        id: 'a5f1e2c3-0000-4000-8000-000000000001',
        receivedAt: '2026-08-31T12:00:00.000Z',
        message:
          'Application received. We will contact you within 2 business days.',
      }),
    )
    render(<Contact />)

    await fillValidForm(user)
    await user.click(
      screen.getByRole('button', { name: /submit b2b application/i }),
    )

    expect(await screen.findByText(/application received\./i)).toBeVisible()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('/api/applications')
    expect(JSON.parse(String(init?.body))).toEqual({
      fullName: 'Priya Raman',
      email: 'priya@raman-motors.co.in',
      phone: '+91 98765 43210',
      city: 'Pune, Maharashtra',
      profile: validEntries['Brief Showroom Experience & Profile'],
    })
  })

  it('lets the visitor start a second application after success', async () => {
    const user = userEvent.setup()
    mockFetch(async () => jsonResponse(201, { message: 'Application received.' }))
    render(<Contact />)

    await fillValidForm(user)
    await user.click(
      screen.getByRole('button', { name: /submit b2b application/i }),
    )
    await screen.findByText(/application received\./i)

    await user.click(
      screen.getByRole('button', { name: /submit another application/i }),
    )

    expect(screen.getByLabelText('Full Name')).toHaveValue('')
  })

  it('disables the button while the request is in flight', async () => {
    const user = userEvent.setup()
    let release!: (value: Response) => void
    const pending = new Promise<Response>((resolve) => {
      release = resolve
    })
    mockFetch(() => pending)
    render(<Contact />)

    await fillValidForm(user)
    const submit = screen.getByRole('button', { name: /submit b2b application/i })
    await user.click(submit)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled(),
    )
    expect(screen.getByText(/sending your application/i)).toBeVisible()

    release(jsonResponse(201, { message: 'Application received.' }))
    await screen.findByText(/application received\./i)
  })

  it('shows the field message returned for a duplicate email', async () => {
    const user = userEvent.setup()
    mockFetch(async () =>
      jsonResponse(409, {
        error: 'duplicate_application',
        message: 'We already have an application for this email address.',
        fieldErrors: { email: 'This email has already been submitted.' },
      }),
    )
    render(<Contact />)

    await fillValidForm(user)
    await user.click(
      screen.getByRole('button', { name: /submit b2b application/i }),
    )

    expect(
      await screen.findByText(/this email has already been submitted/i),
    ).toBeVisible()
    expect(screen.getByLabelText('Business Email')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('surfaces a server error as an alert and keeps the form editable', async () => {
    const user = userEvent.setup()
    mockFetch(async () =>
      jsonResponse(500, {
        error: 'internal_error',
        message: 'Something went wrong on our side.',
      }),
    )
    render(<Contact />)

    await fillValidForm(user)
    await user.click(
      screen.getByRole('button', { name: /submit b2b application/i }),
    )

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/something went wrong on our side/i)
    expect(screen.getByLabelText('Full Name')).toHaveValue('Priya Raman')
  })

  it('reports a friendly message when the network fails', async () => {
    const user = userEvent.setup()
    mockFetch(() => Promise.reject(new TypeError('Failed to fetch')))
    render(<Contact />)

    await fillValidForm(user)
    await user.click(
      screen.getByRole('button', { name: /submit b2b application/i }),
    )

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/check your connection/i)
  })

  it('opens headquarters in Maps from the address and the map', () => {
    render(<Contact />)

    const mapLink = screen.getByRole('link', {
      name: 'Open Amptron headquarters in Maps',
    })
    expect(mapLink).toHaveAttribute('target', '_blank')
    expect(mapLink.getAttribute('href')).toMatch(
      /google\.com\/maps|maps\.apple\.com/,
    )

    const addressLink = screen.getByRole('link', {
      name: /plot 42, sector 8, imt manesar/i,
    })
    expect(addressLink).toHaveAttribute('href', mapLink.getAttribute('href'))
  })

  it('counts characters entered in the profile field', async () => {
    const user = userEvent.setup()
    render(<Contact />)

    await user.type(
      screen.getByLabelText('Brief Showroom Experience & Profile'),
      'Hello',
    )

    expect(screen.getByText('5/2000')).toBeVisible()
  })
})
