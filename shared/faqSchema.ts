import { z } from 'zod'
import {
  FAQ_AUDIENCES,
  FAQ_CTAS,
  FAQ_LIMITS,
  SUPPORT_LANGUAGES,
  SUPPORT_REASONS,
  SUPPORT_STATUSES,
} from './faqConstants.js'

const PHONE_ALLOWED = /^[0-9+\-()\s]+$/

export const faqMatchSchema = z.object({
  query: z
    .string()
    .trim()
    .min(FAQ_LIMITS.query.min, 'Enter a question.')
    .max(
      FAQ_LIMITS.query.max,
      `Keep questions to ${FAQ_LIMITS.query.max} characters or fewer.`,
    ),
})

export const supportQuerySchema = z
  .object({
    question: z
      .string()
      .trim()
      .min(FAQ_LIMITS.query.min, 'Enter the question you asked.')
      .max(FAQ_LIMITS.query.max),
    name: z
      .string()
      .trim()
      .min(FAQ_LIMITS.name.min, 'Enter your name.')
      .max(FAQ_LIMITS.name.max),
    phone: z.preprocess(
      (value) =>
        typeof value === 'string' && value.trim() === '' ? undefined : value,
      z
        .string()
        .trim()
        .max(FAQ_LIMITS.phone.max)
        .regex(PHONE_ALLOWED, 'Phone number contains unsupported characters.')
        .optional(),
    ),
    email: z.preprocess(
      (value) =>
        typeof value === 'string' && value.trim() === '' ? undefined : value,
      z.string().trim().toLowerCase().max(FAQ_LIMITS.email.max).optional(),
    ),
    preferredLanguage: z.enum(SUPPORT_LANGUAGES).default('english'),
    reason: z.enum(SUPPORT_REASONS),
    consent: z.boolean().refine((value) => value === true, {
      message: 'Confirm Amptron may use these details to follow up.',
    }),
  })
  .superRefine((value, ctx) => {
    const phone = value.phone?.trim() ?? ''
    const email = value.email?.trim() ?? ''
    const phoneDigits = phone.replace(/\D/g, '')
    const hasPhone = phoneDigits.length >= FAQ_LIMITS.phone.min
    const emailOk = z.email().safeParse(email).success
    if (!hasPhone && !emailOk) {
      ctx.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'Enter a mobile number or a valid email.',
      })
    }
  })
  .transform((value) => {
    const phone = value.phone?.trim() ?? ''
    const email = value.email?.trim() ?? ''
    return {
      question: value.question,
      name: value.name,
      phone: phone.replace(/\D/g, '').length >= FAQ_LIMITS.phone.min ? phone : null,
      email: email === '' ? null : email,
      preferredLanguage: value.preferredLanguage,
      reason: value.reason,
    }
  })

export const faqWriteSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(FAQ_LIMITS.slug.min)
    .max(FAQ_LIMITS.slug.max)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase slug like storm-range.'),
  question: z
    .string()
    .trim()
    .min(FAQ_LIMITS.question.min)
    .max(FAQ_LIMITS.question.max),
  answer: z.string().trim().min(FAQ_LIMITS.answer.min).max(FAQ_LIMITS.answer.max),
  audience: z.enum(FAQ_AUDIENCES).default('both'),
  category: z.string().trim().min(2).max(40).default('general'),
  aliases: z
    .array(z.string().trim().min(2).max(FAQ_LIMITS.aliases.itemMax))
    .max(FAQ_LIMITS.aliases.max)
    .default([]),
  cta: z.enum(FAQ_CTAS).nullable().default(null),
  isActive: z.boolean().default(true),
})

export const faqPatchSchema = faqWriteSchema.partial()

export const supportStatusSchema = z.object({
  status: z.enum(SUPPORT_STATUSES),
  notes: z.string().trim().max(FAQ_LIMITS.notes.max).optional(),
})

export type FaqMatchInput = z.infer<typeof faqMatchSchema>
export type SupportQueryInput = z.infer<typeof supportQuerySchema>
export type FaqWriteInput = z.infer<typeof faqWriteSchema>
export type FaqPatchInput = z.infer<typeof faqPatchSchema>
