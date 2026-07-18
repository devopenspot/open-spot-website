import { env } from "@/lib/env"
import type { User } from "@/lib/user"

function parseAdminEmails(raw: string): readonly string[] {
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Reads the admin allow-list from `ADMIN_EMAILS` (CSV, case-insensitive).
 * Defaults to an empty list when the env var is missing or blank.
 */
export function getAdminEmails(): readonly string[] {
  return parseAdminEmails(env.ADMIN_EMAILS)
}

/**
 * Returns `true` if the given user's email is in the admin allow-list
 * (case-insensitive). A real Supabase session is required — there is no
 * dev shortcut: admin access is granted only via `ADMIN_EMAILS`.
 *
 * `adminEmails` is exposed as an optional parameter so unit tests can
 * exercise the membership check without depending on `process.env`.
 */
export function isAdminUser(
  user: User,
  adminEmails: readonly string[] = getAdminEmails(),
): boolean {
  return adminEmails.includes(user.email.toLowerCase())
}
