import { createClient } from "@supabase/supabase-js"
import { getCurrentUser as getDevUser } from "@/lib/user"
import type { User } from "@/lib/user"

let cachedAdmin: ReturnType<typeof createClient> | null = null
function getAdminClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return null
  if (cachedAdmin) return cachedAdmin
  cachedAdmin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cachedAdmin
}

export async function getServerUserFromCookies(): Promise<User> {
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server")
    const { isSupabaseConfigured } = await import("@/lib/env")
    if (!isSupabaseConfigured()) return getDevUser()
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return getDevUser()
    const u = data.user
    const meta = (u.user_metadata ?? {}) as Record<string, unknown>
    const email = u.email ?? getDevUser().email
    const name =
      (typeof meta["display_name"] === "string" && meta["display_name"]) ||
      (typeof meta["name"] === "string" && meta["name"]) ||
      email.split("@")[0]!
    const initials =
      (typeof meta["initials"] === "string" && meta["initials"]) ||
      name
        .split(/\s+/)
        .map((p) => p[0]?.toUpperCase() ?? "")
        .slice(0, 2)
        .join("") ||
      "OS"
    return { id: u.id, name, email, initials }
  } catch {
    return getDevUser()
  }
}

export async function ensureProfileRow(user: User): Promise<void> {
  const admin = getAdminClient()
  if (!admin) return
  try {
    await (admin.from("profiles") as ReturnType<typeof admin.from>).upsert(
      {
        id: user.id,
        display_name: user.name,
        email: user.email,
        initials: user.initials,
      },
      { onConflict: "id" },
    )
  } catch {
    // best-effort; RLS may block this for non-service-role contexts
  }
}