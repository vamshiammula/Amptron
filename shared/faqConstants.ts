export const FAQ_LIMITS = {
  query: { min: 1, max: 280 },
  question: { min: 8, max: 240 },
  answer: { min: 12, max: 2000 },
  slug: { min: 2, max: 80 },
  name: { min: 2, max: 80 },
  phone: { min: 8, max: 20 },
  email: { max: 160 },
  notes: { max: 2000 },
  aliases: { max: 12, itemMax: 80 },
} as const

export const FAQ_AUDIENCES = ['rider', 'dealer', 'both'] as const
export const FAQ_CTAS = ['buy', 'test_ride', 'showroom', 'stock'] as const
export const SUPPORT_REASONS = ['unmatched', 'quota'] as const
export const SUPPORT_STATUSES = ['new', 'contacted', 'resolved'] as const
export const SUPPORT_LANGUAGES = ['english', 'hindi', 'telugu', 'hinglish'] as const

export const QUOTA_UNAVAILABLE_MESSAGE =
  'Agents are not available right now. Leave your question and contact details. Amptron will follow up.'

export const SMALLTALK_REPLIES = {
  greeting:
    'Hello. Ask about Amptron Volt, Storm, or Cruise: range, charging, test rides, or stocking. Answers come from Amptron’s published FAQs.',
  thanks:
    'You are welcome. Ask another question about Amptron scooters, test rides, or stocking whenever you are ready.',
  goodbye:
    'Goodbye. You can buy Amptron from us or find a partner showroom when you are ready.',
  how_are_you:
    'Doing well. Ready to help with Amptron Volt, Storm, and Cruise. What would you like to know?',
} as const

export type FaqAudience = (typeof FAQ_AUDIENCES)[number]
export type FaqCta = (typeof FAQ_CTAS)[number]
export type SupportReason = (typeof SUPPORT_REASONS)[number]
export type SupportStatus = (typeof SUPPORT_STATUSES)[number]
export type SupportLanguage = (typeof SUPPORT_LANGUAGES)[number]
export type SmallTalkIntent = keyof typeof SMALLTALK_REPLIES
