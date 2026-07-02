import "server-only"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { isSupabaseConfigured, env } from "@/lib/env"

export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured (SUPABASE_URL / SUPABASE_SECRET_KEY)")
  }
  const cookieStore = await cookies()
  return createServerClient(env.SUPABASE_URL!, env.SUPABASE_SECRET_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Server Components cannot set cookies. The middleware handles refresh.
        }
      },
    },
  })
}