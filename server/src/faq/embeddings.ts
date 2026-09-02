export class EmbeddingQuotaError extends Error {
  constructor(message = 'Workers AI daily allocation is exhausted.') {
    super(message)
    this.name = 'EmbeddingQuotaError'
  }
}

export class EmbeddingUnavailableError extends Error {
  constructor(message = 'Embedding service is unavailable.') {
    super(message)
    this.name = 'EmbeddingUnavailableError'
  }
}

export interface EmbeddingsClient {
  embed(texts: string[]): Promise<number[][]>
}

interface CloudflareConfig {
  accountId: string
  apiToken: string
}

const MODEL = '@cf/baai/bge-m3'
const EXPECTED_DIM = 1024

function isQuotaFailure(status: number, body: string): boolean {
  if (status === 429) return true
  return /10,\s*000 neurons|daily free allocation|3036|Account limited/i.test(body)
}

export function createCloudflareEmbeddings(
  config: CloudflareConfig,
): EmbeddingsClient {
  return {
    async embed(texts) {
      if (texts.length === 0) return []
      const url = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/ai/run/${MODEL}`
      let response: Response
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: texts }),
          signal: AbortSignal.timeout(12_000),
        })
      } catch {
        throw new EmbeddingUnavailableError()
      }

      const raw = await response.text()
      if (!response.ok) {
        if (isQuotaFailure(response.status, raw)) {
          throw new EmbeddingQuotaError()
        }
        throw new EmbeddingUnavailableError()
      }

      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        throw new EmbeddingUnavailableError()
      }

      const vectors = extractVectors(parsed)
      if (!vectors || vectors.length !== texts.length) {
        throw new EmbeddingUnavailableError()
      }
      return vectors
    },
  }
}

function extractVectors(payload: unknown): number[][] | null {
  if (typeof payload !== 'object' || payload === null) return null
  const root = payload as { result?: unknown; success?: unknown }
  const result = root.result
  if (typeof result !== 'object' || result === null) return null
  const data = (result as { data?: unknown }).data
  if (!Array.isArray(data) || data.length === 0) return null

  if (typeof data[0] === 'number') {
    const vector = asVector(data)
    return vector ? [vector] : null
  }

  const vectors: number[][] = []
  for (const row of data) {
    const vector = asVector(row)
    if (!vector) return null
    vectors.push(vector)
  }
  return vectors
}

function asVector(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length !== EXPECTED_DIM) return null
  const vector: number[] = []
  for (const item of value) {
    if (typeof item !== 'number' || !Number.isFinite(item)) return null
    vector.push(item)
  }
  return vector
}
