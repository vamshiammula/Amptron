import { useEffect, useMemo, useState, type FormEvent } from 'react'
import logo from '../assets/images/logo-light.svg'
import { Navigate, useLocation } from 'react-router-dom'
import Seo from '../components/Seo'
import { useAuth } from '../lib/auth'
import { fetchPortalProfile } from '../lib/portalApi'
import { hasSupabaseClient, supabase } from '../lib/supabase'

export default function PortalLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [redirectTo, setRedirectTo] = useState<string | null>(null)
  const { session } = useAuth()
  const location = useLocation()
  const recovery = new URLSearchParams(location.search).get('recovery') === '1'

  const requestedNext = useMemo(
    () => new URLSearchParams(location.search).get('next'),
    [location.search],
  )

  useEffect(() => {
    if (!session || recovery) return
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
  }, [requestedNext, session, recovery])

  if (session && redirectTo && !recovery) {
    return <Navigate to={redirectTo} replace />
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) {
      setError(
        'Dealer sign-in is temporarily unavailable. Please try again later or contact your Amptron representative.',
      )
      return
    }
    setError(null)
    setNotice(null)
    if (recovery) {
      if (!session) {
        setError('Open the password reset link from your email to continue.')
        return
      }
      if (password.length < 8 || password !== confirmPassword) {
        setError('Use at least 8 characters and make both passwords match.')
        return
      }
      setLoading(true)
      try {
        const { error: failure } = await supabase.auth.updateUser({ password })
        if (failure)
          setError(
            'Could not update your password. Request a new reset link and try again.',
          )
        else {
          setNotice('Password updated. You can return to your workspace.')
          setPassword('')
          setConfirmPassword('')
        }
      } catch {
        setError('We could not connect. Please try again.')
      } finally {
        setLoading(false)
      }
      return
    }
    setLoading(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signInError)
        setError('Sign-in failed. Check your email and password, then try again.')
    } catch {
      setError('We could not connect. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const sendReset = async () => {
    if (!supabase) return
    if (!email) {
      setError('Enter your work email first to receive a reset link.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/portal/login?recovery=1` },
      )
      if (resetError)
        setError('We could not send the reset link. Please try again.')
      else
        setNotice('If an account uses this email, you will receive a reset link.')
    } catch {
      setError('We could not connect. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Seo
        title="Amptron Dealer Login"
        description="Access the Amptron dealer support portal for orders, resources, tickets, and announcements."
        path="/portal/login"
      />
      <main id="main" className="login-layout">
        <aside className="login-story">
          <img src={logo} alt="Amptron" />
          <div>
            <h2>
              Your business.
              <br />
              Moving forward.
            </h2>
            <p>
              Models, orders and support. One connected workspace for the Amptron
              network.
            </p>
          </div>
          <p>Dealer &amp; admin access</p>
        </aside>
        <div className="login-form-panel">
          <section className="content-hero">
            <p className="content-eyebrow">Partner workspace</p>
            <h1>{recovery ? 'Set a new password' : 'Sign In'}</h1>
            <p>Access your orders, resources, and support in one place.</p>
          </section>
          {!hasSupabaseClient ? (
            <p className="content-note content-error">
              Dealer sign-in is temporarily unavailable. Please contact your Amptron
              representative for help.
            </p>
          ) : null}
          <form className="simple-form" onSubmit={submit}>
            {!recovery && (
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
            )}
            <label>
              {recovery ? 'New password' : 'Password'}
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={recovery ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {recovery && (
              <label>
                Confirm password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </label>
            )}
            <button
              type="button"
              className="login-password-toggle"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? 'Hide password' : 'Show password'}
            </button>
            {error ? (
              <p className="content-note content-error" role="alert">
                {error}
              </p>
            ) : null}
            {notice ? <p className="content-note">{notice}</p> : null}
            <button
              className="btn btn-primary btn-full"
              type="submit"
              disabled={loading || !hasSupabaseClient}
            >
              {loading ? 'Please wait…' : recovery ? 'Update password' : 'Sign In'}
            </button>
            {!recovery && (
              <button
                className="btn btn-ghost btn-ghost-dark btn-full"
                type="button"
                onClick={sendReset}
                disabled={loading || !hasSupabaseClient}
              >
                Send Password Reset Link
              </button>
            )}
            {recovery && (
              <a className="btn btn-ghost-dark" href="/portal">
                Return to workspace
              </a>
            )}
          </form>
        </div>
      </main>
    </>
  )
}
