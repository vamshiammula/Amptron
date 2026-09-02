import { randomUUID } from 'node:crypto'
import type { ApplicationInput } from '../../../shared/applicationSchema.js'
import {
  DuplicateApplicationError,
  type ApplicationsRepository,
  type ConnectivityStatus,
  type CreatedApplication,
  type StoredApplication,
  type SubmissionMeta,
} from './repository.js'

/**
 * Stand-in for the Supabase repository used by automated tests and by the
 * Playwright E2E run, so neither needs network access or live credentials.
 */
export class InMemoryApplicationsRepository implements ApplicationsRepository {
  private readonly rows: StoredApplication[] = []

  async create(
    input: ApplicationInput,
    meta: SubmissionMeta,
  ): Promise<CreatedApplication> {
    const exists = this.rows.some(
      (row) => row.email.toLowerCase() === input.email.toLowerCase(),
    )
    if (exists) {
      throw new DuplicateApplicationError()
    }

    const record: StoredApplication = {
      ...input,
      id: randomUUID(),
      status: 'new',
      source: meta.source,
      createdAt: new Date().toISOString(),
    }
    this.rows.unshift(record)

    return { id: record.id, receivedAt: record.createdAt }
  }

  async list({ limit = 50 }: { limit?: number } = {}): Promise<
    StoredApplication[]
  > {
    return this.rows.slice(0, limit)
  }

  async updateStatus(
    id: string,
    status: StoredApplication['status'],
  ): Promise<StoredApplication> {
    const index = this.rows.findIndex((row) => row.id === id)
    if (index < 0) {
      throw new Error('Application not found.')
    }

    const current = this.rows[index]!
    const updated = { ...current, status }
    this.rows[index] = updated
    return updated
  }

  async checkConnectivity(): Promise<ConnectivityStatus> {
    return 'ok'
  }
}
