import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { hasSupabaseClient, supabase } from './supabase'

interface AuthContextValue {
  session: Session | null
  ready: boolean
}

const AuthContext = createContext<AuthContextValue>({ session: null, ready: false })

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(!hasSupabaseClient)

  useEffect(() => {
    if (!hasSupabaseClient || !supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, updatedSession) => {
      setSession(updatedSession)
      setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = useMemo(() => ({ session, ready }), [ready, session])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
