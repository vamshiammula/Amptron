import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import PortalPage from './PortalPage'
const api = vi.hoisted(() => ({
  fetchPortalProfile: vi.fn(),
  fetchPortalOrders: vi.fn(),
  fetchPortalResources: vi.fn(),
  fetchPortalAnnouncements: vi.fn(),
  fetchPortalTickets: vi.fn(),
  createSupportTicket: vi.fn(),
}))
vi.mock('../lib/portalApi', () => api)
vi.mock('../lib/auth', () => {
  const value = { session: { user: { id: 'dealer' } }, ready: true }
  return { useAuth: () => value }
})
vi.mock('../lib/siteContent', () => ({ useSiteContent: () => ({ models: [] }) }))
beforeEach(() => {
  vi.clearAllMocks()
  api.fetchPortalProfile.mockResolvedValue({
    role: 'dealer',
    accountName: 'Test showroom',
    territory: 'Pune',
  })
  api.fetchPortalOrders.mockResolvedValue({
    orders: [
      {
        id: 'order-1',
        model: 'Amptron NIRA',
        quantity: 3,
        status: 'in_dispatch',
        createdAt: '2026-09-01',
      },
    ],
  })
  api.fetchPortalResources.mockResolvedValue({ resources: [] })
  api.fetchPortalAnnouncements.mockResolvedValue({ announcements: [] })
  api.fetchPortalTickets.mockResolvedValue({ tickets: [] })
})
function show(path = '/portal') {
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <PortalPage />
      </MemoryRouter>
    </HelmetProvider>,
  )
}
it('keeps working orders visible when another section fails and supports status search', async () => {
  api.fetchPortalResources.mockRejectedValue(new Error('offline'))
  show('/portal?tab=orders')
  expect(await screen.findByText('Amptron NIRA')).toBeVisible()
  expect(api.fetchPortalResources).not.toHaveBeenCalled()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  await userEvent.type(screen.getByLabelText('Search orders'), 'in dispatch')
  expect(screen.getByText('Amptron NIRA')).toBeVisible()
})
it('does not report a submitted ticket as failed if the subsequent refresh fails', async () => {
  show('/portal?tab=tickets')
  await screen.findByRole('button', { name: 'New ticket' })
  api.createSupportTicket.mockResolvedValue({
    id: 'ticket-1',
    message: 'Ticket submitted.',
  })
  api.fetchPortalTickets.mockRejectedValue(new Error('refresh failed'))
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'New ticket' }))
  await user.type(screen.getByLabelText('Subject'), 'Dispatch help')
  await user.type(
    screen.getByLabelText('Details'),
    'Please confirm the delivery status.',
  )
  await user.click(screen.getByRole('button', { name: 'Submit ticket' }))
  expect(await screen.findByText(/Reference: ticket-1/)).toBeVisible()
  expect(
    screen.queryByRole('button', { name: 'Submit ticket' }),
  ).not.toBeInTheDocument()
  expect(api.createSupportTicket).toHaveBeenCalledTimes(1)
})
it('keeps ticket drafts across sections and supports keyboard tabs', async () => {
  show('/portal?tab=tickets')
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'New ticket' }))
  await user.type(screen.getByLabelText('Subject'), 'Keep this draft')
  await user.click(screen.getByRole('tab', { name: 'Orders' }))
  await user.click(screen.getByRole('tab', { name: 'Support tickets' }))
  expect(screen.getByLabelText('Subject')).toHaveValue('Keep this draft')
  await user.keyboard('{Home}')
  expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})
