import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Request, Response } from 'express'
import type { AppConfig } from './config.js'

export type PortalRole = 'dealer' | 'admin'

export interface PortalActor {
  authUserId: string
  email: string | null
  accountId: string
  accountName: string
  role: PortalRole
  territory: string | null
}

interface DealerAccountRow {
  id: string
  auth_user_id: string
  role: PortalRole
  account_name: string
  territory: string | null
}

export interface AuthedRequest extends Request {
  actor?: PortalActor
}

export function createActorResolver(config: AppConfig) {
  const client =
    config.supabase &&
    createClient(config.supabase.url, config.supabase.key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'x-application-name': 'amptron-api-auth' } },
    })

  return async (req: AuthedRequest, res: Response, role?: PortalRole) => {
    if (!client) {
      res.status(503).json({
        error: 'auth_unavailable',
        message: 'Portal authentication requires SUPABASE_URL and server key.',
      })
      return
    }

    const token = req.get('authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) {
      res
        .status(401)
        .json({ error: 'unauthorized', message: 'Missing bearer token.' })
      return
    }

    const actor = await resolveActor(client, token, config)
    if (!actor) {
      res
        .status(401)
        .json({ error: 'unauthorized', message: 'Invalid portal session.' })
      return
    }

    if (role === 'admin' && actor.role !== 'admin') {
      res.status(403).json({
        error: 'forbidden',
        message: 'This operation is restricted to admin users.',
      })
      return
    }

    req.actor = actor
    return actor
  }
}

async function resolveActor(
  client: SupabaseClient,
  token: string,
  config: AppConfig,
): Promise<PortalActor | null> {
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser(token)
  if (authError || !user) return null

  // Use a token-scoped PostgREST client so RLS evaluates with this user context.
  const actorClient = createClient(config.supabase!.url, config.supabase!.key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data, error } = await actorClient
    .from('dealer_accounts')
    .select('id, auth_user_id, role, account_name, territory')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (error) return null

  let account = data as DealerAccountRow | null
  if (!account) {
    const defaultName =
      (typeof user.user_metadata?.full_name === 'string' &&
        user.user_metadata.full_name.trim()) ||
      user.email ||
      'Dealer Account'
    const { data: inserted, error: insertError } = await actorClient
      .from('dealer_accounts')
      .insert({
        auth_user_id: user.id,
        account_name: defaultName,
        role: 'dealer',
        territory: null,
      })
      .select('id, auth_user_id, role, account_name, territory')
      .single()
    if (insertError || !inserted) return null
    account = inserted as DealerAccountRow
  }

  return {
    authUserId: account.auth_user_id,
    email: user.email ?? null,
    accountId: account.id,
    accountName: account.account_name,
    role: account.role,
    territory: account.territory,
  }
}
