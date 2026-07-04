import { env } from "@/lib/env"
import { DEV_USER_ID, type User } from "@/lib/user"

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
 * Returns `true` if the given user is an admin. The dev placeholder user
 * (`id === "dev"`) is always treated as admin so the dashboard is
 * accessible in local dev without configuring Supabase or env vars.
 *
 * `adminEmails` is exposed as an optional parameter so unit tests can
 * exercise the membership check without depending on `process.env`.
 */
export function isAdminUser(
  user: User,
  adminEmails: readonly string[] = getAdminEmails(),
): boolean {
  if (user.id === DEV_USER_ID) return true
  return adminEmails.includes(user.email.toLowerCase())
}
