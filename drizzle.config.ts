import type { Config } from "drizzle-kit"

export default {
  schema: "./src/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DB_CONNETION_STRING ??
      process.env.DATABASE_URL ??
      "postgresql://dev:dev@localhost:5432/app",
  },
  strict: true,
  verbose: true,
} satisfies Config