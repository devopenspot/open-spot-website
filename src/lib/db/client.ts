import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { getDatabaseUrl } from "@/lib/env"
import { log } from "@/lib/log"
import * as schema from "@/db/schema"

let client: ReturnType<typeof postgres> | null = null
let db: ReturnType<typeof drizzle<typeof schema>> | null = null

const POOL_MAX = 5
const CONNECT_TIMEOUT = 8
const IDLE_TIMEOUT = 30
const CONNECTION_LIFETIME = 1800

export function isConnectionError(err: unknown): boolean {
  if (!err) return false
  const msg = err instanceof Error ? err.message : String(err)
  return (
    msg.includes("ECONNREFUSED") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("EHOSTUNREACH") ||
    msg.includes("timeout exceeded when trying to connect") ||
    msg.includes("Connection terminated") ||
    msg.includes("database does not exist") ||
    msg.includes("password authentication failed") ||
    // pgBouncer pool saturation — transient, retry with backoff.
    msg.includes("EMAXCONNSESSION") ||
    msg.includes("max clients reached") ||
    msg.includes("pool_size")
  )
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxAttempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3
  const baseDelayMs = opts.baseDelayMs ?? 200
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (!isConnectionError(err) || attempt === maxAttempts) throw err
      const cap = baseDelayMs * 2 ** (attempt - 1)
      const delay = Math.floor(Math.random() * cap)
      log.warn("db.retry", {
        attempt,
        delayMs: delay,
        error: err instanceof Error ? err.message : String(err),
      })
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastError
}

export function getDbClient() {
  if (db && client) return { db, client }
  const url = getDatabaseUrl()
  if (!url) throw new Error("DATABASE_URL is not configured")
  client = postgres(url, {
    ssl: "require",
    max: POOL_MAX,
    connect_timeout: CONNECT_TIMEOUT,
    idle_timeout: IDLE_TIMEOUT,
    connection: {
      application_name: "open-spot-website",
    },
    // Rotate client-side connections every 30 min to match Vercel function
    // recycling and avoid stale connections accumulating against the pooler.
    max_lifetime: CONNECTION_LIFETIME,
    prepare: false,
  })
  db = drizzle(client, { schema })
  return { db, client }
}

export function isDbConfigured(): boolean {
  return Boolean(getDatabaseUrl())
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.end({ timeout: 5 })
    client = null
    db = null
  }
}