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

    // Supabase server-only admin key (`sb_secret_...`). Used only for
    // server-side admin operations (e.g. upserting into `profiles` with
    // RLS bypass). Never read by the SSR client or the proxy.
    SUPABASE_SECRET_KEY: z.string().optional(),

    // Browser-public Supabase URL and publishable key (`sb_publishable_...`).
    // The proxy and the @supabase/ssr SSR client both use these — the SSR
    // client because it represents a user-context call that must respect
    // RLS, the proxy because it refreshes the cookie-based user session.
    // The publishable key is safe to expose to the browser; Next.js inlines
    // it at build time, so server-only code (e.g. the admin client) can
    // read the URL through the same getter.
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),

    // Supabase Postgres.
    //   SUPABASE_DATABASE_URL — pgBouncer Transaction pooler (port 6543).
    //     The runtime reads this first. IPv4-only, designed for serverless,
    //     and DNS-resolvable from Vercel. Required on Vercel.
    //   SUPABASE_DIRECT_URL — direct connection (port 5432). Local-only,
    //     used by drizzle-kit for DDL (the pooler is unsafe for migrations).
    //     Not reachable from the Vercel function network — do not set on
    //     Vercel.
    SUPABASE_DIRECT_URL: z.string().optional(),
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
 * Single source of connection: `SUPABASE_DATABASE_URL` is the pgBouncer
 * Transaction pooler (port 6543), set in both local dev and Vercel to the
 * same value. The pooler is IPv4-only and DNS-resolves from the Vercel
 * function network; the direct hostname (`db.<project>.supabase.co`,
 * port 5432) is not reachable from Vercel.
 *
 * The build is DB-free and never calls this.
 *
 * Resolution order:
 *   1. SUPABASE_DATABASE_URL (port 6543, pgBouncer pooler — runtime default)
 *   2. SUPABASE_DIRECT_URL   (port 5432, direct — local DDL only)
 */
export function getDatabaseUrl(): string | null {
  return env.SUPABASE_DATABASE_URL ?? env.SUPABASE_DIRECT_URL ?? null
}



export function getSupabaseUrl(): string | null {
  return env.NEXT_PUBLIC_SUPABASE_URL ?? null
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
