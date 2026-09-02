import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Seo from '../components/Seo'
import { useAuth } from '../lib/auth'
import { fetchPortalProfile } from '../lib/portalApi'
import { hasSupabaseClient, supabase } from '../lib/supabase'

export default function PortalLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [redirectTo, setRedirectTo] = useState<string | null>(null)
  const { session } = useAuth()
  const location = useLocation()

  const requestedNext = useMemo(
    () => new URLSearchParams(location.search).get('next'),
    [location.search],
  )

  useEffect(() => {
    if (!session) return
    fetchPortalProfile()
      .then((profile) => {
        if (profile.role === 'admin') {
          setRedirectTo(
            requestedNext?.startsWith('/admin') ? requestedNext : '/admin',
          )
          return
        }
        setRedirectTo(
          requestedNext?.startsWith('/portal') ? requestedNext : '/portal',
        )
      })
      .catch(() => setRedirectTo('/portal'))
  }, [requestedNext, session])

  if (session && redirectTo) {
    return <Navigate to={redirectTo} replace />
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) {
      setError(
        'Supabase credentials are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.',
      )
      return
    }
    setError(null)
    setNotice(null)
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)
    if (signInError) setError(signInError.message)
  }

  const sendReset = async () => {
    if (!supabase) return
    if (!email) {
      setError('Enter your work email first to receive a reset link.')
      return
    }
    setError(null)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/portal/login`,
    })
    if (resetError) {
      setError(resetError.message)
      return
    }
    setNotice('Password reset link sent. Please check your inbox.')
  }

  return (
    <>
      <Seo
        title="Amptron Dealer Login"
        description="Access the Amptron dealer support portal for orders, resources, tickets, and announcements."
        path="/portal/login"
      />
      <main id="main" className="content-page narrow-page">
        <section className="content-hero">
          <p className="content-eyebrow">Dealer Portal</p>
          <h1>Sign In</h1>
          <p>
            Login once and we will route you to Dealer Dashboard or Admin Console by
            role.
          </p>
        </section>
        {!hasSupabaseClient ? (
          <p className="content-note content-error">
            Missing Supabase client configuration in environment variables.
          </p>
        ) : null}
        <form className="simple-form" onSubmit={submit}>
          <label>
            Work Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="content-note content-error">{error}</p> : null}
          {notice ? <p className="content-note">{notice}</p> : null}
          <button
            className="btn btn-primary btn-full"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          <button
            className="btn btn-ghost btn-ghost-dark btn-full"
            type="button"
            onClick={sendReset}
          >
            Send Password Reset Link
          </button>
        </form>
      </main>
    </>
  )
}
