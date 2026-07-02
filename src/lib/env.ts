import { z } from "zod"

const EnvSchema = z
  .object({
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

    // Postgres / Supabase
    DATABASE_URL: z
      .string()
      .default("postgresql://dev:dev@localhost:5432/app"),
    DB_CONNETION_STRING: z.string().optional(),
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_SECRET_KEY: z.string().optional(),

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

export function getDatabaseUrl(): string | null {
  // Prefer the Supabase direct connection when Supabase creds are present.
  // Falls back to the generic DATABASE_URL (local docker).
  if (env.SUPABASE_URL && env.DB_CONNETION_STRING) {
    return env.DB_CONNETION_STRING
  }
  return env.DATABASE_URL || null
}

export function isSupabaseConfigured(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SECRET_KEY)
}