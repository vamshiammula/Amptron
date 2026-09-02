import type { ApplicationInput, FieldErrors } from '@shared/applicationSchema'

const REQUEST_TIMEOUT_MS = 15_000

const GENERIC_FAILURE =
  "We couldn't submit your application. Please check your connection and try again."

/** Empty by default: the API is served from the same origin (proxied in dev). */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export interface ApplicationReceipt {
  id: string
  receivedAt: string
  message: string
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldErrors

  constructor(
    message: string,
    options: { status: number; fieldErrors?: FieldErrors },
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status
    this.fieldErrors = options.fieldErrors ?? {}
  }
}

interface ApiPayload {
  message?: unknown
  fieldErrors?: unknown
  id?: unknown
  receivedAt?: unknown
}

function asPayload(value: unknown): ApiPayload {
  return typeof value === 'object' && value !== null ? (value as ApiPayload) : {}
}

function asMessage(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() !== '' ? value : fallback
}

function asFieldErrors(value: unknown): FieldErrors {
  if (typeof value !== 'object' || value === null) return {}
  const result: Record<string, string> = {}
  for (const [key, message] of Object.entries(value)) {
    if (typeof message === 'string') result[key] = message
  }
  return result as FieldErrors
}

export async function submitApplication(
  input: ApplicationInput,
): Promise<ApplicationReceipt> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch {
    // Network failure, DNS failure, or timeout: never surfaces a usable status.
    throw new ApiError(GENERIC_FAILURE, { status: 0 })
  }

  const payload = asPayload(await response.json().catch(() => null))

  if (!response.ok) {
    throw new ApiError(asMessage(payload.message, GENERIC_FAILURE), {
      status: response.status,
      fieldErrors: asFieldErrors(payload.fieldErrors),
    })
  }

  return {
    id: asMessage(payload.id, ''),
    receivedAt: asMessage(payload.receivedAt, ''),
    message: asMessage(
      payload.message,
      'Application received. Our team will contact you within 2 business days.',
    ),
  }
}
