// `withDbConcurrency` is a zero-dependency p-limit clone. It bounds
// the number of in-flight async functions to `n`, used by callers
// (e.g. `RootDataProviders`) that fan out N independent DB operations
// against a small pool. Without it, `Promise.all` queues every job
// inside the pool's internal waiter and a single slow query can block
// every other query past its 15s client deadline.

export async function withDbConcurrency<T>(
  limit: number,
  fns: ReadonlyArray<() => Promise<T>>,
): Promise<T[]> {
  if (limit < 1) {
    throw new Error(`withDbConcurrency: limit must be >= 1, got ${limit}`)
  }
  const total = fns.length
  if (total === 0) return []

  const results: T[] = new Array(total)
  let cursor = 0

  async function worker(): Promise<void> {
    while (true) {
      const i = cursor++
      if (i >= total) return
      const fn = fns[i]
      if (!fn) return
      results[i] = await fn()
    }
  }

  const workerCount = Math.min(limit, total)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  return results
}
