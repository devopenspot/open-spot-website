import "server-only"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { getSupabaseUrl, getSupabasePublishableKey } from "@/lib/env"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { User } from "@/lib/user"
import { getServerUserFromCookies } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin"

const DEFAULT_NEXT = "/"

export class AuthConfigError extends Error {
  constructor() {
    super("Auth is not configured")
    this.name = "AuthConfigError"
  }
}

export function requireAuthConfig(): { url: string; publishableKey: string } {
  const url = getSupabaseUrl()
  const publishableKey = getSupabasePublishableKey()
  if (!url || !publishableKey) throw new AuthConfigError()
  return { url, publishableKey }
}

export function configNotReadyResponse() {
  return NextResponse.json(
    { error: "Auth is not configured" },
    { status: 503 },
  )
}

export function sanitizeNext(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) return DEFAULT_NEXT
  if (!value.startsWith("/") || value.startsWith("//")) return DEFAULT_NEXT
  return value
}

/**
 * Resolves the request's external origin — used as the `redirectTo` base
 * for the OAuth flow. Order of preference:
 *   1. `x-forwarded-origin` (set by some proxies / CDNs).
 *   2. `x-forwarded-host` + `x-forwarded-proto` (Vercel and most reverse
 *      proxies; defaults `proto` to `https` when missing).
 *   3. `new URL(request.url).origin` as a last-resort fallback.
 */
export function originFromRequest(request: Request): string {
  const fromHeader = request.headers.get("x-forwarded-origin")
  if (fromHeader) return fromHeader
  const fwdHost = request.headers.get("x-forwarded-host")
  if (fwdHost) {
    const fwdProto = request.headers.get("x-forwarded-proto") ?? "https"
    return `${fwdProto}://${fwdHost}`
  }
  return new URL(request.url).origin
}

export async function getSessionUser(): Promise<User | null> {
  return getServerUserFromCookies()
}

/**
 * Server-side guard for protected pages. Throws a `NEXT_REDIRECT` to
 * `/login?next=<path>` if there is no real Supabase session. Must be
 * called from a Server Component — do not wrap in try/catch.
 */
export async function requireUserOrRedirect(nextPath: string): Promise<User> {
  const user = await getSessionUser()
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`)
  }
  return user
}

/**
 * Server-side guard for server actions and route handlers. Throws a
 * plain `Error` instead of triggering a navigation — callers handle it
 * in a try/catch.
 */
export async function requireUser(): Promise<User> {
  const user = await getSessionUser()
  if (!user) {
    throw new Error("Not signed in")
  }
  return user
}

/**
 * Server-side guard for admin-only Server Components. Throws a
 * `NEXT_REDIRECT` to `/login` if there is no session, or to `/` if
 * the signed-in user is not an admin.
 */
export async function requireAdminOrRedirect(nextPath: string): Promise<User> {
  const user = await getSessionUser()
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`)
  }
  if (!isAdminUser(user)) {
    redirect("/")
  }
  return user
}

/**
 * Server-side guard for admin-only server actions and route handlers.
 * Throws a plain `Error("Admin only")` instead of triggering a navigation.
 */
export async function requireAdmin(): Promise<User> {
  const user = await getServerUserFromCookies()
  if (!user) {
    throw new Error("Not signed in")
  }
  if (!isAdminUser(user)) {
    throw new Error("Admin only")
  }
  return user
}

export async function signInWithGoogle(opts: {
  origin: string
  next: string
}): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${opts.origin}/auth/callback?next=${encodeURIComponent(opts.next)}`,
      scopes: "email profile",
    },
  })
  if (error) return { url: null, error: error.message }
  return { url: data.url ?? null, error: null }
}

export async function signOut(): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient()
  // `supabase.auth.signOut()` on the SSR client only clears the response
  // cookies — the refresh token stays valid until natural expiry. Revoke
  // it server-side via the service-role client so a leaked refresh token
  // cannot outlive the user's sign-out click.
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (accessToken) {
      const { getAdminClient } = await import("@/lib/auth")
      const admin = getAdminClient()
      if (admin) {
        const { error: revokeError } =
          await admin.auth.admin.signOut(accessToken)
        if (revokeError) {
          // best-effort: still clear cookies below
          console.warn("signOut: admin.signOut failed", revokeError.message)
        }
      }
    }
  } catch {
    // best-effort: never block sign-out on a revoke failure
  }
  const { error } = await supabase.auth.signOut()
  return { error: error?.message ?? null }
}
