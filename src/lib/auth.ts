import { createClient } from "@supabase/supabase-js"
import { getCurrentUser as getDevUser } from "@/lib/user"
import type { User } from "@/lib/user"
import { isAdminUser } from "@/lib/admin"

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

export { getAdminClient }

export interface AuthClaims {
  sub?: string
  email?: string
  user_metadata?: Record<string, unknown>
}

/**
 * Pure projection of a Supabase JWT payload to a {@link User}. Single source
 * of truth for the `display_name` → `full_name` → `name` → email-local-part →
 * "Scout" fallback chain and the avatar/picture lookup. Called from both
 * the cookie reader and the OAuth callback so they cannot drift.
 */
export function userFromClaims(claims: AuthClaims): User | null {
  if (!claims.sub) return null
  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>
  const email = (typeof claims.email === "string" && claims.email) || ""
  const name =
    (typeof meta["display_name"] === "string" && meta["display_name"]) ||
    (typeof meta["full_name"] === "string" && meta["full_name"]) ||
    (typeof meta["name"] === "string" && meta["name"]) ||
    email.split("@")[0] ||
    "Scout"
  const initials =
    (typeof meta["initials"] === "string" && meta["initials"]) ||
    name
      .split(/\s+/)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("") ||
    "OS"
  const avatarUrl =
    (typeof meta["avatar_url"] === "string" && meta["avatar_url"]) ||
    (typeof meta["picture"] === "string" && meta["picture"]) ||
    null
  return { id: claims.sub, name, email, initials, avatarUrl, isAdmin: false }
}

export async function getServerUserFromCookies(): Promise<User> {
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server")
    const { isSupabaseConfigured } = await import("@/lib/env")
    if (!isSupabaseConfigured()) return getDevUser()
    const supabase = await createSupabaseServerClient()
    // getClaims validates the session cookie's JWT (locally with the JWKS
    // for asymmetric keys, via the auth server for symmetric). It does not
    // make a network round trip to fetch the full user record on every
    // request, unlike getUser(). The user_metadata we need for display
    // (name, initials, avatar) is embedded in the JWT payload.
    const { data, error } = await supabase.auth.getClaims()
    if (error || !data?.claims) return getDevUser()
    const fromClaims = userFromClaims(data.claims as AuthClaims) ?? getDevUser()
    // `userFromClaims` does not know about the admin allow-list, so re-evaluate
    // here against `ADMIN_EMAILS`. The dev user already returns `isAdmin: true`
    // from `getDevUser`, so this is a no-op for them.
    return { ...fromClaims, isAdmin: isAdminUser(fromClaims) }
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
        avatar_url: user.avatarUrl,
      },
      { onConflict: "id" },
    )
  } catch {
    // best-effort; RLS may block this for non-service-role contexts
  }
}