# Open Spot — Agent Notes

> Discovery: prefer `codebase-memory-mcp` (`search_graph`, `trace_path`,
> `get_code_snippet`, `get_architecture`) over grep/glob. Fall back to
> grep only for string literals, config values, and non-code files.

## Stack

- Next.js 16 (App Router, `cacheComponents`), React 19 RC, TypeScript 5.8 (`strict`, `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`).
- Drizzle ORM + `postgres-js` (NOT the Supabase JS client for runtime DB queries).
- Supabase for auth + storage only; `proxy.ts` refreshes the session via `supabase.auth.getClaims()`.
- Tailwind CSS 4 (`@tailwindcss/postcss`), `lucide-react`, `motion`, `react-leaflet`, `zustand`.
- Vitest + `happy-dom` (34 test files under `src/**/*.{test,spec}.{ts,tsx}`).

## Database connection — single source

Runtime, build, and CLI scripts ALL go through one helper:

```ts
import { getDatabaseUrl } from "@/lib/env"   // src/lib/env.ts
```

Resolution order: `SUPABASE_DATABASE_URL` → `SUPABASE_DIRECT_URL` → `null`.

| Var | Where | What |
| --- | --- | --- |
| `SUPABASE_DATABASE_URL` | local + Vercel | pgBouncer **Transaction** pooler, port 6543, IPv4. Same string in dev and prod. |
| `SUPABASE_DIRECT_URL` | **local only** | direct endpoint, port 5432. Used by `drizzle-kit` for DDL. Never set on Vercel (Vercel can't resolve `db.<project>.supabase.co`). |
| `SUPABASE_SECRET_KEY` | server-only (`sb_secret_…`) | Admin client (`@/lib/auth → getAdminClient`). NEVER prefix with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public (`sb_publishable_…`) | Replaces the legacy `anon` JWT. Read by the proxy and the SSR client. |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL. |

**The Transaction-vs-Session pooler trap is the #1 non-obvious gotcha** in this repo. Pick **Mode: Transaction** in the Supabase dashboard. Session mode saturates under Vercel concurrency with `EMAXCONNSESSION ... max clients reached in session mode - max clients are limited to pool_size: 15`. See `DEPLOY.md` §"Pick Transaction mode, not Session mode" for the full callout.

## DB client architecture (`src/lib/db/`)

- `client.ts` — singleton Drizzle client. `getDbClient()` is the only way to get `{ db, client }`. `closeDb()` for shutdown. Tuned for Vercel:
  - `max: 1` in production (one connection per function instance; prevents "thundering herd" against the pooler).
  - `max: 5` in development.
  - `prepare: false`, `ssl: "require"`, `connect_timeout: 5s`, `idle_timeout: 30s`, `max_lifetime: 240s` (rotates before pgBouncer's 600s `server_idle_timeout` to avoid 57014 on next query).
  - Server-side `statement_timeout: 8s` (set via libpq `options`) so a hung query returns 57014 fast.
- `withDbRetry(fn)` — 3 attempts, jittered exp backoff, 15s hard deadline per attempt. Retries on `isConnectionError` matches (57014, `ECONNRESET`, `EPIPE`, pool saturation, etc.).
- `withPoolRetry(fn)` — fast retry (3 attempts × 3s) for checkout-only failures, doesn't burn the 15s budget.
- `withDbConcurrency(n, fns)` — zero-dep p-limit clone in `concurrency.ts`. Use when fanning out N independent DB calls so checkout waits don't cascade past the 15s deadline.

## Repository pattern

`src/lib/repositories/index.ts` exposes async singletons:

```ts
const repo = await getSpotRepositoryAsync()         // spot
const repo = await getEventRepositoryAsync()        // event
const repo = await getSavedSpotsRepositoryAsync()   // savedSpots
const repo = await getPresetImagesRepositoryAsync() // presetImages
```

Each is wrapped in a `Proxy` that runs **every method through `withDbRetry`** automatically. Don't re-wrap calls — the retry happens at the method boundary.

Interfaces: `SpotRepository`, `EventRepository`, `SavedSpotsRepository`, `PresetImagesRepository` (see `*-repository.ts` siblings). Drizzle implementations: `drizzle-*-repository.ts`.

## Health check — two variants

- `runDbHealthCheck()` in `src/lib/services/health.ts` — raw `SELECT 1`, **no cache**. Use from CLIs and one-off probes.
- `checkDbHealth()` — `"use cache"` + `cacheTag("db-health")` + 30s/300s lifetime. Use from HTTP routes (`/api/health`).

**Do not call the cached variant from `tsx`** (CLIs). `"use cache"` throws outside the Next request lifecycle. `src/db/health-cli.ts` correctly uses `runDbHealthCheck` — keep it that way.

## Commands

```bash
pnpm dev            # next dev
pnpm build          # next build (DB-free; no env vars required to build)
pnpm start          # next start
pnpm lint           # eslint src
pnpm typecheck      # tsc --noEmit
pnpm test           # vitest run
pnpm test:watch     # vitest (watch)
pnpm db:generate    # drizzle-kit generate
pnpm db:push        # drizzle-kit push
pnpm db:migrate     # drizzle-kit migrate
pnpm db:studio      # drizzle-kit studio
pnpm db:apply       # apply supabase/migrations/*.sql in order, recorded in schema_migrations
pnpm db:deploy      # alias for db:apply
pnpm db:seed        # idempotent upserts (regions, countries, spot types, sport disciplines, event tiers, spot features, preset images, 11 base spots, 5 base events)
pnpm db:health      # runDbHealthCheck → one-line status, exit code
pnpm db:check-pool  # 10 parallel health probes; min/avg/max latency
```

**CLI scripts (`db:health`, `db:seed`, `db:apply`, `db:check-pool`, `backfill-empty-spot-images`) import `./load-env` first** (`src/db/load-env.ts`) which manually reads `.env.local` (override) then `.env` (no override). Next.js's built-in env loader does NOT run under `tsx` — without the explicit `import "./load-env"` the CLIs see an empty `process.env` and crash with "SUPABASE_DATABASE_URL is not configured".

Run a single test file or filter:

```bash
pnpm vitest run src/lib/auth.test.ts
pnpm vitest run -t "isAdminUser"
```

## Migrations

- Author: edit `src/db/schema.ts`, then `pnpm db:generate` → writes the next `supabase/migrations/<id>_<name>.sql`. Commit the file.
- Apply: `pnpm db:apply` from a local machine (no CI). The script splits each file on `--> statement-breakpoint` (drizzle-kit's marker) and runs each statement in a single transaction per file, recording in `schema_migrations`.
- **`drizzle.config.ts` reads `SUPABASE_DIRECT_URL` (preferred) → `DB_CONNETION_STRING` (legacy misspelling) → `DATABASE_URL`** for DDL. The runtime helper uses different env names; don't conflate them.
- `drizzle.config.ts` throws at import time if none of those three are set.

## Testing gotchas

- `server-only` is stubbed via a vitest alias (`test/server-only.ts` → `resolve.alias` in `vitest.config.ts`). Without this stub any test that transitively imports `src/lib/supabase/server`, `src/proxy.ts`, or `src/lib/repositories` blows up at import time. Keep the alias.
- `src/lib/log.ts` is a no-op when `NODE_ENV === "test"` — tests don't see console output from `log.*`.
- `vitest.setup.ts` registers `@testing-library/jest-dom/vitest` matchers.
- Path alias `@/*` → `./src/*` (mirrors `tsconfig.json`).

## API & route conventions

- Route handlers live under `src/app/api/**/route.ts` with co-located `route.test.ts` (34 of them). Mirrors the route in `src/lib/services/`.
- `src/lib/services/*` is the thin service layer consumed by both Server Components and route handlers. Services return domain types from `@/lib/types` (e.g. `Spot`, `Region`), never raw Drizzle rows.
- Heavy reads (`listSpots`, per-spot details) are wrapped in `"use cache"` + `cacheTag(...)` + `cacheLife({ revalidate, stale, expire })`. Writes call `revalidateTag("spots:list")` and the per-id/per-slug tags.
- `app/layout.tsx → RootDataProviders` does the BFF: one `Promise.all` for spots/user/regions/spot-types/preset-images, a second for weather + saved spots, then a single `SpotsProvider` context. `getWeatherForAllSpots(spots)` derives weather from the already-fetched spots — do NOT refetch the spot list inside weather.
- `RootDataProviders` calls `await connection()` to opt into dynamic rendering; cached `"use cache"` functions in the same tree are producible at build/preview time.

## Auth, dev, and admin

- Dev placeholder user has `id === "dev"` (`DEV_USER_ID` in `src/lib/user.ts`). Always treated as admin by `isAdminUser()` so the admin dashboard works without configuring Supabase. Real users come from Google OAuth via `@supabase/ssr` (proxy + `createSupabaseServerClient`).
- `ADMIN_EMAILS` is a CSV in env (case-insensitive).
- `src/lib/auth/server.ts` exposes guards: `requireUser`, `requireUserOrRedirect`, `requireAdmin`, `requireAdminOrRedirect`. The `*OrRedirect` variants `throw` via `next/navigation`'s `redirect()` — do not wrap in try/catch.
- `signOut()` revokes the refresh token via the admin client before clearing cookies. Best-effort; never block sign-out on a revoke failure.

## Things agents consistently get wrong here

- Forgetting `import "./load-env"` at the top of a new `src/db/*.ts` CLI script → "SUPABASE_DATABASE_URL is not configured" at startup.
- Calling `checkDbHealth` from a `tsx` script → `"use cache"` runtime error. Use `runDbHealthCheck`.
- Wrapping repository calls in another `withDbRetry` → double retry, doubled latency. Repositories already retry via the Proxy in `repositories/index.ts`.
- Setting `SUPABASE_DIRECT_URL` on Vercel → runtime fails (`getaddrinfo ENOTFOUND`). Local-only var.
- Picking Session-mode pooler → `EMAXCONNSESSION` under load. Transaction mode is the only one that works.
- Using `next/image` for a remote source not in `next.config.mjs → images.remotePatterns` → 400 at request time. Currently only `lh3.googleusercontent.com` is whitelisted.
- Wrapping `redirect()` in try/catch → swallowed by the framework. Use `*OrRedirect` variants only from Server Components, never from actions/route handlers (use the throwing variants there).
- Forgetting `import "server-only"` in a new file under `src/lib/supabase/` or `src/lib/auth/` → it can leak into a client bundle.

## Reference docs already in the repo

- `DEPLOY.md` — Vercel env vars, pooler mode deep-dive, Supabase Storage bucket, migration workflow.
- `DESIGN.md` — color/typography/spacing system; the UI is strictly monochrome with Archivo Narrow + Inter.
- `.env.example` — annotated env template with the pooler/Transaction-mode callout.
