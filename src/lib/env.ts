import { z } from "zod"

const EnvSchema = z
  .object({
    // Public origin (used by metadataBase, sitemap, robots).
    APP_URL: z
      .string()
      .url()
      .default("https://openspot.example.com"),

    // OpenWeather
    URL_WEATHER: z.string().url().default("https://api.openweathermap.org"),
    URL_WEATHER_IMG: z
      .string()
      .url()
      .default("https://openweathermap.org/payload/api/media/file"),
    API_KEY_WEATHER: z.string().default(""),

    // Nominatim
    NOMINATIM_URL: z
      .string()
      .url()
      .default("https://nominatim.openstreetmap.org"),
    NOMINATIM_USER_AGENT: z
      .string()
      .default("open-spot-website/1.0 (contact@example.com)"),

    // Postgres — single source of connection for dev and Vercel. The
    // runtime (Drizzle client), the build (none), and the dev-console
    // scripts (`db:seed`, `db:apply`, `db:health`) all read through
    // `getDatabaseUrl()`, which resolves `SUPABASE_DIRECT_URL` first.
    // No docker default — local dev points at the same Supabase project.
    DATABASE_URL: z.string().optional(),

    // Supabase server-only admin key (`sb_secret_...`). Used only for
    // server-side admin operations (e.g. upserting into `profiles` with
    // RLS bypass). Never read by the SSR client or the proxy.
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_SECRET_KEY: z.string().optional(),

    // Browser-public Supabase publishable key (`sb_publishable_...`). The
    // proxy and the @supabase/ssr SSR client both use this — the SSR
    // client because it represents a user-context call that must respect
    // RLS, the proxy because it refreshes the cookie-based user session.
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),

    // Supabase Postgres. The code name is DB_CONNETION_STRING (typo, kept for
    // back-compat with the CI workflow and any operator that already set it);
    // SUPABASE_DIRECT_URL (SPEC §E.4) is the preferred name and wins if both
    // are set. SUPABASE_DATABASE_URL is the pooled connection (pgBouncer
    // port 6543) — documented but not read by the runtime today.
    SUPABASE_DIRECT_URL: z.string().optional(),
    DB_CONNETION_STRING: z.string().optional(),
    SUPABASE_DATABASE_URL: z.string().optional(),

    // Supabase Storage bucket for user-contributed spot images.
    SUPABASE_STORAGE_BUCKET_SPOTS: z
      .string()
      .min(1)
      .default("spot-images"),

    // Admin allow-list (CSV of emails, case-insensitive). When Supabase is
    // unconfigured the dev placeholder user is automatically treated as
    // admin (see `isAdminUser` in `@/lib/admin`).
    ADMIN_EMAILS: z.string().default(""),

    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  })
  .passthrough()

function readEnv() {
  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ")
    throw new Error(`Invalid environment variables: ${issues}`)
  }
  return parsed.data
}

export const env = readEnv()

/**
 * Postgres URL used by the runtime Drizzle client + the dev-console scripts
 * (`db:seed`, `db:apply`, `db:health`).
 *
 * Single source of connection: `SUPABASE_DIRECT_URL` is set in both local
 * dev and Vercel to the same value (dev and prod share the Supabase
 * project). The build is DB-free and never calls this.
 *
 * Resolution order:
 *   1. SUPABASE_DIRECT_URL (port 5432, direct — the only runtime URL)
 *   2. DB_CONNETION_STRING (legacy typo, kept for CI / existing operators)
 *   3. DATABASE_URL (optional escape hatch for non-Supabase setups)
 */
export function getDatabaseUrl(): string | null {
  return (
    env.SUPABASE_DIRECT_URL ??
    env.DB_CONNETION_STRING ??
    env.DATABASE_URL ??
    null
  )
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey())
}

export function getSupabaseUrl(): string | null {
  return env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL ?? null
}

export function getSupabasePublishableKey(): string | null {
  return env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? null
}

export function getSupabaseServiceRoleKey(): string | null {
  return env.SUPABASE_SECRET_KEY ?? null
}

export function getSpotImagesBucket(): string {
  return env.SUPABASE_STORAGE_BUCKET_SPOTS
}
