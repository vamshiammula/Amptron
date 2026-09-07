import Icon from './ui/Icon'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/images/logo.svg'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function WorkspaceHeader() {
  const { session } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function signOut() {
    setBusy(true)
    setError('')
    try {
      const result = await supabase?.auth.signOut()
      if (result?.error) throw result.error
    } catch {
      setError('Could not sign out. Please try again.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <header className="workspace-header">
      <Link to="/" aria-label="Amptron home">
        <img src={logo} alt="Amptron" />
      </Link>
      <span className="workspace-header-label">Partner workspace</span>
      <nav aria-label="Workspace links">
        <Link to="/">
          View website <Icon name="arrow-right" />
        </Link>
        {session && (
          <button disabled={busy} onClick={() => void signOut()}>
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
        )}
      </nav>
      {error && <p role="alert">{error}</p>}
    </header>
  )
}
