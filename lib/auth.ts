// Shared auth utilities - no Supabase client dependency

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const val = JSON.parse(localStorage.getItem(key) || "{}")
        return val.access_token || null
      }
    }
  } catch {}
  return null
}

export async function getUser(token: string) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` }
  })
  return r.json()
}

export async function supaFetch(path: string, token: string) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept-Profile": "foynes"
    }
  })
  return r.json()
}

export async function supaPost(path: string, token: string, body: any) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Content-Profile": "foynes",
      "Prefer": "return=minimal"
    },
    body: JSON.stringify(body)
  })
  return r
}

export function signOut(router: any) {
  const token = getToken()
  if (token) {
    fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${token}` }
    }).catch(() => {})
  }
  localStorage.clear()
  router.push("/login")
}
