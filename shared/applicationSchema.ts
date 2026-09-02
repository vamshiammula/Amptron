import { z } from 'zod'

/**
 * Single source of truth for dealer application validation.
 * Imported by the browser form, the Express API, and mirrored by the
 * CHECK constraints on public.dealer_applications in Postgres.
 */
export const APPLICATION_LIMITS = {
  fullName: { min: 2, max: 80 },
  email: { max: 160 },
  phone: { min: 8, max: 20 },
  city: { min: 2, max: 80 },
  profile: { min: 20, max: 2000 },
} as const

const PHONE_ALLOWED = /^[0-9+\-()\s]+$/

export const applicationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(APPLICATION_LIMITS.fullName.min, 'Please enter your full name.')
    .max(
      APPLICATION_LIMITS.fullName.max,
      `Name must be ${APPLICATION_LIMITS.fullName.max} characters or fewer.`,
    ),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(
      APPLICATION_LIMITS.email.max,
      `Email must be ${APPLICATION_LIMITS.email.max} characters or fewer.`,
    )
    .pipe(z.email('Enter a valid email address.')),

  phone: z
    .string()
    .trim()
    .min(
      APPLICATION_LIMITS.phone.min,
      'Enter a valid mobile number with country or area code.',
    )
    .max(
      APPLICATION_LIMITS.phone.max,
      `Phone number must be ${APPLICATION_LIMITS.phone.max} characters or fewer.`,
    )
    .regex(PHONE_ALLOWED, 'Phone number contains unsupported characters.')
    .refine(
      (value) => value.replace(/\D/g, '').length >= 8,
      'Enter a valid mobile number with country or area code.',
    ),

  city: z
    .string()
    .trim()
    .min(APPLICATION_LIMITS.city.min, 'Tell us your city and state.')
    .max(
      APPLICATION_LIMITS.city.max,
      `City must be ${APPLICATION_LIMITS.city.max} characters or fewer.`,
    ),

  profile: z
    .string()
    .trim()
    .min(
      APPLICATION_LIMITS.profile.min,
      `Please share at least ${APPLICATION_LIMITS.profile.min} characters so we can help.`,
    )
    .max(
      APPLICATION_LIMITS.profile.max,
      `Profile must be ${APPLICATION_LIMITS.profile.max} characters or fewer.`,
    ),
})

export type ApplicationInput = z.infer<typeof applicationSchema>
export type ApplicationField = keyof ApplicationInput

export const APPLICATION_FIELDS: readonly ApplicationField[] = [
  'fullName',
  'email',
  'phone',
  'city',
  'profile',
] as const

export type FieldErrors = Partial<Record<ApplicationField, string>>

interface IssueLike {
  path: ReadonlyArray<PropertyKey>
  message: string
}

/** Collapses a Zod error into one message per field, ready for form display. */
export function toFieldErrors(error: {
  issues: ReadonlyArray<IssueLike>
}): FieldErrors {
  const errors: FieldErrors = {}
  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string' && !(field in errors)) {
      errors[field as ApplicationField] = issue.message
    }
  }
  return errors
}
