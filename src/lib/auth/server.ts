import "server-only"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { isSupabaseConfigured, getSupabaseUrl, getSupabasePublishableKey } from "@/lib/env"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { User } from "@/lib/user"
import { getServerUserFromCookies } from "@/lib/auth"

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
  if (!isSupabaseConfigured()) return null
  const u = await getServerUserFromCookies()
  if (u.id === "dev") return null
  return u
}

/**
 * Server-side guard for protected pages.
 *
 * - If Supabase is not configured (local dev without env), returns the dev
 *   placeholder user so the page renders normally.
 * - If Supabase is configured and the visitor has a real session, returns
 *   that user.
 * - If Supabase is configured and the visitor has no real session, throws
 *   a `NEXT_REDIRECT` to `/login?next=<path>` before any HTML is rendered.
 *
 * Must be called from a Server Component. Do not wrap in try/catch — the
 * `redirect()` throw is handled by the Next.js framework.
 */
export async function requireUserOrRedirect(nextPath: string): Promise<User> {
  if (!isSupabaseConfigured()) {
    return getServerUserFromCookies()
  }
  const user = await getSessionUser()
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`)
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
  const { error } = await supabase.auth.signOut()
  return { error: error?.message ?? null }
}
