import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { getDatabaseUrl } from "@/lib/env"
import { log } from "@/lib/log"
import * as schema from "@/db/schema"

let client: ReturnType<typeof postgres> | null = null
let db: ReturnType<typeof drizzle<typeof schema>> | null = null

// Pool sizing.
//   Vercel serverless: each function instance gets its own pool. A
//     pool of 1 prevents the "thundering herd" against the pgBouncer
//     Transaction-mode pooler, which caps the per-cluster connection
//     count. Combined with `max_lifetime` rotation, this is the
//     production-safe default.
//   Local dev: a long-running process benefits from a small pool so
//     concurrent reads (e.g. `RootDataProviders`) don't queue.
const POOL_MAX =
  process.env.NODE_ENV === "production" ? 1 : 5

// Tightened from 8s. If a connect takes >5s the network or DNS is
// broken; retrying with backoff is faster than waiting.
const CONNECT_TIMEOUT = 5
const IDLE_TIMEOUT = 30
// Rotate well before pgBouncer's `server_idle_timeout` (600s on
// Supabase Transaction mode). A connection held idle past that returns
// 57014 on its next query — see `isConnectionError` below. 240s
// gives a 2.5x safety margin against clock drift between client
// and pooler.
const CONNECTION_LIFETIME = 240
// 8s hard deadline per query. Set at connection time via libpq's
// `options` parameter so the server returns 57014 (`canceling
// statement due to statement timeout`) instead of letting the query
// hang for the server-side 120s default.
const STATEMENT_TIMEOUT_SECONDS = 8

// Hard client-side deadline for a single operation through
// `withDbRetry`. Set well under the server's `statement_timeout`
// (8s above) so a hung or stale connection surfaces a clean client
// error instead of waiting for the server to kill the query.
const DEFAULT_DB_TIMEOUT_MS = 15_000

// Per-attempt deadline for a checkout retry. When a checkout
// surfaces a transient error (ECONNRESET, EPIPE, socket hang up),
// we re-attempt the checkout up to `POOL_CHECKOUT_MAX_ATTEMPTS`
// times with jittered backoff, bounded by this deadline.
const POOL_CHECKOUT_TIMEOUT_MS = 3_000
const POOL_CHECKOUT_MAX_ATTEMPTS = 3

/**
 * Classifies a thrown error as a transient connection failure
 * worth retrying. Matches the libpq / pgBouncer error vocabulary
 * the runtime can produce.
 */
export function isConnectionError(err: unknown): boolean {
  if (!err) return false
  const msg = err instanceof Error ? err.message : String(err)
  return (
    // Network-level failures
    msg.includes("ECONNREFUSED") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("EPIPE") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("EHOSTUNREACH") ||
    msg.includes("socket hang up") ||
    msg.includes("Connection terminated") ||
    msg.includes("Connection reset") ||
    // Connection establishment failures
    msg.includes("timeout exceeded when trying to connect") ||
    // Auth / config failures — also retryable: a freshly-rotated
    // connection can briefly present these during the pooler
    // handoff before resolving cleanly.
    msg.includes("database does not exist") ||
    msg.includes("password authentication failed") ||
    // pgBouncer pool saturation
    msg.includes("EMAXCONNSESSION") ||
    msg.includes("max clients reached") ||
    msg.includes("pool_size") ||
    // pgBouncer Transaction-mode teardown (server_idle_timeout) and
    // our own client-side `statement_timeout` both surface as 57014
    // (`canceling statement due to statement timeout`). Retry once on
    // a fresh connection.
    msg.includes("canceling statement due to statement timeout") ||
    msg.includes("query_canceled") ||
    msg.includes("terminating connection")
  )
}

interface PoolSnapshot {
  total: number
  idle: number
  waiting: number
}

function poolSnapshot(): PoolSnapshot | null {
  if (!client) return null
  // postgres-js exposes the live connection counters on the underlying
  // pool. Best-effort — the shape is internal API and may change.
  const c = client as unknown as {
    ended?: boolean
    open?: number
    reserved?: number
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
 * blocking until the server's `statement_timeout` (8s here, 120s on
 * Supabase by default) kills the query and returns 57014.
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

/**
 * The standard wrapper for one DB operation. Retries on transient
 * connection errors (pgBouncer teardown, 57014, dead sockets) up to
 * 3 times, with a 15s hard deadline per attempt and jittered
 * exponential backoff between attempts.
 */
export function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  return withRetry(fn, {
    maxAttempts: 3,
    baseDelayMs: 200,
    timeoutMs: DEFAULT_DB_TIMEOUT_MS,
  })
}

/**
 * Wraps a pool checkout in a short retry loop. Use this when an
 * operation can fail at the checkout step (e.g. a half-closed socket
 * returned to the pool) rather than during the query itself. The
 * underlying driver doesn't always re-raise checkout errors as
 * connection errors, so this gives us a separate, fast retry path
 * that doesn't burn the full 15s `withDbRetry` budget on a
 * transitory pooler-side disconnect.
 */
export async function withPoolRetry<T>(
  fn: () => Promise<T>,
  opts: { maxAttempts?: number; timeoutMs?: number } = {},
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? POOL_CHECKOUT_MAX_ATTEMPTS
  const timeoutMs = opts.timeoutMs ?? POOL_CHECKOUT_TIMEOUT_MS
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await withTimeout(fn, timeoutMs)
    } catch (err) {
      lastError = err
      if (!isConnectionError(err) || attempt === maxAttempts) throw err
      const cap = 100 * 2 ** (attempt - 1)
      const delay = Math.floor(Math.random() * cap)
      log.warn("db.pool_retry", {
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
      statement_timeout: STATEMENT_TIMEOUT_SECONDS,
    },
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

/**
 * Pool ceiling for callers that want to bound the number of in-flight
 * DB operations in a single request to the pool size. Read by
 * `withDbConcurrency` and used directly by `RootDataProviders` to
 * keep checkout waits from cascading past the 15s client deadline.
 */
export function getDbPoolMax(): number {
  return POOL_MAX
}
