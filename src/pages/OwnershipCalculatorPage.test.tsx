import { render, screen } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import OwnershipCalculatorPage from './OwnershipCalculatorPage'

function renderPage(path: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/ownership-calculator"
            element={<OwnershipCalculatorPage />}
          />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  )
}

describe('Ownership calculator page', () => {
  it('preselects the model from the URL', () => {
    renderPage('/ownership-calculator?model=amptron-cruise')

    expect(
      screen.getByRole('heading', { name: 'Plan the cost of switching' }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Model: Amptron Cruise' }),
    ).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Running cost' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
})
