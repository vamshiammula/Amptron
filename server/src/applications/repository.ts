import type { ApplicationInput } from '../../../shared/applicationSchema.js'

export type ApplicationStatus = 'new' | 'contacted' | 'approved' | 'rejected'

export interface SubmissionMeta {
  ipHash: string | null
  userAgent: string | null
  source: string
}

export interface CreatedApplication {
  id: string
  receivedAt: string
}

export interface StoredApplication extends ApplicationInput {
  id: string
  status: ApplicationStatus
  source: string
  createdAt: string
}

export type ConnectivityStatus = 'ok' | 'write-only' | 'unreachable'

export interface ApplicationsRepository {
  create(input: ApplicationInput, meta: SubmissionMeta): Promise<CreatedApplication>
  list(options?: { limit?: number }): Promise<StoredApplication[]>
  updateStatus(id: string, status: ApplicationStatus): Promise<StoredApplication>
  checkConnectivity(): Promise<ConnectivityStatus>
}

/** Thrown when the email has already been used for an application. */
export class DuplicateApplicationError extends Error {
  constructor() {
    super('An application with this email address already exists.')
    this.name = 'DuplicateApplicationError'
  }
}

/** Thrown when the configured key lacks the privileges for the operation. */
export class RepositoryPermissionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RepositoryPermissionError'
  }
}

/** Thrown for transport or unexpected database failures. */
export class RepositoryUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'RepositoryUnavailableError'
  }
}
