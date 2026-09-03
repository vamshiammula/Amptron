import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  APPLICATION_LIMITS,
  applicationSchema,
  toFieldErrors,
  type ApplicationField,
  type ApplicationInput,
  type FieldErrors,
} from '@shared/applicationSchema'
import { HEADQUARTERS } from '../data/headquarters'
import { ApiError, submitApplication } from '../lib/api'
import { mapsSearchUrl } from '../lib/maps'
import mapPin from '../assets/icons/map-pin-light.svg'
import phone from '../assets/icons/phone.svg'
import mail from '../assets/icons/mail.svg'
import LocationMap from './LocationMap'

const EMPTY_FORM: ApplicationInput = {
  fullName: '',
  email: '',
  phone: '',
  city: '',
  profile: '',
}

const BUY_PROFILE_PREFIX = 'Direct purchase or test-ride. '
const RIDE_PROFILE_PREFIX = 'Test ride request. '

type Status = 'idle' | 'submitting' | 'success'
export type InquiryKind = 'buy' | 'testRide' | 'stock'
type FieldElement = HTMLInputElement | HTMLTextAreaElement

const COPY: Record<
  InquiryKind,
  {
    headingId: string
    title: string
    lead: string
    emailLabel: string
    emailPlaceholder: string
    nameLabel: string
    phoneLabel: string
    cityLabel: string
    cityPlaceholder: string
    profileLabel: string
    profilePlaceholder: string
    submit: string
    sending: string
    reset: string
  }
> = {
  buy: {
    headingId: 'buy-heading',
    title: 'Buy Amptron',
    lead: 'Book a scooter or a test ride from us. Same certified machine if you prefer a partner showroom instead.',
    emailLabel: 'Email',
    emailPlaceholder: 'you@email.com',
    nameLabel: 'Your Name',
    phoneLabel: 'Mobile Number',
    cityLabel: 'City',
    cityPlaceholder: 'e.g. Pune, Maharashtra',
    profileLabel: 'What would you like to buy or book?',
    profilePlaceholder:
      'Tell us the model (Volt, Storm, or Cruise) and whether you want to buy or book a test ride...',
    submit: 'Request to Buy',
    sending: 'Sending your request…',
    reset: 'Send another request',
  },
  stock: {
    headingId: 'stock-heading',
    title: 'Stock Amptron',
    lead: 'Submit your showroom profile. Our network team will review your application and respond within 2 business days.',
    emailLabel: 'Business Email',
    emailPlaceholder: 'name@company.com',
    nameLabel: 'Full Name',
    phoneLabel: 'Mobile / WhatsApp',
    cityLabel: 'City & State',
    cityPlaceholder: 'e.g. Pune, Maharashtra',
    profileLabel: 'Brief Showroom Experience & Profile',
    profilePlaceholder:
      'Tell us which EV brands you already sell and your current showroom footprint...',
    submit: 'Submit B2B Application',
    sending: 'Sending your application…',
    reset: 'Submit another application',
  },
  testRide: {
    headingId: 'ride-heading',
    title: 'Book a Test Ride',
    lead: 'Tell us the model (Volt, Storm, or Cruise) and your city. We will confirm a slot, or point you to a partner showroom.',
    emailLabel: 'Email',
    emailPlaceholder: 'you@email.com',
    nameLabel: 'Your Name',
    phoneLabel: 'Mobile Number',
    cityLabel: 'City',
    cityPlaceholder: 'e.g. Pune, Maharashtra',
    profileLabel: 'Which model, and when can you ride?',
    profilePlaceholder: 'Amptron Storm this Saturday morning, around Sector 18...',
    submit: 'Book a Test Ride',
    sending: 'Sending your request…',
    reset: 'Send another request',
  },
}

function describedBy(inputId: string, error?: string): string | undefined {
  return error ? `${inputId}-error` : undefined
}

function fieldId(kind: InquiryKind, field: ApplicationField): string {
  if (kind === 'stock') return field
  if (kind === 'testRide') return `ride-${field}`
  return `buy-${field}`
}

export function InquiryForm({
  kind,
  headingLevel = 'h2',
}: Readonly<{ kind: InquiryKind; headingLevel?: 'h2' | 'h3' }>) {
  const copy = COPY[kind]
  const id = (field: ApplicationField) => fieldId(kind, field)
  const Heading = headingLevel

  const [values, setValues] = useState<ApplicationInput>(EMPTY_FORM)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [receipt, setReceipt] = useState<string | null>(null)

  const fieldRefs = useRef<Partial<Record<ApplicationField, FieldElement | null>>>(
    {},
  )

  const setField = (field: ApplicationField, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }))
    setErrors((previous) => {
      if (!previous[field]) return previous
      const next = { ...previous }
      delete next[field]
      return next
    })
  }

  const focusFirstError = (fieldErrors: FieldErrors) => {
    const first = (Object.keys(fieldErrors) as ApplicationField[])[0]
    if (first) fieldRefs.current[first]?.focus()
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status === 'submitting') return

    setFormError(null)

    const parsed = applicationSchema.safeParse(values)
    if (!parsed.success) {
      const fieldErrors = toFieldErrors(parsed.error)
      setErrors(fieldErrors)
      focusFirstError(fieldErrors)
      return
    }

    const prefix =
      kind === 'buy'
        ? BUY_PROFILE_PREFIX
        : kind === 'testRide'
          ? RIDE_PROFILE_PREFIX
          : ''
    const payload: ApplicationInput = prefix
      ? {
          ...parsed.data,
          profile: `${prefix}${parsed.data.profile}`.slice(
            0,
            APPLICATION_LIMITS.profile.max,
          ),
        }
      : parsed.data

    setErrors({})
    setStatus('submitting')

    try {
      const result = await submitApplication(payload)
      setReceipt(result.message)
      setStatus('success')
      setValues(EMPTY_FORM)
    } catch (error) {
      setStatus('idle')

      if (error instanceof ApiError) {
        if (Object.keys(error.fieldErrors).length > 0) {
          setErrors(error.fieldErrors)
          focusFirstError(error.fieldErrors)
          if (error.status !== 422) setFormError(error.message)
          return
        }
        setFormError(error.message)
        return
      }

      setFormError(
        'Something went wrong. Please try again, or email dealer-relations@amptron.co.in.',
      )
    }
  }

  const submitting = status === 'submitting'

  return (
    <div className="contact-form">
      <Heading id={copy.headingId}>{copy.title}</Heading>
      <p className="contact-lead">{copy.lead}</p>

      {status === 'success' ? (
        <output className="form-success">
          <p>{receipt}</p>
          <button
            className="btn btn-ghost form-success-action"
            type="button"
            onClick={() => {
              setStatus('idle')
              setReceipt(null)
            }}
          >
            {copy.reset}
          </button>
        </output>
      ) : (
        <form className="form" onSubmit={onSubmit} noValidate>
          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}

          <div className="form-row">
            <div className="field">
              <label htmlFor={id('fullName')}>{copy.nameLabel}</label>
              <input
                id={id('fullName')}
                name={`${kind}-fullName`}
                autoComplete="name"
                placeholder="Enter your name"
                maxLength={APPLICATION_LIMITS.fullName.max}
                value={values.fullName}
                onChange={(event) => setField('fullName', event.target.value)}
                ref={(element) => {
                  fieldRefs.current.fullName = element
                }}
                aria-invalid={errors.fullName ? true : undefined}
                aria-describedby={describedBy(id('fullName'), errors.fullName)}
              />
              {errors.fullName && (
                <p className="field-error" id={`${id('fullName')}-error`}>
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor={id('email')}>{copy.emailLabel}</label>
              <input
                id={id('email')}
                name={`${kind}-email`}
                type="email"
                autoComplete="email"
                placeholder={copy.emailPlaceholder}
                maxLength={APPLICATION_LIMITS.email.max}
                value={values.email}
                onChange={(event) => setField('email', event.target.value)}
                ref={(element) => {
                  fieldRefs.current.email = element
                }}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={describedBy(id('email'), errors.email)}
              />
              {errors.email && (
                <p className="field-error" id={`${id('email')}-error`}>
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor={id('phone')}>{copy.phoneLabel}</label>
              <input
                id={id('phone')}
                name={`${kind}-phone`}
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                maxLength={APPLICATION_LIMITS.phone.max}
                value={values.phone}
                onChange={(event) => setField('phone', event.target.value)}
                ref={(element) => {
                  fieldRefs.current.phone = element
                }}
                aria-invalid={errors.phone ? true : undefined}
                aria-describedby={describedBy(id('phone'), errors.phone)}
              />
              {errors.phone && (
                <p className="field-error" id={`${id('phone')}-error`}>
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor={id('city')}>{copy.cityLabel}</label>
              <input
                id={id('city')}
                name={`${kind}-city`}
                autoComplete="address-level2"
                placeholder={copy.cityPlaceholder}
                maxLength={APPLICATION_LIMITS.city.max}
                value={values.city}
                onChange={(event) => setField('city', event.target.value)}
                ref={(element) => {
                  fieldRefs.current.city = element
                }}
                aria-invalid={errors.city ? true : undefined}
                aria-describedby={describedBy(id('city'), errors.city)}
              />
              {errors.city && (
                <p className="field-error" id={`${id('city')}-error`}>
                  {errors.city}
                </p>
              )}
            </div>
          </div>

          <div className="field">
            <label htmlFor={id('profile')}>{copy.profileLabel}</label>
            <textarea
              id={id('profile')}
              name={`${kind}-profile`}
              placeholder={copy.profilePlaceholder}
              maxLength={APPLICATION_LIMITS.profile.max}
              value={values.profile}
              onChange={(event) => setField('profile', event.target.value)}
              ref={(element) => {
                fieldRefs.current.profile = element
              }}
              aria-invalid={errors.profile ? true : undefined}
              aria-describedby={describedBy(id('profile'), errors.profile)}
            />
            <div className="field-meta">
              {errors.profile ? (
                <p className="field-error" id={`${id('profile')}-error`}>
                  {errors.profile}
                </p>
              ) : (
                <span />
              )}
              <span className="field-count">
                {values.profile.length}/{APPLICATION_LIMITS.profile.max}
              </span>
            </div>
          </div>

          <button
            className="btn btn-primary btn-full"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : copy.submit}
          </button>
          <p className="form-note" aria-live="polite">
            {submitting
              ? copy.sending
              : 'We reply within 2 business days. Your details are never shared.'}
          </p>
        </form>
      )}
    </div>
  )
}

const TABS: Array<{ kind: InquiryKind; hash: string; label: string }> = [
  { kind: 'buy', hash: 'buy', label: 'Buy Amptron' },
  { kind: 'testRide', hash: 'test-ride', label: 'Book a Test Ride' },
  { kind: 'stock', hash: 'contact', label: 'Stock Amptron' },
]

function tabFromHash(hash: string): InquiryKind {
  const match = TABS.find((tab) => `#${tab.hash}` === hash)
  return match?.kind ?? 'buy'
}

export default function Contact() {
  const [tab, setTab] = useState<InquiryKind>(() =>
    tabFromHash(window.location.hash),
  )

  useEffect(() => {
    const onHash = () => setTab(tabFromHash(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const selectTab = (kind: InquiryKind) => {
    setTab(kind)
    const next = TABS.find((item) => item.kind === kind)
    if (next) window.history.replaceState(null, '', `#${next.hash}`)
  }

  return (
    <section className="contact">
      <div className="contact-forms">
        <div className="contact-tabs" role="tablist" aria-label="Enquiry type">
          {TABS.map((item) => (
            <button
              key={item.kind}
              type="button"
              role="tab"
              aria-selected={tab === item.kind}
              onClick={() => selectTab(item.kind)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {TABS.map((item) => (
          <section
            key={item.kind}
            id={item.hash}
            role="tabpanel"
            hidden={tab !== item.kind}
            aria-labelledby={COPY[item.kind].headingId}
          >
            {tab === item.kind ? <InquiryForm kind={item.kind} /> : null}
          </section>
        ))}
      </div>

      <aside className="hq">
        <div>
          <h3>Corporate Headquarters</h3>
          <div className="hq-list">
            <div className="hq-item">
              <img src={mapPin} alt="" width={18} height={18} />
              <a
                href={mapsSearchUrl(HEADQUARTERS.mapsQuery)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {HEADQUARTERS.legalName}
                <br />
                {HEADQUARTERS.street}
              </a>
            </div>
            <div className="hq-item">
              <img src={phone} alt="" width={18} height={18} />
              <span>+91 124 556 7890 / 1800-EV-AMPTRON</span>
            </div>
            <div className="hq-item">
              <img src={mail} alt="" width={18} height={18} />
              <a href="mailto:dealer-relations@amptron.co.in">
                dealer-relations@amptron.co.in
              </a>
            </div>
          </div>
          <LocationMap />
        </div>
        <div className="hq-more">
          <p>Need a spec sheet or dealer kit?</p>
          <a className="btn btn-ghost" href="#products">
            Explore the Fleet
          </a>
        </div>
      </aside>
    </section>
  )
}
