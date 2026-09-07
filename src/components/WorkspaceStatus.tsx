import { displayStatus } from '../lib/workspace'
export default function WorkspaceStatus({ status }: { status: string }) {
  const tone = ['approved', 'delivered', 'closed', 'resolved'].includes(status)
    ? 'success'
    : ['rejected', 'cancelled'].includes(status)
      ? 'danger'
      : ['new', 'open', 'pending'].includes(status)
        ? 'warning'
        : ['contacted', 'in_progress', 'in_dispatch', 'shipped'].includes(status)
          ? 'info'
          : 'neutral'
  return (
    <span className={`ops-badge ops-badge--${tone}`}>{displayStatus(status)}</span>
  )
}
