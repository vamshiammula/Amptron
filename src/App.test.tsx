import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { SiteContentProvider } from './lib/siteContent'

describe('App', () => {
  it('renders the landing page sections in order', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <SiteContentProvider>
          <App />
        </SiteContentProvider>
      </MemoryRouter>,
    )

    const headings = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent)

    expect(headings).toEqual([
      'Our Electric Scooter Range',
      'Built to Ride. Backed to Sell.',
      'Engineering Excellence',
      'Partner With Amptron',
      'What Our Dealers Say',
      'Buy Amptron',
      'Stock Amptron',
    ])
  })

  it('exposes a skip link to the main landmark', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <SiteContentProvider>
          <App />
        </SiteContentProvider>
      </MemoryRouter>,
    )

    const skipLink = screen.getByRole('link', { name: /skip to main content/i })
    expect(skipLink).toHaveAttribute('href', '#main')
    expect(document.querySelector('main')).toHaveAttribute('id', 'main')
  })

  it('gives every image alternative text or an explicit empty alt', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <SiteContentProvider>
          <App />
        </SiteContentProvider>
      </MemoryRouter>,
    )

    for (const image of document.querySelectorAll('img')) {
      expect(image).toHaveAttribute('alt')
    }
  })
})

function Boom(): never {
  throw new Error('render exploded')
}

describe('ErrorBoundary', () => {
  it('renders children when nothing fails', () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('All good')).toBeVisible()
  })

  it('shows a recovery message when a child throws', () => {
    // React logs the caught error; silence it so the run stays readable.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i)
    expect(screen.getByRole('button', { name: /reload page/i })).toBeVisible()

    consoleError.mockRestore()
  })
})
