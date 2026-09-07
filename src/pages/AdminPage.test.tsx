import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import AdminPage from './AdminPage'
const api = vi.hoisted(() => ({
  createAdminAnnouncement: vi.fn(),
  createAdminResource: vi.fn(),
  createDealerRecord: vi.fn(),
  updateDealerRecord: vi.fn(),
  createDealerLogin: vi.fn(),
  fetchPortalProfile: vi.fn(),
  fetchAdminAnnouncements: vi.fn(),
  fetchAdminDealerAccounts: vi.fn(),
  fetchAdminDealers: vi.fn(),
  fetchAdminApplications: vi.fn(),
  fetchAdminOrders: vi.fn(),
  fetchAdminOverview: vi.fn(),
  fetchAdminResources: vi.fn(),
  fetchAdminTickets: vi.fn(),
  updateAdminOrderStatus: vi.fn(),
  updateAdminApplicationStatus: vi.fn(),
  updateAdminTicketStatus: vi.fn(),
  fetchAdminFaqs: vi.fn(),
  fetchAdminSupportQueries: vi.fn(),
}))
vi.mock('../lib/portalApi', () => api)
vi.mock('../lib/auth', () => {
  const value = { session: { user: { id: 'admin' } }, ready: true }
  return { useAuth: () => value }
})
vi.mock('./admin/AdminCatalogPanel', () => ({
  default: () => <input aria-label="Catalog draft" />,
}))
vi.mock('./admin/AdminFaqPanel', () => ({ default: () => null }))
vi.mock('./admin/AdminSupportQueriesPanel', () => ({ default: () => null }))
beforeEach(() => {
  vi.clearAllMocks()
  api.fetchPortalProfile.mockResolvedValue({
    role: 'admin',
    accountName: 'Test admin',
  })
  api.fetchAdminOverview.mockResolvedValue({
    kpis: [],
    pipeline: [],
    recentTickets: [],
    recentOrders: [],
  })
  api.fetchAdminApplications.mockResolvedValue({ applications: [], count: 0 })
  api.fetchAdminDealerAccounts.mockResolvedValue({ accounts: [] })
  api.fetchAdminDealers.mockResolvedValue({
    dealers: [
      {
        id: 'dealer-1',
        name: 'Pune showroom',
        city: 'Pune',
        state: 'Maharashtra',
        area: 'Baner',
        phone: '+91 9000011111',
      },
    ],
  })
  api.fetchAdminOrders.mockResolvedValue({ orders: [] })
  api.fetchAdminTickets.mockResolvedValue({ tickets: [] })
  api.fetchAdminFaqs.mockResolvedValue({ faqs: [] })
  api.fetchAdminSupportQueries.mockResolvedValue({ queries: [] })
  api.fetchAdminResources.mockResolvedValue({ resources: [] })
  api.fetchAdminAnnouncements.mockResolvedValue({ announcements: [] })
})
function show(path = '/admin?tab=dealers') {
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <AdminPage />
      </MemoryRouter>
    </HelmetProvider>,
  )
}
it('does not load unrelated sections or surface their errors', async () => {
  api.fetchAdminFaqs.mockRejectedValue(new Error('offline'))
  show()
  expect(await screen.findByText('Pune showroom')).toBeVisible()
  expect(api.fetchAdminFaqs).not.toHaveBeenCalled()
  expect(api.fetchAdminOrders).not.toHaveBeenCalled()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})
it('edits an existing showroom using the update endpoint', async () => {
  api.updateDealerRecord.mockResolvedValue({ message: 'Saved' })
  show()
  const user = userEvent.setup()
  await user.click(
    await screen.findByRole('button', { name: 'Edit Pune showroom' }),
  )
  const field = screen.getByLabelText('Area')
  await user.clear(field)
  await user.type(field, 'Wakad')
  await user.click(screen.getByRole('button', { name: 'Save changes' }))
  expect(api.updateDealerRecord).toHaveBeenCalledWith(
    'dealer-1',
    expect.objectContaining({ area: 'Wakad' }),
  )
  expect(api.createDealerRecord).not.toHaveBeenCalled()
  expect(await screen.findByText('Showroom details updated.')).toBeVisible()
})
it('clears section search and preserves catalog edits across tabs', async () => {
  show()
  await screen.findByText('Pune showroom')
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Search'), 'no match')
  expect(screen.queryByText('Pune showroom')).not.toBeInTheDocument()
  await user.click(screen.getByRole('tab', { name: 'Models & templates' }))
  await user.type(screen.getByLabelText('Catalog draft'), 'New model')
  await user.click(screen.getByRole('tab', { name: /Dealers/ }))
  expect(screen.getByLabelText('Search')).toHaveValue('')
  await user.click(screen.getByRole('tab', { name: 'Models & templates' }))
  expect(screen.getByLabelText('Catalog draft')).toHaveValue('New model')
  expect(
    within(screen.getByRole('tab', { name: 'Models & templates' })).queryByText(
      '0',
    ),
  ).not.toBeInTheDocument()
})

it('shows counts only after successful loading and keeps order account names searchable', async () => {
  api.fetchAdminDealerAccounts.mockResolvedValue({
    accounts: [
      {
        id: 'account-1',
        accountName: 'Pune partner',
        role: 'dealer',
        territory: 'Pune',
      },
    ],
  })
  api.fetchAdminOrders.mockResolvedValue({
    orders: [
      {
        id: 'order-1',
        dealerAccountId: 'account-1',
        model: 'Amptron NIRA',
        quantity: 1,
        status: 'pending',
        createdAt: '2026-09-01',
      },
    ],
  })
  show('/admin?tab=orders')
  expect(await screen.findByText('Pune partner')).toBeVisible()
  expect(screen.getByRole('tab', { name: /^Orders\s*1$/ })).toBeVisible()
  expect(screen.getByRole('tab', { name: 'FAQs' })).toBeVisible()
  expect(screen.getByRole('tab', { name: 'Applications' })).toBeVisible()
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Search'), 'Pune partner')
  expect(screen.getByText('Amptron NIRA')).toBeVisible()
  await user.click(screen.getByRole('tab', { name: 'Tickets' }))
  expect(await screen.findByRole('tab', { name: /^Tickets\s*0$/ })).toBeVisible()
  expect(api.fetchAdminFaqs).not.toHaveBeenCalled()
})
