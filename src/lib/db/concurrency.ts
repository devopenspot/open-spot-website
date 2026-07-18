// `withDbConcurrency` is a zero-dependency p-limit clone. It bounds
// the number of in-flight async functions to `n`, used by callers
// (e.g. `RootDataProviders`) that fan out N independent DB operations
// against a small pool. Without it, `Promise.all` queues every job
// inside the pool's internal waiter and a single slow query can block
// every other query past its 15s client deadline.

type AsyncFn = () => unknown

type AwaitedResults<T> = {
  [K in keyof T]: T[K] extends AsyncFn
    ? Awaited<ReturnType<T[K]>>
    : T[K]
}

export async function withDbConcurrency<const T extends ReadonlyArray<AsyncFn>>(
  limit: number,
  fns: T,
): Promise<AwaitedResults<T>> {
  if (limit < 1) {
    throw new Error(`withDbConcurrency: limit must be >= 1, got ${limit}`)
  }
  const total = fns.length
  if (total === 0) return [] as unknown as AwaitedResults<T>

  const results: unknown[] = new Array(total)
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
  return results as AwaitedResults<T>
}
