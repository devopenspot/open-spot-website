import { sql } from "drizzle-orm"
import { withRetry, getDbClient } from "./client"

export interface DbHealth {
  ok: boolean
  latencyMs: number
  source: "db" | "json"
  error?: string
}

export async function checkDbHealth(): Promise<DbHealth> {
  const started = Date.now()
  try {
    const { db } = getDbClient()
    const r = await withRetry(async () => {
      const result = await db.execute(sql`select 1 as ok`)
      return result
    }, { maxAttempts: 1, baseDelayMs: 0 })
    if (!r) throw new Error("no response")
    return { ok: true, latencyMs: Date.now() - started, source: "db" }
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      source: "db",
      error: err instanceof Error ? err.message : String(err),
    }
  }
}