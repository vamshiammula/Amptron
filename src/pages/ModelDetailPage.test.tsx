import { act, render, screen, within } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ModelDetailPage from './ModelDetailPage'

function renderVolt() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/models/amptron-volt']}>
        <Routes>
          <Route path="/models/:slug" element={<ModelDetailPage />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  )
}

function subnav() {
  return screen.getByRole('navigation', { name: 'On this page' })
}

describe('Model detail subnav', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps the sticky Buy Amptron control off the hero', () => {
    renderVolt()

    expect(within(subnav()).queryByRole('link', { name: 'Buy Amptron' })).toBeNull()
    expect(
      within(document.getElementById('overview')!).getByRole('link', {
        name: 'Buy Amptron',
      }),
    ).toBeVisible()
  })

  it('shows the sticky Buy Amptron control after the hero leaves view', () => {
    type Callback = (entries: Array<{ isIntersecting: boolean }>) => void
    const observers: Array<{ cb: Callback; node: Element | null }> = []

    class MockObserver {
      cb: Callback
      node: Element | null = null
      constructor(cb: Callback) {
        this.cb = cb
      }
      observe(node: Element) {
        this.node = node
        observers.push(this)
      }
      disconnect() {}
      unobserve() {}
    }

    vi.stubGlobal('IntersectionObserver', MockObserver)
    renderVolt()

    const heroObserver = observers.find((item) => item.node?.id === 'overview')
    expect(heroObserver).toBeDefined()

    act(() => {
      heroObserver?.cb([{ isIntersecting: false }])
    })

    expect(
      within(subnav()).getByRole('link', { name: 'Buy Amptron' }),
    ).toBeVisible()
  })
})
