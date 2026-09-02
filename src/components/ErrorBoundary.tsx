import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Last line of defence: a render error anywhere in the tree would otherwise
 * leave visitors on a blank page with no way to recover.
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Intentionally silent in production UI.
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="app-error" role="alert">
        <h1>Something went wrong</h1>
        <p>
          We hit an unexpected problem loading this page. Reloading usually fixes
          it. If it keeps happening, email{' '}
          <a href="mailto:dealer-relations@amptron.co.in">
            dealer-relations@amptron.co.in
          </a>
          .
        </p>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => window.location.reload()}
        >
          Reload page
        </button>
      </div>
    )
  }
}
