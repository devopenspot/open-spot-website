import "./load-env"
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import postgres from "postgres"
import { getDatabaseUrl } from "../lib/env"

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations")

function ensureMigrationsTable(sql: ReturnType<typeof postgres>) {
  return sql`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `
}

async function appliedIds(sql: ReturnType<typeof postgres>): Promise<Set<string>> {
  const rows = await sql<{ id: string }[]>`select id from schema_migrations`
  return new Set(rows.map((r) => r.id))
}

async function main() {
  const url = getDatabaseUrl()
  if (!url) throw new Error("SUPABASE_DATABASE_URL is not configured")
  const sql = postgres(url, { ssl: "require", max: 1, connect_timeout: 10 })
  try {
    await ensureMigrationsTable(sql)
    const applied = await appliedIds(sql)
    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort()
    for (const file of files) {
      const id = file.replace(/\.sql$/, "")
      if (applied.has(id)) {
        console.log(`✓ ${file} (already applied)`)
        continue
      }
      console.log(`→ applying ${file}`)
      const body = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8")
      // Split on drizzle's `--> statement-breakpoint` so each statement
      // is sent separately (the live DB rejects multi-statement strings).
      const statements = body
        .split(/^[ \t]*--> statement-breakpoint[ \t]*$/m)
        .map((s) => s.trim())
        .filter(Boolean)
      await sql.begin(async (tx) => {
        for (const stmt of statements) {
          await tx.unsafe(stmt)
        }
        await tx`insert into schema_migrations (id) values (${id})`
      })
      console.log(`✓ ${file} (applied)`)
    }
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})