import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import PortalLoginPage from './PortalLoginPage'
const mocks = vi.hoisted(() => ({
  session: null as object | null,
  updateUser: vi.fn(),
  signInWithPassword: vi.fn(),
}))
vi.mock('../lib/auth', () => ({ useAuth: () => ({ session: mocks.session }) }))
vi.mock('../lib/supabase', () => ({
  hasSupabaseClient: true,
  supabase: { auth: mocks },
}))
vi.mock('../lib/portalApi', () => ({ fetchPortalProfile: vi.fn() }))
beforeEach(() => {
  vi.clearAllMocks()
  mocks.session = null
})
function show(path = '/portal/login') {
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <PortalLoginPage />
      </MemoryRouter>
    </HelmetProvider>,
  )
}
it('recovers from a network failure without locking sign-in', async () => {
  mocks.signInWithPassword.mockRejectedValue(new Error('offline'))
  show()
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Work Email'), 'dealer@example.com')
  await user.type(screen.getByLabelText('Password', { exact: true }), 'password1')
  await user.click(screen.getByRole('button', { name: /^Sign In$/ }))
  expect(
    await screen.findByText('We could not connect. Please try again.'),
  ).toBeVisible()
  expect(screen.getByRole('button', { name: /^Sign In$/ })).toBeEnabled()
})
it('completes password recovery for an authenticated reset session', async () => {
  mocks.session = { user: { id: 'test' } }
  mocks.updateUser.mockResolvedValue({ error: null })
  show('/portal/login?recovery=1')
  const user = userEvent.setup()
  await user.type(
    screen.getByLabelText('New password', { exact: true }),
    'new-password1',
  )
  await user.type(screen.getByLabelText('Confirm password'), 'new-password1')
  await user.click(screen.getByRole('button', { name: /update password/i }))
  expect(mocks.updateUser).toHaveBeenCalledWith({ password: 'new-password1' })
  expect(await screen.findByText(/Password updated/)).toBeVisible()
})
