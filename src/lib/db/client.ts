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
// Rotate well before pgBouncer's `server_idle_timeout` (600s on
// Supabase Transaction mode). A connection held idle past that returns
// 57014 on its next query — see `isConnectionError` below.
const CONNECTION_LIFETIME = 300
// 10s hard deadline per query. The data path queries are sub-100ms;
// any hit here is a stale connection, not a real workload.
const STATEMENT_TIMEOUT_SECONDS = 10

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
    msg.includes("pool_size") ||
    // pgBouncer Transaction mode teardown (server_idle_timeout) and
    // our own client-side `statement_timeout` both surface as 57014
    // (`canceling statement due to statement timeout`). Retry once on
    // a fresh connection.
    msg.includes("canceling statement due to statement timeout") ||
    msg.includes("query_canceled") ||
    msg.includes("terminating connection")
  )
}

function poolSnapshot(): {
  total: number;
  idle: number;
  waiting: number;
} | null {
  if (!client) return null
  // postgres-js exposes the live connection counters on the underlying
  // pool. Best-effort — the shape is internal API and may change.
  const c = client as unknown as {
    ended?: boolean;
    open?: number;
    reserved?: number;
  }
  if (c.ended) return { total: 0, idle: 0, waiting: 0 }
  const total = c.open ?? 0
  const idle = c.reserved ?? 0
  return { total, idle, waiting: Math.max(0, POOL_MAX - (total - idle)) }
}

/**
 * Wraps an async function in a timeout. If the function doesn't resolve
 * within `ms`, the returned promise rejects with a `TimeoutError`. The
 * underlying operation is NOT cancelled (we don't hold a handle to the
 * SQL statement), but the client gets a clean deadline instead of
 * blocking until the server's `statement_timeout` (120s on Supabase)
 * kills the query and returns 57014.
 */
export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`db operation timed out after ${ms}ms`)
    this.name = "TimeoutError"
  }
}

export async function withTimeout<T>(
  fn: () => Promise<T>,
  ms: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(ms)), ms)
  })
  try {
    return await Promise.race([fn(), timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxAttempts?: number; baseDelayMs?: number; timeoutMs?: number } = {},
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3
  const baseDelayMs = opts.baseDelayMs ?? 200
  const timeoutMs = opts.timeoutMs
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const work = timeoutMs ? () => withTimeout(fn, timeoutMs) : fn
      return await work()
    } catch (err) {
      lastError = err
      if (!isConnectionError(err) || attempt === maxAttempts) throw err
      const cap = baseDelayMs * 2 ** (attempt - 1)
      const delay = Math.floor(Math.random() * cap)
      log.warn("db.retry", {
        attempt,
        delayMs: delay,
        pool: poolSnapshot(),
        error: err instanceof Error ? err.message : String(err),
      })
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastError
}

// Default deadline for one query through `withDbRetry`. Set well under
// the server-side `statement_timeout` (120s on Supabase) so a hung or
// stale connection surfaces a clean client error instead of waiting
// for the server to kill the query.
const DEFAULT_DB_TIMEOUT_MS = 15_000

/**
 * The standard wrapper for one DB operation. Retries on transient
 * connection errors (pgBouncer teardown, 57014, `Connection
 * terminated`) up to 3 times, with a 15s hard deadline per attempt
 * and jittered exponential backoff between attempts.
 */
export function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  return withRetry(fn, {
    maxAttempts: 3,
    baseDelayMs: 200,
    timeoutMs: DEFAULT_DB_TIMEOUT_MS,
  })
}

export function getDbClient() {
  if (db && client) return { db, client }
  const url = getDatabaseUrl()
  if (!url) throw new Error("SUPABASE_DATABASE_URL is not configured")
  client = postgres(url, {
    ssl: "require",
    max: POOL_MAX,
    connect_timeout: CONNECT_TIMEOUT,
    idle_timeout: IDLE_TIMEOUT,
    connection: {
      application_name: "open-spot-website",
      // 10s hard deadline per query — surfaces a clean 57014
      // retryable error instead of hanging on a stale connection.
      // Set at connection time via libpq's `options` parameter.
      statement_timeout: STATEMENT_TIMEOUT_SECONDS,
    },
    // Rotate every 5 min so connections don't sit idle long enough for
    // pgBouncer to tear them down (server_idle_timeout = 600s).
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