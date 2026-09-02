import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { ApplicationInput } from '../../../shared/applicationSchema.js'
import {
  DuplicateApplicationError,
  RepositoryPermissionError,
  RepositoryUnavailableError,
} from './repository.js'
import { SupabaseApplicationsRepository } from './supabaseRepository.js'

interface PostgrestResult {
  data?: unknown
  error?: { code?: string; message: string } | null
  status?: number
}

/**
 * Minimal stand-in for the PostgREST query builder: `select()` is awaitable on
 * its own (used by the health check) and also chains into `order().limit()`.
 */
function fakeClient(options: {
  insert?: PostgrestResult
  select?: PostgrestResult
  onInsert?: (row: Record<string, unknown>) => void
}) {
  const selectResult = Promise.resolve(options.select ?? { data: [], error: null })

  const query: Record<string, unknown> = {
    order: () => query,
    limit: () => selectResult,
    // oxlint-disable-next-line unicorn/no-thenable -- PostgREST builders are thenable.
    then: selectResult.then.bind(selectResult),
    catch: selectResult.catch.bind(selectResult),
  }

  return {
    from: () => ({
      insert: (row: Record<string, unknown>) => {
        options.onInsert?.(row)
        return Promise.resolve(options.insert ?? { error: null })
      },
      select: () => query,
    }),
  } as unknown as SupabaseClient
}

const input: ApplicationInput = {
  fullName: 'Priya Raman',
  email: 'priya@raman-motors.co.in',
  phone: '+91 98765 43210',
  city: 'Pune, Maharashtra',
  profile:
    'We run two multi-brand two-wheeler showrooms in Pune with 14 years of retail experience.',
}

const meta = { ipHash: 'hashed-ip', userAgent: 'vitest', source: 'website' }

describe('SupabaseApplicationsRepository.create', () => {
  it('maps the application onto snake_case columns', async () => {
    const onInsert = vi.fn()
    const repository = new SupabaseApplicationsRepository(
      fakeClient({ onInsert }),
      true,
    )

    const result = await repository.create(input, meta)

    expect(result.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(onInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'Priya Raman',
        email: 'priya@raman-motors.co.in',
        city: 'Pune, Maharashtra',
        source: 'website',
        ip_hash: 'hashed-ip',
        user_agent: 'vitest',
      }),
    )
  })

  it('translates a unique violation into a duplicate error', async () => {
    const repository = new SupabaseApplicationsRepository(
      fakeClient({
        insert: { error: { code: '23505', message: 'duplicate key value' } },
      }),
      true,
    )

    await expect(repository.create(input, meta)).rejects.toThrow(
      DuplicateApplicationError,
    )
  })

  it('translates a privilege error into a permission error', async () => {
    const repository = new SupabaseApplicationsRepository(
      fakeClient({
        insert: { error: { code: '42501', message: 'permission denied' } },
      }),
      true,
    )

    await expect(repository.create(input, meta)).rejects.toThrow(
      RepositoryPermissionError,
    )
  })

  it('translates any other failure into an unavailable error', async () => {
    const repository = new SupabaseApplicationsRepository(
      fakeClient({
        insert: { error: { code: '08006', message: 'connection lost' } },
      }),
      true,
    )

    await expect(repository.create(input, meta)).rejects.toThrow(
      RepositoryUnavailableError,
    )
  })
})

describe('SupabaseApplicationsRepository.list', () => {
  it('refuses to read without a service-role key', async () => {
    const repository = new SupabaseApplicationsRepository(fakeClient({}), false)

    await expect(repository.list()).rejects.toThrow(RepositoryPermissionError)
  })

  it('maps rows back into camelCase applications', async () => {
    const repository = new SupabaseApplicationsRepository(
      fakeClient({
        select: {
          data: [
            {
              id: 'a5f1e2c3-0000-4000-8000-000000000001',
              full_name: 'Priya Raman',
              email: 'priya@raman-motors.co.in',
              phone: '+91 98765 43210',
              city: 'Pune, Maharashtra',
              profile: 'Two showrooms in Pune.',
              status: 'new',
              source: 'website',
              created_at: '2026-08-31T12:00:00.000Z',
            },
          ],
          error: null,
        },
      }),
      true,
    )

    const applications = await repository.list({ limit: 10 })

    expect(applications).toHaveLength(1)
    expect(applications[0]).toMatchObject({
      fullName: 'Priya Raman',
      status: 'new',
      createdAt: '2026-08-31T12:00:00.000Z',
    })
  })
})

describe('SupabaseApplicationsRepository.checkConnectivity', () => {
  it('reports ok when the table can be read', async () => {
    const repository = new SupabaseApplicationsRepository(
      fakeClient({ select: { error: null } }),
      true,
    )

    await expect(repository.checkConnectivity()).resolves.toBe('ok')
  })

  it('reports write-only when reads are denied by RLS', async () => {
    const repository = new SupabaseApplicationsRepository(
      fakeClient({
        select: {
          error: { code: '42501', message: 'permission denied' },
          status: 401,
        },
      }),
      false,
    )

    await expect(repository.checkConnectivity()).resolves.toBe('write-only')
  })

  it('reports write-only for a bodiless 401, which HEAD requests return', async () => {
    const repository = new SupabaseApplicationsRepository(
      fakeClient({ select: { error: { message: '' }, status: 401 } }),
      false,
    )

    await expect(repository.checkConnectivity()).resolves.toBe('write-only')
  })

  it('reports unreachable for transport failures', async () => {
    const repository = new SupabaseApplicationsRepository(
      fakeClient({
        select: { error: { code: '08006', message: 'fetch failed' }, status: 500 },
      }),
      true,
    )

    await expect(repository.checkConnectivity()).resolves.toBe('unreachable')
  })
})
