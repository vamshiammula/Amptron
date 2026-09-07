import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import Seo from '../components/Seo'
import WorkspaceTabs from '../components/WorkspaceTabs'
import { exportCsv } from '../lib/workspace'
import {
  createAdminAnnouncement,
  createAdminResource,
  createDealerRecord,
  updateDealerRecord,
  createDealerLogin,
  fetchPortalProfile,
  fetchAdminAnnouncements,
  fetchAdminDealerAccounts,
  fetchAdminDealers,
  fetchAdminApplications,
  fetchAdminOrders,
  fetchAdminOverview,
  fetchAdminResources,
  fetchAdminTickets,
  updateAdminOrderStatus,
  updateAdminApplicationStatus,
  updateAdminTicketStatus,
  fetchAdminFaqs,
  fetchAdminSupportQueries,
  type AdminDealerAccount,
  type AdminApplicationsPayload,
  type AdminFaq,
  type AdminOverviewPayload,
  type AdminSupportQuery,
  type DealerAnnouncement,
  type DealerOrder,
  type DealerResource,
  type DealerTicket,
  type PortalProfile,
} from '../lib/portalApi'
import { useAuth } from '../lib/auth'
import AdminFaqPanel from './admin/AdminFaqPanel'
import AdminCatalogPanel from './admin/AdminCatalogPanel'
import AdminSupportQueriesPanel from './admin/AdminSupportQueriesPanel'

const ADMIN_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'catalog', label: 'Models & templates' },
  { id: 'applications', label: 'Applications' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'dealers', label: 'Dealers' },
  { id: 'orders', label: 'Orders' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'queries', label: 'Support queries' },
  { id: 'content', label: 'Content' },
] as const

type AdminTab = (typeof ADMIN_TABS)[number]['id']

const APPLICATION_STATUSES = ['new', 'contacted', 'approved', 'rejected'] as const
const ORDER_STATUSES = [
  'pending',
  'in_dispatch',
  'shipped',
  'delivered',
  'cancelled',
] as const
const TICKET_STATUSES = ['open', 'in_progress', 'closed'] as const

const KPI_TAB: Record<string, AdminTab> = {
  Applications: 'applications',
  'Dealer Accounts': 'accounts',
  'Open Tickets': 'tickets',
  'Pending Orders': 'orders',
}

const SEARCH_PLACEHOLDERS: Record<AdminTab, string> = {
  overview: 'Search the console…',
  catalog: 'Search the catalog…',
  applications: 'Search applicants, cities, or status…',
  accounts: 'Search accounts, roles, or territory…',
  dealers: 'Search dealers, cities, or area…',
  orders: 'Search account, model or reference…',
  tickets: 'Search account, subject or reference…',
  faqs: 'Search questions, answers, or slugs…',
  queries: 'Search visitor questions, names, or reason…',
  content: 'Search titles or announcements…',
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

function isAdminTab(value: string | null): value is AdminTab {
  return ADMIN_TABS.some((tab) => tab.id === value)
}

function formatStatus(status: string) {
  return status.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function statusTone(status: string) {
  switch (status) {
    case 'approved':
    case 'delivered':
    case 'closed':
      return 'success'
    case 'rejected':
      return 'danger'
    case 'new':
    case 'open':
    case 'pending':
      return 'warning'
    case 'contacted':
    case 'in_progress':
    case 'in_dispatch':
    case 'shipped':
      return 'info'
    default:
      return 'neutral'
  }
}

function StatusBadge({ status }: Readonly<{ status: string }>) {
  return (
    <span className={`ops-badge ops-badge--${statusTone(status)}`}>
      {formatStatus(status)}
    </span>
  )
}

function EmptyState({
  title,
  detail,
}: Readonly<{ title: string; detail: string }>) {
  return (
    <div className="ops-empty">
      <p>{title}</p>
      <span>{detail}</span>
    </div>
  )
}

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return dateFormatter.format(date)
}

export default function AdminPage() {
  const { session, ready } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [profile, setProfile] = useState<PortalProfile | null>(null)
  const [redirectPath, setRedirectPath] = useState<string | null>(null)
  const [overview, setOverview] = useState<AdminOverviewPayload | null>(null)
  const [applications, setApplications] = useState<AdminApplicationsPayload | null>(
    null,
  )
  const [accounts, setAccounts] = useState<AdminDealerAccount[]>([])
  const [dealers, setDealers] = useState<
    Array<{
      id: string
      name: string
      city: string
      state: string
      area: string
      phone: string
    }>
  >([])
  const [orders, setOrders] = useState<DealerOrder[]>([])
  const [tickets, setTickets] = useState<DealerTicket[]>([])
  const [faqs, setFaqs] = useState<AdminFaq[]>([])
  const [supportQueries, setSupportQueries] = useState<AdminSupportQuery[]>([])
  const [resources, setResources] = useState<DealerResource[]>([])
  const [announcements, setAnnouncements] = useState<DealerAnnouncement[]>([])
  const [search, setSearch] = useState('')
  const [recordFilter, setRecordFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [page, setPage] = useState(1)
  const [applicationFilter, setApplicationFilter] = useState<
    'all' | (typeof APPLICATION_STATUSES)[number]
  >('all')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingReject, setPendingReject] = useState<{
    id: string
    name: string
  } | null>(null)
  const [dealerForm, setDealerForm] = useState({
    accountName: '',
    territory: '',
    email: '',
    password: '',
    role: 'dealer' as 'dealer' | 'admin',
  })
  const [editingDealer, setEditingDealer] = useState<string | null>(null)
  const [dealerNetworkForm, setDealerNetworkForm] = useState({
    name: '',
    city: '',
    state: '',
    area: '',
    phone: '',
  })
  const [resourceForm, setResourceForm] = useState({ title: '', fileUrl: '' })
  const [announcementForm, setAnnouncementForm] = useState({ title: '', body: '' })

  const tabParam = searchParams.get('tab')
  const activeTab: AdminTab = isAdminTab(tabParam) ? tabParam : 'overview'

  const setActiveTab = (tab: AdminTab) => {
    setSearch('')
    setRecordFilter('all')
    setPage(1)
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (tab === 'overview') next.delete('tab')
        else next.set('tab', tab)
        return next
      },
      { replace: true },
    )
  }

  const load = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      const profilePayload = await fetchPortalProfile()
      setProfile(profilePayload)
      if (profilePayload.role !== 'admin') {
        setRedirectPath('/portal')
        return
      }
      const failures: string[] = []
      const read = async (name: string, action: () => Promise<void>) => {
        try {
          await action()
        } catch {
          failures.push(name)
        }
      }
      await Promise.all([
        read('overview', async () => setOverview(await fetchAdminOverview())),
        read('applications', async () =>
          setApplications(await fetchAdminApplications()),
        ),
        read('accounts', async () =>
          setAccounts((await fetchAdminDealerAccounts()).accounts),
        ),
        read('dealer network', async () =>
          setDealers((await fetchAdminDealers()).dealers ?? []),
        ),
        read('orders', async () => setOrders((await fetchAdminOrders()).orders)),
        read('tickets', async () =>
          setTickets((await fetchAdminTickets()).tickets),
        ),
        read('FAQs', async () => setFaqs((await fetchAdminFaqs()).faqs)),
        read('support queries', async () =>
          setSupportQueries((await fetchAdminSupportQueries()).queries),
        ),
        read('resources', async () =>
          setResources((await fetchAdminResources()).resources),
        ),
        read('announcements', async () =>
          setAnnouncements((await fetchAdminAnnouncements()).announcements),
        ),
      ])
      if (failures.length)
        setError(
          `Could not refresh ${failures.join(', ')}. Other sections are available; any previous values are retained. Try again.`,
        )
      else setLastUpdated(new Date())
    } catch {
      setError(
        'Could not load your workspace. Check your connection and try again.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!session) return
    // Initial synchronization with the authenticated API.
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load, session])

  useEffect(() => {
    if (!pendingReject) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPendingReject(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [pendingReject])

  const filteredApplications = useMemo(() => {
    const rows = applications?.applications ?? []
    const term = search.trim().toLowerCase()
    return rows.filter((row) => {
      const statusMatch =
        applicationFilter === 'all' || row.status === applicationFilter
      if (!statusMatch) return false
      if (!term) return true
      return (
        row.fullName.toLowerCase().includes(term) ||
        row.email.toLowerCase().includes(term) ||
        row.city.toLowerCase().includes(term) ||
        row.status.toLowerCase().includes(term)
      )
    })
  }, [applicationFilter, applications, search])

  const filteredAccounts = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return accounts
    return accounts.filter(
      (account) =>
        account.accountName.toLowerCase().includes(term) ||
        account.role.toLowerCase().includes(term) ||
        (account.territory ?? '').toLowerCase().includes(term),
    )
  }, [accounts, search])

  const filteredDealers = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return dealers
    return dealers.filter(
      (dealer) =>
        dealer.name.toLowerCase().includes(term) ||
        dealer.city.toLowerCase().includes(term) ||
        dealer.state.toLowerCase().includes(term) ||
        dealer.area.toLowerCase().includes(term),
    )
  }, [dealers, search])

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase()
    return orders
      .filter((order) => recordFilter === 'all' || order.status === recordFilter)
      .filter(
        (order) =>
          order.model.toLowerCase().includes(term) ||
          order.status.replaceAll('_', ' ').toLowerCase().includes(term) ||
          order.id.toLowerCase().includes(term) ||
          (accounts.find((a) => a.id === order.dealerAccountId)?.accountName ?? '')
            .toLowerCase()
            .includes(term),
      )
  }, [orders, search, recordFilter, accounts])

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tickets
      .filter((ticket) => recordFilter === 'all' || ticket.status === recordFilter)
      .filter(
        (ticket) =>
          ticket.subject.toLowerCase().includes(term) ||
          ticket.status.replaceAll('_', ' ').toLowerCase().includes(term) ||
          ticket.id.toLowerCase().includes(term) ||
          (accounts.find((a) => a.id === ticket.dealerAccountId)?.accountName ?? '')
            .toLowerCase()
            .includes(term),
      )
  }, [tickets, search, recordFilter, accounts])

  const filteredResources = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return resources
    return resources.filter((resource) =>
      resource.title.toLowerCase().includes(term),
    )
  }, [resources, search])

  const filteredAnnouncements = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return announcements
    return announcements.filter(
      (announcement) =>
        announcement.title.toLowerCase().includes(term) ||
        announcement.body.toLowerCase().includes(term),
    )
  }, [announcements, search])

  const accountName = (id?: string) =>
    accounts.find((account) => account.id === id)?.accountName ?? id ?? 'Unassigned'

  const tabCounts: Partial<Record<AdminTab, number>> = {
    applications: applications?.count ?? applications?.applications.length ?? 0,
    accounts: accounts.length,
    dealers: dealers.length,
    orders: orders.length,
    tickets: tickets.length,
    faqs: faqs.length,
    queries: supportQueries.length,
    content: resources.length + announcements.length,
  }

  const pipelineMax = Math.max(
    1,
    ...(overview?.pipeline.map((step) => step.count) ?? [1]),
  )

  if (!ready)
    return (
      <main id="main" className="content-page">
        <output>Loading your workspace…</output>
      </main>
    )
  if (!session) return <Navigate to="/portal/login?next=/admin" replace />
  if (redirectPath) return <Navigate to={redirectPath} replace />

  const refresh = () => load()

  const updateStatus = async (id: string, status: string) => {
    setBusyId(id)
    setError(null)
    setNotice(null)
    try {
      await updateAdminApplicationStatus(id, status)
      setNotice(`Application marked as ${formatStatus(status).toLowerCase()}.`)
      setPendingReject(null)
      await load()
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Failed to update status.',
      )
    } finally {
      setBusyId(null)
    }
  }

  const updateOrder = async (id: string, status: string) => {
    setBusyId(id)
    setError(null)
    setNotice(null)
    try {
      const result = await updateAdminOrderStatus(id, status)
      setNotice(result.message)
      await load()
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Failed to update order status.',
      )
    } finally {
      setBusyId(null)
    }
  }

  const updateTicket = async (id: string, status: string) => {
    setBusyId(id)
    setError(null)
    setNotice(null)
    try {
      const result = await updateAdminTicketStatus(id, status)
      setNotice(result.message)
      await load()
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Failed to update ticket status.',
      )
    } finally {
      setBusyId(null)
    }
  }

  const submitDealerLogin = async () => {
    setBusyId('dealer-create')
    setError(null)
    setNotice(null)
    try {
      const result = await createDealerLogin({
        ...dealerForm,
        territory: dealerForm.territory.trim() || undefined,
      })
      setNotice(result.message)
      setDealerForm({
        accountName: '',
        territory: '',
        email: '',
        password: '',
        role: 'dealer',
      })
      await load()
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'Could not create dealer login.',
      )
    } finally {
      setBusyId(null)
    }
  }

  const submitDealerRecord = async () => {
    setBusyId('network-dealer-create')
    setError(null)
    setNotice(null)
    try {
      if (editingDealer) await updateDealerRecord(editingDealer, dealerNetworkForm)
      else await createDealerRecord(dealerNetworkForm)
      setNotice(
        editingDealer
          ? 'Showroom details updated.'
          : 'Showroom added to the network.',
      )
      setEditingDealer(null)
      setDealerNetworkForm({ name: '', city: '', state: '', area: '', phone: '' })
      await load()
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'Could not create dealer record.',
      )
    } finally {
      setBusyId(null)
    }
  }

  const submitResource = async () => {
    setBusyId('resource-create')
    setError(null)
    setNotice(null)
    try {
      await createAdminResource(resourceForm)
      setNotice('Resource published successfully.')
      setResourceForm({ title: '', fileUrl: '' })
      await load()
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'Could not create resource.',
      )
    } finally {
      setBusyId(null)
    }
  }

  const submitAnnouncement = async () => {
    setBusyId('announcement-create')
    setError(null)
    setNotice(null)
    try {
      await createAdminAnnouncement(announcementForm)
      setNotice('Announcement published successfully.')
      setAnnouncementForm({ title: '', body: '' })
      await load()
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'Could not create announcement.',
      )
    } finally {
      setBusyId(null)
    }
  }

  const exportRows: unknown[][] | null =
    activeTab === 'applications'
      ? [
          ['Name', 'Email', 'City', 'Status', 'Created'],
          ...filteredApplications.map((r) => [
            r.fullName,
            r.email,
            r.city,
            r.status,
            r.createdAt,
          ]),
        ]
      : activeTab === 'accounts'
        ? [
            ['Account', 'Role', 'Territory'],
            ...filteredAccounts.map((r) => [r.accountName, r.role, r.territory]),
          ]
        : activeTab === 'dealers'
          ? [
              ['Name', 'City', 'State', 'Area', 'Phone'],
              ...filteredDealers.map((r) => [
                r.name,
                r.city,
                r.state,
                r.area,
                r.phone,
              ]),
            ]
          : activeTab === 'orders'
            ? [
                ['Reference', 'Model', 'Quantity', 'Status', 'Created'],
                ...filteredOrders.map((r) => [
                  r.id,
                  r.model,
                  r.quantity,
                  r.status,
                  r.createdAt,
                ]),
              ]
            : activeTab === 'tickets'
              ? [
                  ['Reference', 'Subject', 'Status', 'Created'],
                  ...filteredTickets.map((r) => [
                    r.id,
                    r.subject,
                    r.status,
                    r.createdAt,
                  ]),
                ]
              : null
  const pageCount = Math.max(1, Math.ceil(((exportRows?.length ?? 1) - 1) / 50))
  const currentPage = Math.min(page, pageCount)
  const searchField =
    activeTab === 'overview' ? null : (
      <div className="ops-search">
        <label htmlFor="ops-search-input">Search</label>
        <input
          id="ops-search-input"
          className="ops-search-input"
          type="search"
          name="q"
          autoComplete="off"
          spellCheck={false}
          placeholder={SEARCH_PLACEHOLDERS[activeTab]}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
        />
      </div>
    )

  return (
    <>
      <Seo
        title="Amptron Admin Console"
        description="Review dealer applications and manage onboarding status with role-gated admin workflows."
        path="/admin"
      />
      <main id="main" className="content-page ops-page">
        <header className="ops-hero">
          <div>
            <p className="content-eyebrow">Admin Console</p>
            <h1>Admin workspace</h1>
            <p>
              Review onboarding, accounts, logistics, and support from one
              workspace.
            </p>
          </div>
          <p className="ops-identity">
            <span>Signed in</span>
            <strong>{profile?.accountName ?? 'Admin'}</strong>
          </p>
        </header>

        <WorkspaceTabs
          prefix="ops"
          items={ADMIN_TABS.map((tab) => ({ ...tab, count: tabCounts[tab.id] }))}
          active={activeTab}
          onChange={(id) => setActiveTab(id as AdminTab)}
        />
        <div className="workspace-data-tools">
          <small>
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Workspace data'}
            {refreshing ? ' · Refreshing…' : ''}
          </small>
          <div className="workspace-actions">
            {['faqs', 'queries'].includes(activeTab) && searchField}
            {['orders', 'tickets'].includes(activeTab) && (
              <label>
                Status{' '}
                <select
                  aria-label="Filter by status"
                  value={recordFilter}
                  onChange={(e) => {
                    setRecordFilter(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="all">All statuses</option>
                  {(activeTab === 'orders' ? ORDER_STATUSES : TICKET_STATUSES).map(
                    (status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ),
                  )}
                </select>
              </label>
            )}
            {exportRows && (
              <button
                className="ops-btn"
                disabled={exportRows.length < 2}
                onClick={() => exportCsv(activeTab, exportRows)}
              >
                Export CSV
              </button>
            )}
            <button
              className="ops-btn"
              disabled={refreshing || Boolean(busyId)}
              onClick={() => void load()}
            >
              {refreshing ? 'Refreshing…' : 'Refresh data'}
            </button>
          </div>
        </div>

        {error ? (
          <p className="ops-banner ops-banner--error" role="alert">
            {error}
            <button disabled={refreshing} onClick={() => void load()}>
              Retry
            </button>
          </p>
        ) : null}
        {notice ? (
          <output className="ops-banner ops-banner--success">
            <span>{notice}</span>
            <button
              type="button"
              className="ops-banner-dismiss"
              onClick={() => setNotice(null)}
            >
              Dismiss
            </button>
          </output>
        ) : null}

        {loading ? (
          <p className="ops-loading" aria-live="polite">
            Loading console…
          </p>
        ) : null}

        {!loading && activeTab === 'overview' && overview ? (
          <div
            id="ops-panel-overview"
            role="tabpanel"
            aria-labelledby="ops-tab-overview"
          >
            <section className="ops-kpi-grid">
              {overview.kpis.map((kpi) => {
                const tab = KPI_TAB[kpi.label]
                if (!tab) {
                  return (
                    <article className="ops-kpi" key={kpi.label}>
                      <span>{kpi.label}</span>
                      <strong>{kpi.value}</strong>
                    </article>
                  )
                }
                return (
                  <button
                    type="button"
                    className="ops-kpi"
                    key={kpi.label}
                    onClick={() => setActiveTab(tab)}
                  >
                    <span>{kpi.label}</span>
                    <strong>{kpi.value}</strong>
                    <small>Open {tab}</small>
                  </button>
                )
              })}
            </section>
            <section className="ops-split">
              <article className="ops-panel">
                <div className="ops-panel-head">
                  <h2>Application pipeline</h2>
                </div>
                {overview.pipeline.length === 0 ? (
                  <EmptyState
                    title="No pipeline data yet"
                    detail="New dealer applications will appear here."
                  />
                ) : (
                  <ul className="ops-pipeline">
                    {overview.pipeline.map((step) => (
                      <li key={step.status}>
                        <button
                          type="button"
                          className="ops-pipeline-row"
                          onClick={() => {
                            setApplicationFilter(
                              step.status as (typeof APPLICATION_STATUSES)[number],
                            )
                            setActiveTab('applications')
                          }}
                        >
                          <StatusBadge status={step.status} />
                          <span className="ops-bar" aria-hidden="true">
                            <span
                              style={{
                                width: `${(step.count / pipelineMax) * 100}%`,
                              }}
                            />
                          </span>
                          <strong>{step.count}</strong>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
              <article className="ops-panel">
                <div className="ops-panel-head">
                  <h2>Recent tickets</h2>
                  <button
                    type="button"
                    className="ops-text-btn"
                    onClick={() => setActiveTab('tickets')}
                  >
                    View all
                  </button>
                </div>
                {overview.recentTickets.length === 0 ? (
                  <EmptyState
                    title="No recent tickets"
                    detail="Support requests will show up as dealers file them."
                  />
                ) : (
                  <ul className="ops-feed">
                    {overview.recentTickets.map((ticket) => (
                      <li key={ticket.id}>
                        <div className="ops-person">
                          <strong>{ticket.subject}</strong>
                          <p className="workspace-muted">
                            {accountName(ticket.dealerAccountId)}
                          </p>
                          <span>{formatDate(ticket.createdAt)}</span>
                        </div>
                        <StatusBadge status={ticket.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </section>
          </div>
        ) : null}

        {!loading && activeTab === 'applications' && applications ? (
          <section
            className="ops-panel"
            id="ops-panel-applications"
            role="tabpanel"
            aria-labelledby="ops-tab-applications"
          >
            <div className="ops-panel-head">
              <div>
                <h2>Applications</h2>
                <p>
                  {filteredApplications.length} of {applications.count} shown
                </p>
              </div>
              <div className="ops-panel-tools">
                <fieldset className="ops-filters">
                  <legend className="sr-only">Filter by status</legend>
                  <button
                    type="button"
                    className={applicationFilter === 'all' ? 'is-active' : ''}
                    onClick={() => setApplicationFilter('all')}
                  >
                    All
                  </button>
                  {APPLICATION_STATUSES.map((status) => (
                    <button
                      type="button"
                      key={status}
                      className={applicationFilter === status ? 'is-active' : ''}
                      onClick={() => setApplicationFilter(status)}
                    >
                      {formatStatus(status)}
                    </button>
                  ))}
                </fieldset>
                {searchField}
              </div>
            </div>
            {filteredApplications.length === 0 ? (
              <EmptyState
                title="No applications match this view"
                detail={
                  search
                    ? 'Try a different name, city, or status.'
                    : 'When dealers apply, they will land here for review.'
                }
              />
            ) : (
              <div className="ops-table-wrap">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th scope="col">Applicant</th>
                      <th scope="col">City</th>
                      <th scope="col">Status</th>
                      <th scope="col">Submitted</th>
                      <th scope="col" className="ops-col-actions">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications
                      .slice((currentPage - 1) * 50, currentPage * 50)
                      .map((application) => (
                        <tr key={application.id}>
                          <td className="ops-person">
                            <strong>{application.fullName}</strong>
                            <a
                              href={`mailto:${application.email}`}
                              aria-label={`Email ${application.fullName}`}
                            >
                              {application.email}
                            </a>
                            {application.phone && (
                              <a href={`tel:${application.phone}`}>
                                {application.phone}
                              </a>
                            )}
                            {application.profile && (
                              <details className="workspace-record-detail">
                                <summary>Showroom experience</summary>
                                <p>{application.profile}</p>
                              </details>
                            )}
                          </td>
                          <td>{application.city}</td>
                          <td>
                            <StatusBadge status={application.status} />
                          </td>
                          <td className="ops-num">
                            {formatDate(application.createdAt)}
                          </td>
                          <td className="ops-col-actions">
                            <div className="ops-actions">
                              <button
                                type="button"
                                className="ops-btn ops-btn--success"
                                aria-label={`Approve ${application.fullName}`}
                                disabled={
                                  busyId === application.id ||
                                  application.status === 'approved'
                                }
                                onClick={() =>
                                  updateStatus(application.id, 'approved')
                                }
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="ops-btn ops-btn--danger"
                                aria-label={`Reject ${application.fullName}`}
                                disabled={
                                  busyId === application.id ||
                                  application.status === 'rejected'
                                }
                                onClick={() =>
                                  setPendingReject({
                                    id: application.id,
                                    name: application.fullName,
                                  })
                                }
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                className="ops-btn"
                                aria-label={`Mark ${application.fullName} as contacted`}
                                disabled={
                                  busyId === application.id ||
                                  application.status === 'contacted'
                                }
                                onClick={() =>
                                  updateStatus(application.id, 'contacted')
                                }
                              >
                                Mark Contacted
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}

        {!loading && activeTab === 'accounts' ? (
          <section
            className="ops-split"
            id="ops-panel-accounts"
            role="tabpanel"
            aria-labelledby="ops-tab-accounts"
          >
            <article className="ops-panel">
              <div className="ops-panel-head">
                <h2>Create account login</h2>
              </div>
              <form
                className="simple-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  void submitDealerLogin()
                }}
              >
                <label htmlFor="dealer-account-name">
                  Account Name
                  <input
                    id="dealer-account-name"
                    required
                    minLength={2}
                    maxLength={120}
                    name="accountName"
                    autoComplete="organization"
                    value={dealerForm.accountName}
                    onChange={(event) =>
                      setDealerForm((previous) => ({
                        ...previous,
                        accountName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label htmlFor="dealer-territory">
                  Territory
                  <input
                    id="dealer-territory"
                    minLength={2}
                    maxLength={120}
                    name="territory"
                    autoComplete="off"
                    value={dealerForm.territory}
                    onChange={(event) =>
                      setDealerForm((previous) => ({
                        ...previous,
                        territory: event.target.value,
                      }))
                    }
                  />
                </label>
                <label htmlFor="dealer-email">
                  Login Email
                  <input
                    id="dealer-email"
                    required
                    name="email"
                    type="email"
                    autoComplete="off"
                    spellCheck={false}
                    value={dealerForm.email}
                    onChange={(event) =>
                      setDealerForm((previous) => ({
                        ...previous,
                        email: event.target.value,
                      }))
                    }
                  />
                </label>
                <label htmlFor="dealer-password">
                  Temporary Password
                  <input
                    id="dealer-password"
                    required
                    minLength={8}
                    maxLength={72}
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={dealerForm.password}
                    onChange={(event) =>
                      setDealerForm((previous) => ({
                        ...previous,
                        password: event.target.value,
                      }))
                    }
                  />
                </label>
                <label htmlFor="dealer-role">
                  Role
                  <select
                    id="dealer-role"
                    name="role"
                    value={dealerForm.role}
                    onChange={(event) =>
                      setDealerForm((previous) => ({
                        ...previous,
                        role: event.target.value as 'dealer' | 'admin',
                      }))
                    }
                  >
                    <option value="dealer">Dealer</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={busyId === 'dealer-create'}
                >
                  {busyId === 'dealer-create'
                    ? 'Creating…'
                    : 'Create account login'}
                </button>
              </form>
            </article>
            <article className="ops-panel">
              <div className="ops-panel-head">
                <div>
                  <h2>Account directory</h2>
                  <p>{filteredAccounts.length} accounts</p>
                </div>
                {searchField}
              </div>
              {filteredAccounts.length === 0 ? (
                <EmptyState
                  title="No accounts found"
                  detail="Create a login or adjust your search."
                />
              ) : (
                <div className="ops-table-wrap">
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th scope="col">Account</th>
                        <th scope="col">Role</th>
                        <th scope="col">Territory</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAccounts
                        .slice((currentPage - 1) * 50, currentPage * 50)
                        .map((account) => (
                          <tr key={account.id}>
                            <td>
                              <strong>{account.accountName}</strong>
                            </td>
                            <td>
                              <StatusBadge status={account.role} />
                            </td>
                            <td>{account.territory ?? '-'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          </section>
        ) : null}

        {!loading && activeTab === 'dealers' ? (
          <section
            className="ops-split"
            id="ops-panel-dealers"
            role="tabpanel"
            aria-labelledby="ops-tab-dealers"
          >
            <article className="ops-panel">
              <div className="ops-panel-head">
                <h2>{editingDealer ? 'Edit showroom' : 'Add showroom'}</h2>
              </div>
              <p className="workspace-muted">
                Showroom locations appear in the public dealer finder. Account
                logins are managed separately.
              </p>
              {editingDealer && (
                <button
                  className="ops-text-btn"
                  onClick={() => {
                    setEditingDealer(null)
                    setDealerNetworkForm({
                      name: '',
                      city: '',
                      state: '',
                      area: '',
                      phone: '',
                    })
                  }}
                >
                  Cancel editing
                </button>
              )}
              <form
                className="simple-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  void submitDealerRecord()
                }}
              >
                {(
                  [
                    ['name', 'Dealer Name', 'text'],
                    ['city', 'City', 'text'],
                    ['state', 'State', 'text'],
                    ['area', 'Area', 'text'],
                    ['phone', 'Phone', 'tel'],
                  ] as const
                ).map(([field, label, type]) => (
                  <label key={field} htmlFor={`network-${field}`}>
                    {label}
                    <input
                      id={`network-${field}`}
                      required
                      minLength={field === 'phone' ? 8 : 2}
                      maxLength={
                        field === 'phone'
                          ? 20
                          : field === 'name'
                            ? 100
                            : field === 'area'
                              ? 120
                              : 80
                      }
                      name={field}
                      type={type}
                      autoComplete="off"
                      value={dealerNetworkForm[field]}
                      onChange={(event) =>
                        setDealerNetworkForm((previous) => ({
                          ...previous,
                          [field]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={busyId === 'network-dealer-create'}
                >
                  {busyId === 'network-dealer-create'
                    ? 'Saving…'
                    : editingDealer
                      ? 'Save changes'
                      : 'Save showroom'}
                </button>
              </form>
            </article>
            <article className="ops-panel">
              <div className="ops-panel-head">
                <div>
                  <h2>Showroom directory</h2>
                  <p>{filteredDealers.length} locations</p>
                </div>
                {searchField}
              </div>
              {filteredDealers.length === 0 ? (
                <EmptyState
                  title="No dealers found"
                  detail="Add a location or try another search."
                />
              ) : (
                <div className="ops-table-wrap">
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">City</th>
                        <th scope="col">State</th>
                        <th scope="col">Phone</th>
                        <th scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDealers
                        .slice((currentPage - 1) * 50, currentPage * 50)
                        .map((dealer) => (
                          <tr key={dealer.id}>
                            <td className="ops-person">
                              <strong>{dealer.name}</strong>
                              <span>{dealer.area}</span>
                            </td>
                            <td>{dealer.city}</td>
                            <td>{dealer.state}</td>
                            <td>
                              <a
                                href={`tel:${dealer.phone}`}
                                aria-label={`Call ${dealer.name}`}
                              >
                                {dealer.phone}
                              </a>
                            </td>
                            <td>
                              <button
                                className="ops-btn"
                                aria-label={`Edit ${dealer.name}`}
                                disabled={Boolean(busyId)}
                                onClick={() => {
                                  setEditingDealer(dealer.id)
                                  setDealerNetworkForm({
                                    name: dealer.name,
                                    city: dealer.city,
                                    state: dealer.state,
                                    area: dealer.area,
                                    phone: dealer.phone,
                                  })
                                  document.getElementById('network-name')?.focus()
                                }}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          </section>
        ) : null}

        {!loading && activeTab === 'orders' ? (
          <section
            className="ops-panel"
            id="ops-panel-orders"
            role="tabpanel"
            aria-labelledby="ops-tab-orders"
          >
            <div className="ops-panel-head">
              <div>
                <h2>Orders</h2>
                <p>{filteredOrders.length} shipments</p>
              </div>
              {searchField}
            </div>
            {filteredOrders.length === 0 ? (
              <EmptyState
                title="No orders match this view"
                detail="Dealer orders will appear as they are placed."
              />
            ) : (
              <div className="ops-table-wrap">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th scope="col">Model</th>
                      <th scope="col">Qty</th>
                      <th scope="col">Status</th>
                      <th scope="col">Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders
                      .slice((currentPage - 1) * 50, currentPage * 50)
                      .map((order) => (
                        <tr key={order.id}>
                          <td>
                            <strong>{order.model}</strong>
                            <p className="workspace-muted">
                              {accountName(order.dealerAccountId)}
                            </p>
                            <p className="workspace-muted">
                              Ref {order.id.slice(0, 8)} ·{' '}
                              {formatDate(order.createdAt)}
                            </p>
                          </td>
                          <td className="ops-num">{order.quantity}</td>
                          <td>
                            <StatusBadge status={order.status} />
                          </td>
                          <td>
                            <label
                              className="ops-select"
                              htmlFor={`order-status-${order.id}`}
                            >
                              <span className="sr-only">
                                Update status for {order.model}
                              </span>
                              <select
                                id={`order-status-${order.id}`}
                                aria-label={`Update status for ${order.model}`}
                                value={order.status}
                                disabled={Boolean(busyId) || refreshing}
                                onChange={(event) =>
                                  updateOrder(order.id, event.target.value)
                                }
                              >
                                {ORDER_STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {formatStatus(status)}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}

        {!loading && activeTab === 'tickets' ? (
          <section
            className="ops-panel"
            id="ops-panel-tickets"
            role="tabpanel"
            aria-labelledby="ops-tab-tickets"
          >
            <div className="ops-panel-head">
              <div>
                <h2>Support tickets</h2>
                <p>{filteredTickets.length} conversations</p>
              </div>
              {searchField}
            </div>
            {filteredTickets.length === 0 ? (
              <EmptyState
                title="No tickets match this view"
                detail="Open tickets will show here as dealers reach out."
              />
            ) : (
              <div className="ops-table-wrap">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th scope="col">Subject</th>
                      <th scope="col">Status</th>
                      <th scope="col">Created</th>
                      <th scope="col">Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets
                      .slice((currentPage - 1) * 50, currentPage * 50)
                      .map((ticket) => (
                        <tr key={ticket.id}>
                          <td>
                            <strong>{ticket.subject}</strong>
                            <p className="workspace-muted">
                              {accountName(ticket.dealerAccountId)}
                            </p>
                            <p className="workspace-muted">
                              Ref {ticket.id.slice(0, 8)}
                            </p>
                            {ticket.detail && (
                              <details className="workspace-record-detail">
                                <summary>View details</summary>
                                <p>{ticket.detail}</p>
                              </details>
                            )}
                          </td>
                          <td>
                            <StatusBadge status={ticket.status} />
                          </td>
                          <td className="ops-num">
                            {formatDate(ticket.createdAt)}
                          </td>
                          <td>
                            <label
                              className="ops-select"
                              htmlFor={`ticket-status-${ticket.id}`}
                            >
                              <span className="sr-only">
                                Update status for {ticket.subject}
                              </span>
                              <select
                                id={`ticket-status-${ticket.id}`}
                                aria-label={`Update status for ${ticket.subject}`}
                                value={ticket.status}
                                disabled={Boolean(busyId) || refreshing}
                                onChange={(event) =>
                                  updateTicket(ticket.id, event.target.value)
                                }
                              >
                                {TICKET_STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {formatStatus(status)}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}

        {!loading && activeTab === 'faqs' ? (
          <AdminFaqPanel
            faqs={faqs}
            search={search}
            busyId={busyId}
            onBusy={setBusyId}
            onNotice={(message) => {
              setError(null)
              setNotice(message)
            }}
            onError={(message) => {
              setNotice(null)
              setError(message)
            }}
            onRefresh={refresh}
          />
        ) : null}

        {!loading && activeTab === 'queries' ? (
          <AdminSupportQueriesPanel
            queries={supportQueries}
            search={search}
            busyId={busyId}
            onBusy={setBusyId}
            onNotice={(message) => {
              setError(null)
              setNotice(message)
            }}
            onError={(message) => {
              setNotice(null)
              setError(message)
            }}
            onRefresh={refresh}
          />
        ) : null}

        {!loading && activeTab === 'content' ? (
          <section
            className="ops-split"
            id="ops-panel-content"
            role="tabpanel"
            aria-labelledby="ops-tab-content"
          >
            <article className="ops-panel">
              <div className="ops-panel-head">
                <h2>Publish Resource</h2>
              </div>
              <form
                className="simple-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  void submitResource()
                }}
              >
                <label htmlFor="resource-title">
                  Title
                  <input
                    id="resource-title"
                    required
                    minLength={4}
                    maxLength={120}
                    name="title"
                    autoComplete="off"
                    value={resourceForm.title}
                    onChange={(event) =>
                      setResourceForm((previous) => ({
                        ...previous,
                        title: event.target.value,
                      }))
                    }
                  />
                </label>
                <label htmlFor="resource-url">
                  File URL
                  <input
                    id="resource-url"
                    required
                    name="fileUrl"
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="https://…"
                    value={resourceForm.fileUrl}
                    onChange={(event) =>
                      setResourceForm((previous) => ({
                        ...previous,
                        fileUrl: event.target.value,
                      }))
                    }
                  />
                </label>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={busyId === 'resource-create'}
                >
                  {busyId === 'resource-create'
                    ? 'Publishing…'
                    : 'Publish Resource'}
                </button>
              </form>

              <div className="ops-panel-head ops-panel-head--spaced">
                <h2>Publish Announcement</h2>
              </div>
              <form
                className="simple-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  void submitAnnouncement()
                }}
              >
                <label htmlFor="announcement-title">
                  Title
                  <input
                    id="announcement-title"
                    required
                    minLength={4}
                    maxLength={120}
                    name="announcementTitle"
                    autoComplete="off"
                    value={announcementForm.title}
                    onChange={(event) =>
                      setAnnouncementForm((previous) => ({
                        ...previous,
                        title: event.target.value,
                      }))
                    }
                  />
                </label>
                <label htmlFor="announcement-body">
                  Body
                  <textarea
                    id="announcement-body"
                    required
                    minLength={10}
                    maxLength={2000}
                    name="announcementBody"
                    rows={5}
                    value={announcementForm.body}
                    onChange={(event) =>
                      setAnnouncementForm((previous) => ({
                        ...previous,
                        body: event.target.value,
                      }))
                    }
                  />
                </label>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={busyId === 'announcement-create'}
                >
                  {busyId === 'announcement-create'
                    ? 'Publishing…'
                    : 'Publish Announcement'}
                </button>
              </form>
            </article>
            <article className="ops-panel">
              <div className="ops-panel-head">
                <div>
                  <h2>Published content</h2>
                  <p>
                    {filteredResources.length} resources ·{' '}
                    {filteredAnnouncements.length} announcements
                  </p>
                </div>
                {searchField}
              </div>
              {filteredResources.length === 0 ? (
                <EmptyState
                  title="No resources yet"
                  detail="Published files will appear in this list."
                />
              ) : (
                <div className="ops-table-wrap">
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th scope="col">Title</th>
                        <th scope="col">Updated</th>
                        <th scope="col">Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResources.map((resource) => (
                        <tr key={resource.id}>
                          <td>
                            <strong>{resource.title}</strong>
                          </td>
                          <td className="ops-num">
                            {formatDate(resource.createdAt)}
                          </td>
                          <td>
                            <a href={resource.url} target="_blank" rel="noreferrer">
                              Open
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h3 className="ops-subhead">Announcements</h3>
              {filteredAnnouncements.length === 0 ? (
                <EmptyState
                  title="No announcements yet"
                  detail="Dealer-facing updates will show here after you publish."
                />
              ) : (
                <div className="announcement-feed">
                  {filteredAnnouncements.map((announcement) => (
                    <article key={announcement.id}>
                      <h3>{announcement.title}</h3>
                      <p>{announcement.body}</p>
                      <small>{formatDate(announcement.publishedAt)}</small>
                    </article>
                  ))}
                </div>
              )}
            </article>
          </section>
        ) : null}
        {!loading && (
          <div hidden={activeTab !== 'catalog'}>
            <AdminCatalogPanel />
          </div>
        )}
        {pageCount > 1 && (
          <nav className="workspace-data-tools" aria-label="Record pages">
            <button
              className="ops-btn"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {pageCount} · 50 records per page
            </span>
            <button
              className="ops-btn"
              disabled={currentPage === pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </button>
          </nav>
        )}
      </main>

      {pendingReject ? (
        <div className="ops-dialog-layer">
          <button
            type="button"
            className="ops-dialog-backdrop"
            aria-label="Dismiss reject confirmation"
            onClick={() => setPendingReject(null)}
          />
          <div
            className="ops-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="ops-reject-title"
            aria-describedby="ops-reject-body"
          >
            <h2 id="ops-reject-title">Reject this application?</h2>
            <p id="ops-reject-body">
              {pendingReject.name} will be marked as rejected and will not continue
              onboarding.
            </p>
            <div className="ops-dialog-actions">
              <button
                type="button"
                className="ops-btn"
                onClick={() => setPendingReject(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ops-btn ops-btn--danger"
                disabled={busyId === pendingReject.id}
                onClick={() => updateStatus(pendingReject.id, 'rejected')}
              >
                {busyId === pendingReject.id ? 'Rejecting…' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
