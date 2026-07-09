import type { Config } from "drizzle-kit"

const url =
  process.env.SUPABASE_DIRECT_URL ??
  process.env.DB_CONNETION_STRING ??
  process.env.DATABASE_URL

if (!url) {
  throw new Error(
    "drizzle.config.ts: set SUPABASE_DIRECT_URL (preferred), " +
      "DB_CONNETION_STRING (legacy), or DATABASE_URL before running " +
      "drizzle-kit.",
  )
}

export default {
  schema: "./src/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
} satisfies Config