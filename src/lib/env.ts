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

    // Weather cache busting
    REVALIDATE_SECRET: z.string().default(""),

    // Nominatim
    NOMINATIM_URL: z
      .string()
      .url()
      .default("https://nominatim.openstreetmap.org"),
    NOMINATIM_USER_AGENT: z
      .string()
      .default("open-spot-website/1.0 (contact@example.com)"),

    // Postgres — local docker default; Supabase overrides below.
    DATABASE_URL: z
      .string()
      .default("postgresql://dev:dev@localhost:5432/app"),

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

    // Data source
    SPOTS_DATA_SOURCE: z.enum(["json", "db"]).default("json"),

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

export function getSpotsDataSource(): "json" | "db" {
  return env.SPOTS_DATA_SOURCE === "db" ? "db" : "json"
}

/**
 * Postgres URL used by the runtime Drizzle client + the apply-sql runner.
 *
 * Resolution order:
 *   1. SUPABASE_DIRECT_URL (SPEC §E.4 preferred name)
 *   2. DB_CONNETION_STRING (typo, kept for CI / existing operator setups)
 *   3. DATABASE_URL (local docker default)
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
