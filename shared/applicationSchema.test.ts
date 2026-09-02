import { describe, expect, it } from 'vitest'
import { applicationSchema, toFieldErrors } from './applicationSchema.js'

const valid = {
  fullName: 'Priya Raman',
  email: 'priya@raman-motors.co.in',
  phone: '+91 98765 43210',
  city: 'Pune, Maharashtra',
  profile:
    'We run two multi-brand two-wheeler showrooms in Pune with a combined 14 years of retail experience.',
}

describe('applicationSchema', () => {
  it('accepts a well-formed application', () => {
    const result = applicationSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('trims whitespace and lowercases the email', () => {
    const result = applicationSchema.parse({
      ...valid,
      fullName: '  Priya Raman  ',
      email: '  Priya@Raman-Motors.CO.IN ',
    })

    expect(result.fullName).toBe('Priya Raman')
    expect(result.email).toBe('priya@raman-motors.co.in')
  })

  it('rejects an email without a domain', () => {
    const result = applicationSchema.safeParse({ ...valid, email: 'priya@' })
    expect(result.success).toBe(false)
    expect(toFieldErrors(result.error!).email).toMatch(/valid email/i)
  })

  it('rejects a phone number with too few digits', () => {
    const result = applicationSchema.safeParse({ ...valid, phone: '+91 9876' })
    expect(result.success).toBe(false)
    expect(toFieldErrors(result.error!).phone).toMatch(/valid mobile number/i)
  })

  it('rejects a phone number containing letters', () => {
    const result = applicationSchema.safeParse({
      ...valid,
      phone: '+91 98765 4321x',
    })
    expect(result.success).toBe(false)
    expect(toFieldErrors(result.error!).phone).toMatch(/unsupported characters/i)
  })

  it('requires a profile long enough to be useful', () => {
    const result = applicationSchema.safeParse({ ...valid, profile: 'Too short' })
    expect(result.success).toBe(false)
    expect(toFieldErrors(result.error!).profile).toMatch(/at least 20 characters/i)
  })

  it('reports every empty field at once', () => {
    const result = applicationSchema.safeParse({
      fullName: '',
      email: '',
      phone: '',
      city: '',
      profile: '',
    })

    expect(result.success).toBe(false)
    expect(Object.keys(toFieldErrors(result.error!))).toEqual([
      'fullName',
      'email',
      'phone',
      'city',
      'profile',
    ])
  })

  it('keeps only the first message per field', () => {
    const errors = toFieldErrors({
      issues: [
        { path: ['email'], message: 'first' },
        { path: ['email'], message: 'second' },
      ],
    })

    expect(errors.email).toBe('first')
  })
})
