import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Seo from '../components/Seo'
import { useAuth } from '../lib/auth'
import {
  createSupportTicket,
  fetchPortalAnnouncements,
  fetchPortalOrders,
  fetchPortalProfile,
  fetchPortalResources,
  fetchPortalSummary,
  fetchPortalTickets,
  type DealerAnnouncement,
  type DealerOrder,
  type DealerResource,
  type DealerTicket,
  type PortalProfile,
  type PortalSummary,
} from '../lib/portalApi'
import { getUserEmail } from '../lib/supabase'

type DealerTab = 'overview' | 'orders' | 'resources' | 'announcements' | 'tickets'

export default function PortalPage() {
  const { session, ready } = useAuth()
  const [activeTab, setActiveTab] = useState<DealerTab>('overview')
  const [profile, setProfile] = useState<PortalProfile | null>(null)
  const [redirectPath, setRedirectPath] = useState<string | null>(null)
  const [summary, setSummary] = useState<PortalSummary | null>(null)
  const [orders, setOrders] = useState<DealerOrder[]>([])
  const [resources, setResources] = useState<DealerResource[]>([])
  const [announcements, setAnnouncements] = useState<DealerAnnouncement[]>([])
  const [tickets, setTickets] = useState<DealerTicket[]>([])
  const [search, setSearch] = useState('')
  const [ticketFilter, setTicketFilter] = useState('all')
  const [ticketFormOpen, setTicketFormOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ticketState, setTicketState] = useState({ subject: '', detail: '' })
  const [loading, setLoading] = useState(true)
  const [ticketNotice, setTicketNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    Promise.resolve()
      .then(async () => {
        const profilePayload = await fetchPortalProfile()
        setProfile(profilePayload)
        if (profilePayload.role === 'admin') {
          setRedirectPath('/admin')
          return
        }
        const [
          summaryPayload,
          ordersPayload,
          resourcesPayload,
          announcementsPayload,
          ticketsPayload,
        ] = await Promise.all([
          fetchPortalSummary(),
          fetchPortalOrders(),
          fetchPortalResources(),
          fetchPortalAnnouncements(),
          fetchPortalTickets(),
        ])
        setSummary(summaryPayload)
        setOrders(ordersPayload.orders)
        setResources(resourcesPayload.resources)
        setAnnouncements(announcementsPayload.announcements)
        setTickets(ticketsPayload.tickets)
      })
      .catch((fetchError) =>
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Could not load portal data.',
        ),
      )
      .finally(() => setLoading(false))
  }, [session])

  if (!ready) return null
  if (!session) {
    return <Navigate to="/portal/login?next=/portal" replace />
  }
  if (redirectPath) {
    return <Navigate to={redirectPath} replace />
  }

  const submitTicket = async () => {
    setTicketNotice(null)
    try {
      const result = await createSupportTicket(ticketState)
      setTicketNotice(result.message)
      setTicketState({ subject: '', detail: '' })
      setTicketFormOpen(false)
      const [summaryPayload, ticketsPayload] = await Promise.all([
        fetchPortalSummary(),
        fetchPortalTickets(),
      ])
      setSummary(summaryPayload)
      setTickets(ticketsPayload.tickets)
    } catch (ticketError) {
      setTicketNotice(
        ticketError instanceof Error
          ? ticketError.message
          : 'Could not submit ticket.',
      )
    }
  }

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return orders
    return orders.filter(
      (order) =>
        order.model.toLowerCase().includes(term) ||
        order.status.toLowerCase().includes(term),
    )
  }, [orders, search])

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
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.body.toLowerCase().includes(term),
    )
  }, [announcements, search])

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const statusMatch = ticketFilter === 'all' || ticket.status === ticketFilter
      const term = search.trim().toLowerCase()
      const searchMatch =
        term.length === 0 ||
        ticket.subject.toLowerCase().includes(term) ||
        ticket.status.toLowerCase().includes(term)
      return statusMatch && searchMatch
    })
  }, [ticketFilter, tickets, search])

  return (
    <>
      <Seo
        title="Amptron Dealer Portal"
        description="Manage orders, support tickets, resources, and announcements in Amptron's dealer portal."
        path="/portal"
      />
      <main id="main" className="content-page">
        <section className="content-hero">
          <p className="content-eyebrow">Dealer Dashboard</p>
          <h1>{summary?.accountName ?? 'Dealer Account'}</h1>
          <p>
            Signed in as {profile?.email ?? getUserEmail(session)}. Territory:{' '}
            {summary?.territory ?? profile?.territory ?? 'Loading...'}
          </p>
        </section>

        <section className="portal-toolbar">
          <div className="portal-tabs">
            {(
              [
                'overview',
                'orders',
                'resources',
                'announcements',
                'tickets',
              ] as DealerTab[]
            ).map((tab) => (
              <button
                type="button"
                key={tab}
                className={activeTab === tab ? 'is-active' : ''}
                onClick={() => setActiveTab(tab)}
              >
                {tab[0]?.toUpperCase()}
                {tab.slice(1)}
              </button>
            ))}
          </div>
          <input
            className="portal-search"
            placeholder="Search models, resources, announcements, tickets..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </section>

        {error ? <p className="content-note content-error">{error}</p> : null}
        {loading ? <p className="content-note">Loading portal summary...</p> : null}

        {!loading && summary && activeTab === 'overview' ? (
          <>
            <section className="kpi-grid">
              {summary.kpis.map((kpi) => (
                <article className="kpi-card" key={kpi.label}>
                  <strong>{kpi.value}</strong>
                  <span>{kpi.label}</span>
                </article>
              ))}
            </section>
            <section className="detail-columns">
              <article className="detail-panel">
                <h2>Recent Order Pipeline</h2>
                {orders.slice(0, 6).map((order) => (
                  <p key={order.id}>
                    <strong>{order.model}</strong> x{order.quantity} -{' '}
                    {order.status}
                  </p>
                ))}
              </article>
              <article className="detail-panel">
                <h2>Open Support Tickets</h2>
                {tickets
                  .filter((ticket) => ticket.status !== 'closed')
                  .slice(0, 6)
                  .map((ticket) => (
                    <p key={ticket.id}>
                      <strong>{ticket.subject}</strong> - {ticket.status}
                    </p>
                  ))}
              </article>
            </section>
          </>
        ) : null}

        {!loading && activeTab === 'orders' ? (
          <section className="detail-panel">
            <h2>Orders</h2>
            <div className="table-grid table-grid--orders">
              <div className="table-head">
                <span>Model</span>
                <span>Qty</span>
                <span>Status</span>
                <span>Created</span>
              </div>
              {filteredOrders.map((order) => (
                <div key={order.id}>
                  <span>{order.model}</span>
                  <span>{order.quantity}</span>
                  <span>{order.status}</span>
                  <span>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : '-'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && activeTab === 'resources' ? (
          <section className="detail-panel">
            <h2>Marketing and Price Resources</h2>
            <div className="resource-list">
              {filteredResources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <strong>{resource.title}</strong>
                  <small>
                    Updated{' '}
                    {resource.createdAt
                      ? new Date(resource.createdAt).toLocaleDateString()
                      : 'recently'}
                  </small>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && activeTab === 'announcements' ? (
          <section className="detail-panel">
            <h2>Announcements</h2>
            <div className="announcement-feed">
              {filteredAnnouncements.map((item) => (
                <article key={item.id}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <small>{new Date(item.publishedAt).toLocaleDateString()}</small>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && activeTab === 'tickets' ? (
          <section className="detail-panel">
            <div className="panel-head">
              <h2>Support Tickets</h2>
              <div className="panel-actions">
                <select
                  value={ticketFilter}
                  onChange={(event) => setTicketFilter(event.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => setTicketFormOpen((open) => !open)}
                >
                  {ticketFormOpen ? 'Hide Form' : 'Raise Ticket'}
                </button>
              </div>
            </div>

            {ticketFormOpen ? (
              <div className="simple-form">
                <label>
                  Subject
                  <input
                    value={ticketState.subject}
                    onChange={(event) =>
                      setTicketState((previous) => ({
                        ...previous,
                        subject: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Detail
                  <textarea
                    value={ticketState.detail}
                    onChange={(event) =>
                      setTicketState((previous) => ({
                        ...previous,
                        detail: event.target.value,
                      }))
                    }
                  />
                </label>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={submitTicket}
                >
                  Submit Ticket
                </button>
                {ticketNotice ? (
                  <p className="content-note">{ticketNotice}</p>
                ) : null}
              </div>
            ) : null}

            <div className="table-grid">
              <div className="table-head">
                <span>Subject</span>
                <span>Status</span>
                <span>Created</span>
              </div>
              {filteredTickets.map((ticket) => (
                <div key={ticket.id}>
                  <span>{ticket.subject}</span>
                  <span>{ticket.status}</span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <p className="content-note">
          Need internal controls? Managers can review application and dealer records
          in <Link to="/admin">Admin Console</Link>.
        </p>
      </main>
    </>
  )
}
