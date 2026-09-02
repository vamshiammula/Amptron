import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ChatWidget from './ChatWidget'

describe('ChatWidget', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (url.endsWith('/api/faq/suggestions')) {
          return new Response(JSON.stringify({ suggestions: [] }), { status: 200 })
        }
        if (url.endsWith('/api/faq/match')) {
          const body = JSON.parse(String(init?.body ?? '{}')) as { query?: string }
          if ((body.query ?? '').toLowerCase().includes('hi')) {
            return new Response(
              JSON.stringify({
                matched: true,
                source: 'smalltalk',
                answer:
                  'Hello. Ask about Amptron Volt, Storm, or Cruise — range, charging, test rides, or stocking. Answers come from Amptron’s published FAQs.',
              }),
              { status: 200 },
            )
          }
          return new Response(
            JSON.stringify({ matched: false, reason: 'unmatched' }),
            { status: 200 },
          )
        }
        return new Response('not found', { status: 404 })
      }),
    )
  })

  it('opens, sends a greeting, and shows the canned reply', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ChatWidget />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Ask Amptron' }))
    await user.type(screen.getByLabelText('Your question'), 'Hi')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(
      await screen.findByRole('heading', { name: 'Amptron agent' }),
    ).toBeVisible()
    expect(await screen.findByText(/Hello\. Ask about Amptron Volt/i)).toBeVisible()
  })

  it('opens a contact form when no FAQ matches', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ChatWidget />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Ask Amptron' }))
    await user.type(
      screen.getByLabelText('Your question'),
      'What is the battery chemistry of a competitor scooter?',
    )
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(
      await screen.findByText(/Name, plus a mobile number or email/i),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Send to Amptron' })).toBeVisible()
  })

  it('stays hidden on admin routes', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <ChatWidget />
      </MemoryRouter>,
    )

    expect(
      screen.queryByRole('button', { name: 'Ask Amptron' }),
    ).not.toBeInTheDocument()
  })

  it('can collapse the Ask Amptron label', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ChatWidget />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('Ask Amptron', { selector: '.chatbot-nudge-label' }),
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Collapse Ask Amptron' }))
    expect(
      screen.queryByRole('button', { name: 'Collapse Ask Amptron' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ask Amptron' })).toBeVisible()
  })

  it('counts characters on this question, not the session', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ChatWidget />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Ask Amptron' }))
    expect(screen.queryByText(/characters left/i)).not.toBeInTheDocument()

    const input = screen.getByLabelText('Your question')
    await user.click(input)
    await user.paste('x'.repeat(241))

    expect(screen.getByText('39 characters left')).toBeVisible()

    await user.clear(input)
    await user.type(input, 'Hi')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(await screen.findByText(/Hello\. Ask about Amptron Volt/i)).toBeVisible()
    expect(screen.queryByText(/characters left/i)).not.toBeInTheDocument()
  })
})
