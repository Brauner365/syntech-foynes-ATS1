"use client"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const AuthContext = createContext<any>(null)
export function useAuth() { return useContext(AuthContext) }

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(undefined) // undefined = still loading
  const [ready, setReady] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION immediately on mount
    // This is the authoritative source of truth — don't use getSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      setSession(session)
      setReady(true) // INITIAL_SESSION has fired — we now know the real state
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, ready, supabase }}>
      {children}
    </AuthContext.Provider>
  )
}
