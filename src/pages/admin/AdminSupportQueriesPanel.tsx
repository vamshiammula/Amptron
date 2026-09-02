import { useMemo, useState } from 'react'
import {
  updateAdminSupportQuery,
  type AdminSupportQuery,
} from '../../lib/portalApi'

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const STATUS_FILTERS = ['all', 'new', 'contacted', 'resolved'] as const

function statusTone(status: string) {
  switch (status) {
    case 'resolved':
      return 'success'
    case 'contacted':
      return 'info'
    case 'new':
      return 'warning'
    default:
      return 'neutral'
  }
}

function formatStatus(status: string) {
  return status.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function AdminSupportQueriesPanel({
  queries,
  search,
  busyId,
  onBusy,
  onNotice,
  onError,
  onRefresh,
}: Readonly<{
  queries: AdminSupportQuery[]
  search: string
  busyId: string | null
  onBusy: (id: string | null) => void
  onNotice: (message: string) => void
  onError: (message: string) => void
  onRefresh: () => void
}>) {
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]>('all')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return queries.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (!term) return true
      return (
        row.question.toLowerCase().includes(term) ||
        row.name.toLowerCase().includes(term) ||
        row.reason.toLowerCase().includes(term) ||
        row.status.toLowerCase().includes(term) ||
        (row.email ?? '').toLowerCase().includes(term) ||
        (row.phone ?? '').includes(term)
      )
    })
  }, [queries, search, statusFilter])

  const update = (id: string, status: string) => {
    onBusy(id)
    void updateAdminSupportQuery(id, { status })
      .then((result) => {
        onNotice(result.message)
        onRefresh()
      })
      .catch((error: unknown) =>
        onError(error instanceof Error ? error.message : 'Could not update query.'),
      )
      .finally(() => onBusy(null))
  }

  return (
    <section
      className="ops-panel"
      id="ops-panel-queries"
      role="tabpanel"
      aria-labelledby="ops-tab-queries"
    >
      <div className="ops-panel-head">
        <div>
          <h2>Unanswered questions</h2>
          <p>
            Visitors who did not get a published FAQ, or who asked while agents were
            unavailable.
          </p>
        </div>
        <fieldset className="ops-filters" aria-label="Filter by status">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              className={statusFilter === status ? 'is-active' : undefined}
              aria-pressed={statusFilter === status}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All' : formatStatus(status)}
            </button>
          ))}
        </fieldset>
      </div>
      {filtered.length === 0 ? (
        <div className="ops-empty">
          <p>No visitor questions waiting</p>
          <span>
            Unmatched FAQs and quota overflows appear here with contact details.
          </span>
        </div>
      ) : (
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Question</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Received</th>
                <th className="ops-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td className="ops-person">
                    <strong>{row.name}</strong>
                    {row.phone ? <span>{row.phone}</span> : null}
                    {row.email ? <span>{row.email}</span> : null}
                    <span>{formatStatus(row.preferredLanguage)}</span>
                  </td>
                  <td>
                    <span className="ops-question">{row.question}</span>
                  </td>
                  <td>
                    <span
                      className={`ops-badge ops-badge--${row.reason === 'quota' ? 'warning' : 'info'}`}
                    >
                      {formatStatus(row.reason)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`ops-badge ops-badge--${statusTone(row.status)}`}
                    >
                      {formatStatus(row.status)}
                    </span>
                  </td>
                  <td className="ops-num">
                    {dateTimeFormatter.format(new Date(row.createdAt))}
                  </td>
                  <td className="ops-col-actions">
                    <div className="ops-actions">
                      {row.status !== 'contacted' ? (
                        <button
                          type="button"
                          className="ops-btn"
                          disabled={busyId === row.id}
                          onClick={() => update(row.id, 'contacted')}
                        >
                          {busyId === row.id ? 'Saving…' : 'Mark contacted'}
                        </button>
                      ) : null}
                      {row.status !== 'resolved' ? (
                        <button
                          type="button"
                          className="ops-btn ops-btn--success"
                          disabled={busyId === row.id}
                          onClick={() => update(row.id, 'resolved')}
                        >
                          {busyId === row.id ? 'Saving…' : 'Mark resolved'}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
