import { createBrowserClient } from "@supabase/ssr"

let supabaseClient: any = null

export function createClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: "implicit",
          detectSessionInUrl: true,
          persistSession: true
        }
      }
    )
  }
  return supabaseClient
}
