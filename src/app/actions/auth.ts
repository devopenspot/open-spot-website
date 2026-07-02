"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { isSupabaseConfigured, env } from "@/lib/env"

export async function signOutAction(): Promise<void> {
  if (!isSupabaseConfigured()) return
  const cookieStore = await cookies()
  const supabase = createServerClient(env.SUPABASE_URL!, env.SUPABASE_SECRET_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options)
        }
      },
    },
  })
  await supabase.auth.signOut()
  revalidatePath("/")
}