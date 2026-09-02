import {
  SMALLTALK_REPLIES,
  type SmallTalkIntent,
} from '../../../shared/faqConstants.js'

const PRODUCT_KEYWORDS =
  /\b(range|storm|volt|cruise|amptron|warrant|price|cost|dealer|showroom|charge|battery|motor|speed|payload|buy|stock|test\s*ride|scooter|model|km)\b/i

const MAX_CHARS = 48
const MAX_WORDS = 8

interface Phrase {
  intent: SmallTalkIntent
  value: string
  fuzzy: boolean
}

const PHRASES: Phrase[] = [
  // Greetings
  ...[
    'hi',
    'hii',
    'hiii',
    'hello',
    'helloo',
    'hey',
    'heya',
    'hey there',
    'hi there',
    'hello there',
    'good morning',
    'good afternoon',
    'good evening',
    'namaste',
    'namaskar',
    'vanakkam',
    'salaam',
    'yo',
    'hai',
  ].map((value) => ({
    intent: 'greeting' as const,
    value,
    fuzzy: value.length > 3,
  })),
  // Thanks
  ...[
    'thanks',
    'thank you',
    'thank u',
    'thankyou',
    'thx',
    'ty',
    'thanks a lot',
    'thank you so much',
    'dhanyavad',
    'dhanyavaad',
    'shukriya',
    'thanks amptron',
  ].map((value) => ({ intent: 'thanks' as const, value, fuzzy: true })),
  // Goodbye
  ...['bye', 'goodbye', 'good bye', 'see you', 'cya', 'take care'].map((value) => ({
    intent: 'goodbye' as const,
    value,
    fuzzy: value.length > 3,
  })),
  // How are you
  ...[
    'how are you',
    'how r u',
    'how r you',
    'how are u',
    'hows you',
    'how is it going',
    'hows it going',
    "how's it going",
    'whats up',
    "what's up",
    'sup',
    'kaise ho',
    'kaise hain',
    'kya haal hai',
    'ela unnavu',
    'ela unnaru',
    'bagunnara',
    'how do you do',
  ].map((value) => ({ intent: 'how_are_you' as const, value, fuzzy: true })),
]

export function normalizeSmallTalk(input: string): string {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  const curr = Array.from({ length: b.length + 1 }, () => 0)
  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        (prev[j] ?? 0) + 1,
        (curr[j - 1] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost,
      )
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j] ?? 0
  }
  return prev[b.length] ?? b.length
}

function similarity(a: string, b: string): number {
  const max = Math.max(a.length, b.length)
  if (max === 0) return 1
  return 1 - levenshtein(a, b) / max
}

export function matchSmallTalk(query: string): SmallTalkIntent | null {
  const normalized = normalizeSmallTalk(query)
  if (!normalized) return null
  if (normalized.length > MAX_CHARS) return null
  if (normalized.split(' ').length > MAX_WORDS) return null
  if (PRODUCT_KEYWORDS.test(normalized)) return null

  let best: { intent: SmallTalkIntent; score: number } | null = null
  for (const phrase of PHRASES) {
    if (normalized === phrase.value) {
      return phrase.intent
    }
    if (!phrase.fuzzy) continue
    if (Math.abs(normalized.length - phrase.value.length) > 6) continue
    const score = similarity(normalized, phrase.value)
    const threshold = phrase.value.length <= 5 ? 0.86 : 0.8
    if (score >= threshold && (!best || score > best.score)) {
      best = { intent: phrase.intent, score }
    }
  }
  return best?.intent ?? null
}

export function smallTalkReply(intent: SmallTalkIntent): string {
  return SMALLTALK_REPLIES[intent]
}
