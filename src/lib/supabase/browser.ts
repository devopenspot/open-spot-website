import "client-only"
import { createBrowserClient } from "@supabase/ssr"
import { env, isSupabaseConfigured } from "@/lib/env"

let cached: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    )
  }
  if (cached) return cached
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL ?? ""
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    env.SUPABASE_SECRET_KEY ??
    ""
  cached = createBrowserClient(url, key)
  return cached
}