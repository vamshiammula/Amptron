import { createClient, type Session } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const hasSupabaseClient = Boolean(url && key)

export const supabase = hasSupabaseClient
  ? createClient(url!, key!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

export function getUserEmail(session: Session | null): string {
  return session?.user.email ?? 'Unknown user'
}
