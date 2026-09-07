import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import Seo from '../components/Seo'
import WorkspaceTabs from '../components/WorkspaceTabs'
import WorkspaceStatus from '../components/WorkspaceStatus'
import { useAuth } from '../lib/auth'
import {
  createSupportTicket,
  fetchPortalAnnouncements,
  fetchPortalOrders,
  fetchPortalProfile,
  fetchPortalResources,
  fetchPortalTickets,
  type DealerAnnouncement,
  type DealerOrder,
  type DealerResource,
  type DealerTicket,
  type PortalProfile,
} from '../lib/portalApi'
import ModelCard from '../components/ui/ModelCard'
import { useSiteContent } from '../lib/siteContent'
import { displayDate, displayStatus, exportCsv } from '../lib/workspace'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'catalog', label: 'Model catalog' },
  { id: 'orders', label: 'Orders' },
  { id: 'resources', label: 'Resources' },
  { id: 'announcements', label: 'Updates' },
  { id: 'tickets', label: 'Support tickets' },
] as const
type DealerTab = (typeof TABS)[number]['id']
function Empty({ text = 'No records match this view.' }: { text?: string }) {
  return (
    <div className="ops-empty">
      <p>{text}</p>
      <span>Try another search or refresh the workspace.</span>
    </div>
  )
}
export default function PortalPage() {
  const { session, ready } = useAuth()
  const { models } = useSiteContent()
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  const activeTab: DealerTab = TABS.some((t) => t.id === requested)
    ? (requested as DealerTab)
    : 'overview'
  const [profile, setProfile] = useState<PortalProfile | null>(null)
  const [orders, setOrders] = useState<DealerOrder[]>([])
  const [resources, setResources] = useState<DealerResource[]>([])
  const [announcements, setAnnouncements] = useState<DealerAnnouncement[]>([])
  const [tickets, setTickets] = useState<DealerTicket[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [updated, setUpdated] = useState<Date | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [ticket, setTicket] = useState({ subject: '', detail: '' })
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const [ticketError, setTicketError] = useState('')
  function changeTab(id: string) {
    setParams(id === 'overview' ? {} : { tab: id }, { replace: true })
    setSearch('')
    setStatus('all')
    setPage(1)
  }
  const load = useCallback(async () => {
    setRefreshing(true)
    setError('')
    try {
      const identity = await fetchPortalProfile()
      setProfile(identity)
      if (identity.role === 'admin') return
      const failures: string[] = []
      async function read(name: string, task: () => Promise<void>) {
        try {
          await task()
        } catch {
          failures.push(name)
        }
      }
      await Promise.all([
        read('orders', async () => setOrders((await fetchPortalOrders()).orders)),
        read('resources', async () =>
          setResources((await fetchPortalResources()).resources),
        ),
        read('updates', async () =>
          setAnnouncements((await fetchPortalAnnouncements()).announcements),
        ),
        read('tickets', async () =>
          setTickets((await fetchPortalTickets()).tickets),
        ),
      ])
      if (failures.length)
        setError(
          `Could not refresh ${failures.join(', ')}. Other sections remain available; previous values are retained.`,
        )
      else setUpdated(new Date())
    } catch {
      setError('Could not load your workspace. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])
  useEffect(() => {
    // Initial synchronization with the authenticated API.
    // oxlint-disable-next-line react/set-state-in-effect
    if (session) void load()
  }, [session, load])
  async function submitTicket() {
    if (submitting) return
    setSubmitting(true)
    setTicketError('')
    setNotice('')
    let saved = false
    try {
      const result = await createSupportTicket({
        subject: ticket.subject.trim(),
        detail: ticket.detail.trim(),
      })
      saved = true
      setNotice(`${result.message} Reference: ${result.id}`)
      setTicket({ subject: '', detail: '' })
      setFormOpen(false)
      setTickets((await fetchPortalTickets()).tickets)
    } catch {
      if (saved)
        setError('Your ticket was submitted. Refresh to see its latest status.')
      else
        setTicketError(
          'Could not submit your ticket. Your details are kept here; please try again.',
        )
    } finally {
      setSubmitting(false)
    }
  }
  const term = search.trim().toLowerCase()
  const filteredOrders = useMemo(
    () =>
      orders.filter(
        (r) =>
          (status === 'all' || r.status === status) &&
          `${r.model} ${r.id} ${displayStatus(r.status)}`
            .toLowerCase()
            .includes(term),
      ),
    [orders, status, term],
  )
  const filteredTickets = useMemo(
    () =>
      tickets.filter(
        (r) =>
          (status === 'all' || r.status === status) &&
          `${r.subject} ${r.id} ${displayStatus(r.status)}`
            .toLowerCase()
            .includes(term),
      ),
    [tickets, status, term],
  )
  const filteredModels = models.filter((r) =>
    `${r.name} ${r.tagline}`.toLowerCase().includes(term),
  )
  const filteredResources = resources.filter((r) =>
    r.title.toLowerCase().includes(term),
  )
  const filteredUpdates = announcements.filter((r) =>
    `${r.title} ${r.body}`.toLowerCase().includes(term),
  )
  const rows = activeTab === 'orders' ? filteredOrders : filteredTickets
  const pageCount = Math.max(1, Math.ceil(rows.length / 25))
  const currentPage = Math.min(page, pageCount)
  if (!ready)
    return (
      <main id="main" className="content-page">
        <output>Loading your workspace…</output>
      </main>
    )
  if (!session) return <Navigate to="/portal/login?next=/portal" replace />
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />
  const kpis = [
    {
      label: 'Active orders',
      value: orders.filter((r) => !['delivered', 'cancelled'].includes(r.status))
        .length,
      tab: 'orders',
    },
    {
      label: 'Open tickets',
      value: tickets.filter((r) => r.status !== 'closed').length,
      tab: 'tickets',
    },
    { label: 'Resources', value: resources.length, tab: 'resources' },
    { label: 'Published models', value: models.length, tab: 'catalog' },
  ]
  return (
    <>
      <Seo
        title="Amptron Dealer Portal"
        description="Your Amptron orders, resources and support."
        path="/portal"
      />
      <main id="main" className="content-page ops-page">
        <header className="ops-hero">
          <div>
            <p className="content-eyebrow">Dealer workspace</p>
            <h1>{profile?.accountName ?? 'Your workspace'}</h1>
            <p>Orders, product information and support in one place.</p>
          </div>
          <p className="ops-identity">
            <span>Territory</span>
            <strong>{profile?.territory || 'Not assigned'}</strong>
          </p>
        </header>
        <WorkspaceTabs
          prefix="dealer"
          items={TABS}
          active={activeTab}
          onChange={changeTab}
        />
        <div className="workspace-data-tools">
          <small>
            {updated
              ? `Updated ${updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Workspace data'}
          </small>
          <button
            className="ops-btn"
            disabled={refreshing || submitting}
            onClick={() => void load()}
          >
            {refreshing ? 'Refreshing…' : 'Refresh data'}
          </button>
        </div>
        {error && (
          <p className="ops-banner ops-banner--error" role="alert">
            {error}
            <button disabled={refreshing} onClick={() => void load()}>
              Retry
            </button>
          </p>
        )}
        {notice && (
          <output className="ops-banner ops-banner--success">
            {notice}
            <button onClick={() => setNotice('')}>Dismiss</button>
          </output>
        )}
        {loading ? (
          <output>Loading your workspace…</output>
        ) : (
          <section
            id={`dealer-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`dealer-tab-${activeTab}`}
          >
            {activeTab === 'overview' ? (
              <>
                <div className="ops-kpi-grid">
                  {kpis.map((k) => (
                    <button
                      className="ops-kpi"
                      key={k.label}
                      onClick={() => changeTab(k.tab)}
                    >
                      <span>{k.label}</span>
                      <strong>{k.value}</strong>
                      <small>View {k.tab} →</small>
                    </button>
                  ))}
                </div>
                <div className="ops-split">
                  <article className="ops-panel">
                    <div className="ops-panel-head">
                      <h2>Recent orders</h2>
                      <button
                        className="ops-text-btn"
                        onClick={() => changeTab('orders')}
                      >
                        View all
                      </button>
                    </div>
                    {orders.length ? (
                      <ul className="ops-feed">
                        {orders.slice(0, 5).map((r) => (
                          <li key={r.id}>
                            <div>
                              <strong>{r.model}</strong>
                              <p className="workspace-muted">
                                {r.quantity} units · {displayDate(r.createdAt)}
                              </p>
                            </div>
                            <WorkspaceStatus status={r.status} />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Empty text="No orders yet." />
                    )}
                  </article>
                  <article className="ops-panel">
                    <div className="ops-panel-head">
                      <h2>Support at a glance</h2>
                      <button
                        className="ops-text-btn"
                        onClick={() => {
                          changeTab('tickets')
                          setFormOpen(true)
                        }}
                      >
                        New ticket
                      </button>
                    </div>
                    {tickets.some((r) => r.status !== 'closed') ? (
                      <ul className="ops-feed">
                        {tickets
                          .filter((r) => r.status !== 'closed')
                          .slice(0, 5)
                          .map((r) => (
                            <li key={r.id}>
                              <strong>{r.subject}</strong>
                              <WorkspaceStatus status={r.status} />
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <Empty text="No open support tickets." />
                    )}
                  </article>
                </div>
              </>
            ) : (
              <article className="ops-panel">
                <div className="ops-panel-head">
                  <div>
                    <h2>{TABS.find((t) => t.id === activeTab)?.label}</h2>
                    <p>
                      {activeTab === 'catalog'
                        ? 'Published scooter specifications for your customers.'
                        : activeTab === 'tickets'
                          ? 'Track requests and contact the Amptron team.'
                          : 'The latest information for your account.'}
                    </p>
                  </div>
                  <div className="ops-search">
                    <label htmlFor="dealer-search">
                      Search{' '}
                      {TABS.find((t) => t.id === activeTab)?.label.toLowerCase()}
                    </label>
                    <input
                      id="dealer-search"
                      type="search"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                      }}
                      placeholder="Search this section…"
                    />
                  </div>
                </div>
                {['orders', 'tickets'].includes(activeTab) && (
                  <div className="workspace-data-tools">
                    <label>
                      Status
                      <select
                        value={status}
                        onChange={(e) => {
                          setStatus(e.target.value)
                          setPage(1)
                        }}
                      >
                        <option value="all">All statuses</option>
                        {(activeTab === 'orders'
                          ? [
                              'pending',
                              'in_dispatch',
                              'shipped',
                              'delivered',
                              'cancelled',
                            ]
                          : ['open', 'in_progress', 'closed']
                        ).map((s) => (
                          <option key={s} value={s}>
                            {displayStatus(s)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="workspace-actions">
                      <button
                        className="ops-btn"
                        disabled={!rows.length}
                        onClick={() =>
                          exportCsv(
                            activeTab,
                            activeTab === 'orders'
                              ? [
                                  [
                                    'Reference',
                                    'Model',
                                    'Quantity',
                                    'Status',
                                    'Created',
                                  ],
                                  ...filteredOrders.map((r) => [
                                    r.id,
                                    r.model,
                                    r.quantity,
                                    r.status,
                                    r.createdAt,
                                  ]),
                                ]
                              : [
                                  ['Reference', 'Subject', 'Status', 'Created'],
                                  ...filteredTickets.map((r) => [
                                    r.id,
                                    r.subject,
                                    r.status,
                                    r.createdAt,
                                  ]),
                                ],
                          )
                        }
                      >
                        Export CSV
                      </button>
                      {activeTab === 'tickets' && (
                        <button
                          className="btn btn-primary"
                          onClick={() => setFormOpen(!formOpen)}
                        >
                          {formOpen ? 'Close form' : 'New ticket'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 'catalog' &&
                  (filteredModels.length ? (
                    <div className="model-grid">
                      {filteredModels.map((model) => (
                        <ModelCard key={model.slug} model={model} />
                      ))}
                    </div>
                  ) : (
                    <Empty text="No models match this view." />
                  ))}
                {activeTab === 'orders' &&
                  (filteredOrders.length ? (
                    <div className="ops-table-wrap">
                      <table className="ops-table">
                        <thead>
                          <tr>
                            <th>Model / reference</th>
                            <th>Quantity</th>
                            <th>Status</th>
                            <th>Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders
                            .slice((currentPage - 1) * 25, currentPage * 25)
                            .map((r) => (
                              <tr key={r.id}>
                                <td>
                                  <strong>{r.model}</strong>
                                  <p className="workspace-muted">
                                    Ref {r.id.slice(0, 8)}
                                  </p>
                                </td>
                                <td className="ops-num">{r.quantity}</td>
                                <td>
                                  <WorkspaceStatus status={r.status} />
                                </td>
                                <td>{displayDate(r.createdAt)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty text="No orders match this view." />
                  ))}
                {activeTab === 'resources' &&
                  (filteredResources.length ? (
                    <div className="resource-list">
                      {filteredResources.map((r) => (
                        <a key={r.id} href={r.url} target="_blank" rel="noreferrer">
                          <strong>{r.title} ↗</strong>
                          <small>
                            Updated {displayDate(r.createdAt)} · Opens in a new tab
                          </small>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <Empty text="No resources match this view." />
                  ))}
                {activeTab === 'announcements' &&
                  (filteredUpdates.length ? (
                    <div className="announcement-feed">
                      {filteredUpdates.map((r) => (
                        <article key={r.id}>
                          <h3>{r.title}</h3>
                          <p>{r.body}</p>
                          <small>{displayDate(r.publishedAt)}</small>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <Empty text="No updates match this view." />
                  ))}
                {activeTab === 'tickets' && (
                  <>
                    {formOpen && (
                      <form
                        className="simple-form"
                        onSubmit={(e) => {
                          e.preventDefault()
                          void submitTicket()
                        }}
                      >
                        <label>
                          Subject
                          <input
                            required
                            minLength={4}
                            maxLength={120}
                            value={ticket.subject}
                            onChange={(e) =>
                              setTicket({ ...ticket, subject: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          Details
                          <textarea
                            required
                            minLength={10}
                            maxLength={2000}
                            rows={5}
                            placeholder="Describe the issue and include an order reference if relevant."
                            value={ticket.detail}
                            onChange={(e) =>
                              setTicket({ ...ticket, detail: e.target.value })
                            }
                          />
                        </label>
                        <button className="btn btn-primary" disabled={submitting}>
                          {submitting ? 'Submitting…' : 'Submit ticket'}
                        </button>
                        {ticketError && (
                          <p role="alert" className="content-error">
                            {ticketError}
                          </p>
                        )}
                      </form>
                    )}
                    {filteredTickets.length ? (
                      <div className="ops-table-wrap">
                        <table className="ops-table">
                          <thead>
                            <tr>
                              <th>Subject / reference</th>
                              <th>Status</th>
                              <th>Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTickets
                              .slice((currentPage - 1) * 25, currentPage * 25)
                              .map((r) => (
                                <tr key={r.id}>
                                  <td>
                                    <strong>{r.subject}</strong>
                                    <p className="workspace-muted">
                                      Ref {r.id.slice(0, 8)}
                                    </p>
                                    {r.detail && (
                                      <details className="workspace-record-detail">
                                        <summary>View details</summary>
                                        <p>{r.detail}</p>
                                      </details>
                                    )}
                                  </td>
                                  <td>
                                    <WorkspaceStatus status={r.status} />
                                  </td>
                                  <td>{displayDate(r.createdAt)}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <Empty text="No tickets match this view." />
                    )}
                  </>
                )}
                {['orders', 'tickets'].includes(activeTab) && (
                  <nav className="workspace-data-tools" aria-label="Record pages">
                    <small>
                      {rows.length} records · Page {currentPage} of {pageCount}
                    </small>
                    {pageCount > 1 && (
                      <div className="workspace-actions">
                        <button
                          className="ops-btn"
                          disabled={currentPage === 1}
                          onClick={() => setPage(currentPage - 1)}
                        >
                          Previous
                        </button>
                        <button
                          className="ops-btn"
                          disabled={currentPage === pageCount}
                          onClick={() => setPage(currentPage + 1)}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </nav>
                )}
              </article>
            )}
          </section>
        )}
      </main>
    </>
  )
}
