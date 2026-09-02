import { randomUUID } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { ApplicationInput } from '../../../shared/applicationSchema.js'
import type { SupabaseConfig } from '../config.js'
import {
  DuplicateApplicationError,
  RepositoryPermissionError,
  RepositoryUnavailableError,
  type ApplicationsRepository,
  type ConnectivityStatus,
  type CreatedApplication,
  type StoredApplication,
  type SubmissionMeta,
} from './repository.js'

const TABLE = 'dealer_applications'

const UNIQUE_VIOLATION = '23505'
const CHECK_VIOLATION = '23514'
const INSUFFICIENT_PRIVILEGE = '42501'

interface DealerApplicationRow {
  id: string
  full_name: string
  email: string
  phone: string
  city: string
  profile: string
  status: StoredApplication['status']
  source: string
  created_at: string
}

function toStoredApplication(row: DealerApplicationRow): StoredApplication {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    profile: row.profile,
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
  }
}

export function createSupabaseClient(config: SupabaseConfig): SupabaseClient {
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-application-name': 'amptron-api' } },
  })
}

export class SupabaseApplicationsRepository implements ApplicationsRepository {
  private readonly client: SupabaseClient
  private readonly canRead: boolean

  constructor(client: SupabaseClient, canRead: boolean) {
    this.client = client
    this.canRead = canRead
  }

  async create(
    input: ApplicationInput,
    meta: SubmissionMeta,
  ): Promise<CreatedApplication> {
    const id = randomUUID()

    // No `.select()` on purpose: it sends `Prefer: return=minimal`, so this works
    // with a publishable key that has INSERT but no SELECT privilege.
    const { error } = await this.client.from(TABLE).insert({
      id,
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      city: input.city,
      profile: input.profile,
      source: meta.source,
      ip_hash: meta.ipHash,
      user_agent: meta.userAgent,
    })

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        throw new DuplicateApplicationError()
      }
      if (error.code === INSUFFICIENT_PRIVILEGE) {
        throw new RepositoryPermissionError(
          'Supabase rejected the insert. Check the dealer_applications RLS policy and grants.',
        )
      }
      if (error.code === CHECK_VIOLATION) {
        throw new RepositoryUnavailableError(
          `Database rejected the application: ${error.message}`,
        )
      }
      throw new RepositoryUnavailableError(
        `Could not save the application: ${error.message}`,
      )
    }

    return { id, receivedAt: new Date().toISOString() }
  }

  async list({ limit = 50 }: { limit?: number } = {}): Promise<
    StoredApplication[]
  > {
    if (!this.canRead) {
      throw new RepositoryPermissionError(
        'Reading applications requires SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.',
      )
    }

    const { data, error } = await this.client
      .from(TABLE)
      .select(
        'id, full_name, email, phone, city, profile, status, source, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 200))

    if (error) {
      throw new RepositoryUnavailableError(
        `Could not read applications: ${error.message}`,
      )
    }

    return (data as DealerApplicationRow[]).map(toStoredApplication)
  }

  async updateStatus(
    id: string,
    status: StoredApplication['status'],
  ): Promise<StoredApplication> {
    if (!this.canRead) {
      throw new RepositoryPermissionError(
        'Updating applications requires SUPABASE_SERVICE_ROLE_KEY permissions.',
      )
    }

    const { data, error } = await this.client
      .from(TABLE)
      .update({ status })
      .eq('id', id)
      .select(
        'id, full_name, email, phone, city, profile, status, source, created_at',
      )
      .single()

    if (error) {
      throw new RepositoryUnavailableError(
        `Could not update application status: ${error.message}`,
      )
    }

    return toStoredApplication(data as DealerApplicationRow)
  }

  async checkConnectivity(): Promise<ConnectivityStatus> {
    try {
      const { error, status } = await this.client
        .from(TABLE)
        .select('id', { head: true, count: 'exact' })

      if (!error) return 'ok'

      // A publishable key is intentionally denied SELECT, which still proves the
      // project and table are reachable and that inserts will work. HEAD requests
      // carry no response body, so the refusal shows up as a bare 401/403.
      const denied =
        status === 401 || status === 403 || error.code === INSUFFICIENT_PRIVILEGE

      return denied ? 'write-only' : 'unreachable'
    } catch {
      return 'unreachable'
    }
  }
}
