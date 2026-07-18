import { cacheLife, cacheTag } from "next/cache"
import { sql } from "drizzle-orm"
import { getDbClient, withRetry } from "@/lib/db/client"

export interface DbHealth {
  ok: boolean
  latencyMs: number
  source: "db" | "json"
  error?: string
}

/**
 * Raw DB health probe. Runs a trivial `SELECT 1` against the configured
 * Drizzle client and reports latency + error.
 *
 * No cache directives. Safe to call from any server context (HTTP
 * route, server action, CLI script). This is the function CLIs and
 * other server-side probes should use when they need a live result.
 */
export async function runDbHealthCheck(): Promise<DbHealth> {
  const started = Date.now()
  try {
    const { db } = getDbClient()
    const r = await withRetry(
      () => db.execute(sql`select 1 as ok`),
      { maxAttempts: 1, baseDelayMs: 0 },
    )
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

/**
 * Cached wrapper for HTTP routes. Marks the result with the
 * `db-health` cache tag and a 30s revalidate / 300s expire window so
 * `/api/health` responses are cheap to serve and easy to invalidate.
 *
 * The CLI script (`src/db/health-cli.ts`) MUST NOT call this — the
 * `"use cache"` + `cacheTag` runtime helpers throw when invoked
 * outside the Next.js request lifecycle (e.g. under `tsx`).
 */
export async function checkDbHealth(): Promise<DbHealth> {
  "use cache"
  cacheTag("db-health")
  cacheLife({
    revalidate: 30,
    stale: 30,
    expire: 300,
  })
  return runDbHealthCheck()
}
