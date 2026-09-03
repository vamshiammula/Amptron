import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  FAQ_LIMITS,
  QUOTA_UNAVAILABLE_MESSAGE,
  type FaqCta,
  type SupportLanguage,
  type SupportReason,
} from '@shared/faqConstants'
import { OPEN_CHAT_EVENT } from '../lib/openChat'
import './ChatWidget.css'

type MatchResponse =
  | { matched: true; source: 'smalltalk'; answer: string }
  | {
      matched: true
      source: 'faq'
      answer: string
      faqId: string
      question: string
      cta: FaqCta | null
    }
  | { matched: false; reason: SupportReason; message?: string }

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  cta?: FaqCta | null
}

const HIDDEN_PREFIXES = ['/admin', '/portal']
const SUGGESTIONS_FALLBACK = [
  'What is Amptron Storm?',
  'How do I buy an Amptron scooter?',
  'How can a dealer stock Amptron?',
]

const CTA_COPY: Record<FaqCta, { label: string; to: string }> = {
  buy: { label: 'Buy Amptron', to: '/#buy' },
  test_ride: { label: 'Book a Test Ride', to: '/book-test-ride' },
  showroom: { label: 'Find a Showroom', to: '/dealers/locate' },
  stock: { label: 'Stock Amptron', to: '/#contact' },
}

const EMPTY_CONTACT = {
  name: '',
  phone: '',
  email: '',
  preferredLanguage: 'english' as SupportLanguage,
  consent: false,
}

const NUDGE_SHOW_MS = 4500
const NUDGE_HIDE_MS = 6500
const NUDGE_COLLAPSE_KEY = 'amptron-agent-nudge-collapsed'

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function isCoarsePointer() {
  return Boolean(window.matchMedia?.('(pointer: coarse)')?.matches)
}

function isNarrowViewport() {
  return Boolean(window.matchMedia?.('(max-width: 640px)')?.matches)
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)
}

const COMPOSER_MAX_PX = 96
const QUERY_NEAR_LIMIT = 40

function fitComposer(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_PX)}px`
}

function readNudgeCollapsed() {
  try {
    return sessionStorage.getItem(NUDGE_COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

export default function ChatWidget() {
  const location = useLocation()
  const panelId = useId()
  const titleId = useId()
  const inputId = useId()
  const contactErrorId = useId()
  const contactHintId = useId()
  const openerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const requestIdRef = useRef(0)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pending, setPending] = useState(false)
  const [suggestions, setSuggestions] = useState(SUGGESTIONS_FALLBACK)
  const [collapsed, setCollapsed] = useState(readNudgeCollapsed)
  const [nudge, setNudge] = useState(() => !readNudgeCollapsed())
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Amptron agent here. Ask about Volt, Storm, or Cruise. Answers come from published FAQs.',
    },
  ])
  const [capture, setCapture] = useState<{
    question: string
    reason: SupportReason
  } | null>(null)
  const [contact, setContact] = useState(EMPTY_CONTACT)
  const [contactError, setContactError] = useState<string | null>(null)
  const [contactSent, setContactSent] = useState(false)

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(OPEN_CHAT_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen)
  }, [])

  const hidden = HIDDEN_PREFIXES.some((prefix) =>
    location.pathname.startsWith(prefix),
  )
  const askedOnce = messages.some((message) => message.role === 'user')
  const remainingChars = FAQ_LIMITS.query.max - query.length
  const nearLimit = remainingChars <= QUERY_NEAR_LIMIT

  useEffect(() => {
    if (hidden) return
    let cancelled = false
    void fetch('/api/faq/suggestions')
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { suggestions?: Array<{ question: string }> } | null) => {
        if (cancelled || !payload?.suggestions?.length) return
        setSuggestions(payload.suggestions.map((item) => item.question).slice(0, 3))
      })
      .catch(() => {
        // Keep the local fallback.
      })
    return () => {
      cancelled = true
    }
  }, [hidden])

  useEffect(() => {
    if (!open) return
    if (!isCoarsePointer()) {
      inputRef.current?.focus()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        openerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    if (isNarrowViewport()) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    const log = logRef.current
    if (!log || messages.length === 0) return
    log.scrollTop = log.scrollHeight
  }, [messages])

  useLayoutEffect(() => {
    if (!open || capture) return
    fitComposer(inputRef.current)
  }, [open, capture])

  useEffect(() => {
    if (!capture || isCoarsePointer()) return
    nameRef.current?.focus({ preventScroll: true })
  }, [capture])

  useEffect(() => {
    if (hidden || open || collapsed) return
    if (prefersReducedMotion()) return
    let visible = true
    let timer = 0
    const tick = () => {
      timer = window.setTimeout(
        () => {
          visible = !visible
          setNudge(visible)
          tick()
        },
        visible ? NUDGE_SHOW_MS : NUDGE_HIDE_MS,
      )
    }
    tick()
    return () => window.clearTimeout(timer)
  }, [hidden, open, collapsed])

  if (hidden) return null

  const collapseNudge = () => {
    setCollapsed(true)
    setNudge(false)
    try {
      sessionStorage.setItem(NUDGE_COLLAPSE_KEY, '1')
    } catch {
      // sessionStorage may be blocked.
    }
  }

  const closePanel = () => {
    setOpen(false)
    if (!collapsed) setNudge(true)
    openerRef.current?.focus()
  }

  const togglePanel = () => {
    if (open && !collapsed) setNudge(true)
    setOpen((previous) => !previous)
  }

  const ask = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || pending) return
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setQuery('')
    requestAnimationFrame(() => fitComposer(inputRef.current))
    setCapture(null)
    setContactSent(false)
    setContactError(null)
    setMessages((previous) => [
      ...previous,
      { id: nextId(), role: 'user', text: trimmed },
    ])
    setPending(true)
    try {
      const response = await fetch('/api/faq/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      })
      if (requestId !== requestIdRef.current) return
      const payload = (await response.json()) as MatchResponse & {
        message?: string
      }
      if (!response.ok) {
        setMessages((previous) => [
          ...previous,
          {
            id: nextId(),
            role: 'assistant',
            text:
              payload.message ?? 'We could not answer just then. Please try again.',
          },
        ])
        return
      }
      if (payload.matched) {
        setMessages((previous) => [
          ...previous,
          {
            id: nextId(),
            role: 'assistant',
            text: payload.answer,
            cta: payload.source === 'faq' ? payload.cta : null,
          },
        ])
        return
      }
      const message =
        payload.reason === 'quota'
          ? (payload.message ?? QUOTA_UNAVAILABLE_MESSAGE)
          : 'We do not have a published answer for that yet. Leave your details and Amptron will follow up.'
      setMessages((previous) => [
        ...previous,
        { id: nextId(), role: 'assistant', text: message },
      ])
      setCapture({ question: trimmed, reason: payload.reason })
    } catch {
      if (requestId !== requestIdRef.current) return
      setMessages((previous) => [
        ...previous,
        {
          id: nextId(),
          role: 'assistant',
          text: 'We could not reach Amptron just then. Check your connection and try again.',
        },
      ])
    } finally {
      if (requestId === requestIdRef.current) setPending(false)
    }
  }

  const submitContact = async (event: FormEvent) => {
    event.preventDefault()
    if (!capture || pending) return
    if (!contact.name.trim()) {
      setContactError('Add your name so Amptron knows who to contact.')
      nameRef.current?.focus()
      return
    }
    if (!contact.phone.trim() && !contact.email.trim()) {
      setContactError('Add a mobile number or an email so Amptron can reach you.')
      return
    }
    if (!contact.consent) {
      setContactError('Confirm Amptron may use these details to follow up.')
      return
    }
    setPending(true)
    setContactError(null)
    try {
      const response = await fetch('/api/support-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          question: capture.question,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          preferredLanguage: contact.preferredLanguage,
          reason: capture.reason,
          consent: contact.consent,
        }),
      })
      const payload = (await response.json()) as {
        message?: string
        fieldErrors?: Record<string, string>
      }
      if (!response.ok) {
        setContactError(
          payload.fieldErrors?.email ??
            payload.fieldErrors?.phone ??
            payload.fieldErrors?.name ??
            payload.fieldErrors?.consent ??
            payload.message ??
            'Please check the form and try again.',
        )
        nameRef.current?.focus()
        return
      }
      setContactSent(true)
      setCapture(null)
      setContact(EMPTY_CONTACT)
      setMessages((previous) => [
        ...previous,
        {
          id: nextId(),
          role: 'assistant',
          text:
            payload.message ??
            'Amptron has your question. A teammate will follow up.',
        },
      ])
    } catch {
      setContactError('We could not send your details. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="chatbot" translate="no">
      {open ? (
        <dialog
          className={`chatbot-panel${capture && !contactSent ? ' is-capturing' : ''}`}
          id={panelId}
          open
          aria-labelledby={titleId}
          aria-busy={pending || undefined}
        >
          <header className="chatbot-head">
            <div className="chatbot-identity">
              <AgentMark className="chatbot-avatar" />
              <div className="chatbot-brand">
                <h2 id={titleId}>Amptron agent</h2>
                <p className="chatbot-presence">
                  <span className="chatbot-presence-dot" aria-hidden="true" />
                  Online
                </p>
              </div>
            </div>
            <button
              type="button"
              className="chatbot-close"
              aria-label="Close Amptron agent"
              onClick={closePanel}
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <div className="chatbot-log" ref={logRef} aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chatbot-bubble chatbot-bubble--${message.role}`}
              >
                <p>{message.text}</p>
                {message.cta && CTA_COPY[message.cta] ? (
                  <Link
                    className="chatbot-cta"
                    to={CTA_COPY[message.cta].to}
                    onClick={closePanel}
                  >
                    {CTA_COPY[message.cta].label}
                  </Link>
                ) : null}
              </div>
            ))}
            {pending && !capture ? (
              <output className="chatbot-status">
                <span className="chatbot-typing" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                Looking that up…
              </output>
            ) : null}
          </div>

          {capture && !contactSent ? (
            <form
              className="chatbot-capture"
              onSubmit={(event) => void submitContact(event)}
              noValidate
            >
              <p id={contactHintId}>
                {capture.reason === 'quota'
                  ? QUOTA_UNAVAILABLE_MESSAGE
                  : 'Name, plus a mobile number or email, so Amptron can follow up.'}
              </p>
              <label>
                Name
                <input
                  ref={nameRef}
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={FAQ_LIMITS.name.max}
                  value={contact.name}
                  placeholder="Your name"
                  onChange={(event) =>
                    setContact((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <div className="chatbot-capture-split">
                <label>
                  Mobile
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    maxLength={FAQ_LIMITS.phone.max}
                    value={contact.phone}
                    placeholder="98765 43210"
                    aria-describedby={contactHintId}
                    onChange={(event) =>
                      setContact((previous) => ({
                        ...previous,
                        phone: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    maxLength={FAQ_LIMITS.email.max}
                    value={contact.email}
                    placeholder="you@email.com"
                    aria-describedby={contactHintId}
                    onChange={(event) =>
                      setContact((previous) => ({
                        ...previous,
                        email: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <label className="chatbot-consent">
                <input
                  type="checkbox"
                  checked={contact.consent}
                  onChange={(event) =>
                    setContact((previous) => ({
                      ...previous,
                      consent: event.target.checked,
                    }))
                  }
                />
                Amptron may use these details to follow up.
              </label>
              {contactError ? (
                <p className="chatbot-error" id={contactErrorId} role="alert">
                  {contactError}
                </p>
              ) : null}
              <div className="chatbot-capture-actions">
                <button
                  className="btn btn-primary btn-full"
                  type="submit"
                  disabled={pending}
                >
                  {pending ? 'Sending…' : 'Send to Amptron'}
                </button>
                <button
                  type="button"
                  className="chatbot-skip"
                  onClick={() => {
                    setCapture(null)
                    setContactError(null)
                    if (!isCoarsePointer()) inputRef.current?.focus()
                  }}
                >
                  Ask a different question
                </button>
              </div>
            </form>
          ) : (
            <>
              {!askedOnce ? (
                <ul
                  className="chatbot-suggestions"
                  aria-label="Suggested questions"
                >
                  {suggestions.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => void ask(item)}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <form
                className="chatbot-composer"
                onSubmit={(event) => {
                  event.preventDefault()
                  void ask(query)
                }}
              >
                <label htmlFor={inputId} className="sr-only">
                  Your question
                </label>
                <div className="chatbot-composer-row">
                  <textarea
                    id={inputId}
                    ref={inputRef}
                    rows={1}
                    maxLength={FAQ_LIMITS.query.max}
                    value={query}
                    placeholder="Ask about Amptron"
                    disabled={pending}
                    onChange={(event) => {
                      setQuery(event.target.value)
                      fitComposer(event.currentTarget)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        void ask(query)
                      }
                    }}
                  />
                  <button
                    className="chatbot-send"
                    type="submit"
                    disabled={pending || !query.trim()}
                    aria-label="Send"
                  >
                    <SendMark />
                  </button>
                </div>
                <p
                  className={`chatbot-hint${nearLimit ? ' has-count' : ''}`}
                  aria-live={nearLimit ? 'polite' : undefined}
                >
                  <span className="chatbot-hint-enter">Enter to send</span>
                  {nearLimit ? (
                    <span className="chatbot-char-count">
                      {remainingChars} characters left
                    </span>
                  ) : null}
                </p>
              </form>
            </>
          )}
        </dialog>
      ) : null}

      <div className="chatbot-dock">
        {!open && !collapsed && nudge ? (
          <div className="chatbot-nudge">
            <p className="chatbot-nudge-label">Ask Amptron</p>
            <button
              type="button"
              className="chatbot-nudge-collapse"
              aria-label="Collapse Ask Amptron"
              onClick={collapseNudge}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        ) : null}
        <button
          ref={openerRef}
          type="button"
          className={`chatbot-launcher${open ? ' is-open' : ' is-idle'}`}
          aria-label={open ? 'Close Amptron agent' : 'Ask Amptron'}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={togglePanel}
        >
          {open ? (
            <span className="chatbot-launcher-x" aria-hidden="true">
              ×
            </span>
          ) : (
            <>
              {!collapsed && nudge ? (
                <span className="chatbot-launcher-rings" aria-hidden="true">
                  <span />
                  <span />
                </span>
              ) : null}
              <AgentMark className="chatbot-launcher-mark" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function SendMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12h12M13 6l6 6-6 6"
      />
    </svg>
  )
}

function AgentMark({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      width="48"
      height="48"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="24" fill="var(--navy)" />
      <path
        fill="none"
        stroke="var(--teal)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 30.5c1.6-3.2 4.6-5 8-5s6.4 1.8 8 5"
      />
      <circle
        cx="24"
        cy="20"
        r="5.2"
        fill="none"
        stroke="var(--teal)"
        strokeWidth="2.2"
      />
      <path
        fill="none"
        stroke="var(--teal)"
        strokeWidth="2.2"
        strokeLinecap="round"
        d="M14.5 22.5v-2a9.5 9.5 0 0 1 19 0v2M14.5 22.5h-1.8a2.2 2.2 0 0 0 0 4.4H16M33.5 22.5h1.8a2.2 2.2 0 0 1 0 4.4H32"
      />
    </svg>
  )
}
