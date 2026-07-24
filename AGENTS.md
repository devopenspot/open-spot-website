# Open Spot — agent guide

High-contrast, monochrome skate-spot directory. Next.js 16 App Router + React 19 RC + Supabase (Postgres + PostGIS) + Drizzle ORM. Deployed on Vercel.

This file is for OpenCode sessions. Prefer `codebase-memory-mcp` (`search_graph`, `trace_path`, `get_code_snippet`, `query_graph`, `get_architecture`) for code discovery; fall back to grep/glob for non-code files, string literals, and config.

## Commands

| Task | Command |
| --- | --- |
| Dev server | `pnpm dev` |
| Production build (DB-free) | `pnpm build` |
| Type check | `pnpm typecheck` |
| Lint (scopes to `src`) | `pnpm lint` |
| API route tests (Vitest, happy-dom) | `pnpm test` / `pnpm test:watch` |
| Drizzle schema → SQL | `pnpm db:generate` |
| Drizzle push (apply schema diff without migration files) | `pnpm db:push` |
| Drizzle migrate (run committed migrations) | `pnpm db:migrate` |
| Apply `supabase/migrations/*.sql` to DB | `pnpm db:deploy` (alias of `db:apply`) |
| Seed dimensions + content | `pnpm db:seed` |
| Regenerate `src/db/seed-data/spots.ts` from a `spots.json` snapshot | `pnpm db:regen-spots` |
| DB health probe (single) | `pnpm db:health` |
| DB pool probe (10 parallel) | `pnpm db:check-pool` |
| Drizzle Studio | `pnpm db:studio` |

CLI scripts under `db:*` (every one that doesn't run through `drizzle-kit` or `vitest`) auto-loads `.env.local` then `.env` via `src/db/load-env.ts` — they do not need a running Next.js server.

No formatter (no Prettier). No Husky / pre-commit. CI workflows are not committed; verify locally with `pnpm lint && pnpm typecheck && pnpm test` before pushing.

**Test policy:** only API route tests under `src/app/api/**/route.test.ts` are kept. Component, hook, repository, and library tests are removed — there are no DTOs or fixtures to maintain beyond the route handler contract.

## Environment & secrets

All env is validated at import time by Zod in `src/lib/env.ts`. Missing or malformed values throw before the app starts. See `.env.example` for the canonical annotated list.

Critical points a future agent will get wrong:

- **Use the pgBouncer Transaction pooler (`SUPABASE_DATABASE_URL`, port 6543)** as the single source of connection for both local dev and Vercel. The direct hostname `db.<project>.supabase.co:5432` is NOT DNS-reachable from the Vercel function network.
- **In the Supabase dashboard pick Mode: `Transaction`** — the Session-mode pooler holds a server connection for the whole client session and saturates fast under Vercel concurrency (`EMAXCONNSESSION ... max clients reached`).
- **`SUPABASE_DIRECT_URL` is for local DDL only** (drizzle-kit, manual `psql`). It must NOT be set on Vercel.
- `drizzle.config.ts` reads `SUPABASE_DIRECT_URL` → `DB_CONNETION_STRING` (legacy typo) → `DATABASE_URL`. Use `DB_CONNETION_STRING` if you need to override locally.
- **`SUPABASE_SECRET_KEY`** is the service-role key (`sb_secret_...`). Server-only. Never prefix `NEXT_PUBLIC_`. Used by `getAdminClient()` in `src/lib/auth.ts` for RLS-bypassing ops.
- **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** is the `sb_publishable_...` key, safe to expose.
- **`ADMIN_EMAILS`** is a CSV (case-insensitive). It is the only path to admin access — there is no dev shortcut. `isAdminUser(user)` returns `true` only if `user.email` is in `ADMIN_EMAILS`.
- Weather: `API_KEY_WEATHER`, `URL_WEATHER`, `URL_WEATHER_IMG`. Nominatim: `NOMINATIM_URL` + `NOMINATIM_USER_AGENT` (Nominatim rejects unidentified clients).

### Supabase env-missing behavior

The app **starts** when Supabase env is missing. It does not crash at boot. Specifically:

- `proxy.ts` (`src/proxy.ts:11`) returns `NextResponse.next()` unchanged when `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is unset — the middleware is a no-op.
- `getServerUserFromCookies()` (`src/lib/auth.ts:55`) catches all errors and returns `null` — protected pages see "no user" and redirect to `/login?next=…`.
- The auth API routes `/api/auth/signin/google` and `/api/auth/signout` call `requireAuthConfig()` (`src/lib/auth/server.ts:19`), which throws `AuthConfigError` when the publishable key is unset; the routes catch it and return a `503` with `{ error: "Auth is not configured" }`.
- `getAdminClient()` returns `null` when `SUPABASE_SECRET_KEY` is missing; `ensureProfileRow()` short-circuits.

Net result: anonymous browsing works; protected pages redirect; auth and admin-write operations return 503. The `ADMIN_EMAILS` env var is the only way to get admin access — there is no dev placeholder user.

## Database

- Single consolidated migration: `supabase/migrations/0000_fresh.sql` (≈600 lines). Idempotent — every table/view/policy is `DROP ... IF EXISTS` then re-created. Safe to re-run on a populated DB; it wipes the public schema first.
- Drizzle schema lives in `src/db/schema.ts`; output goes to `supabase/migrations/`. The `meta/_journal.json` is the drizzle-kit bookkeeping.
- Statements are separated by the `--> statement-breakpoint` marker. The CLI applier (`src/db/apply-sql.ts`) splits on that marker — every `pnpm db:deploy`-applied statement must end in one.
- PostGIS is required (`CREATE EXTENSION IF NOT EXISTS postgis`). The `spots.location` and `sport_events.location` columns are `geometry(Point, 4326)` and use a custom Drizzle type in `src/db/schema.ts` that decodes EWKB hex from `postgres-js`.
- **User-keyed columns are `uuid`**, not `text`. `saved_spots.user_id` is FK'd to `auth.users(id)` with `ON DELETE CASCADE` (deleting an auth user purges their saves). `spots.created_by`, `sport_events.created_by` are nullable `uuid`. RLS compares `auth.uid()` directly to the column (no casts).
- Seed data is pure data in `src/db/seed-data/` (`cities.ts`, `countries.ts`, `iso-codes.ts`, `regions.ts`, `sport-events.ts`, `spots.ts`, `taxonomy.ts`). `src/db/seed.ts` is the single source of truth for the seed orchestrator. Every row is seeded with `createdBy: null` — ownership is only assigned when a real Supabase admin creates or edits the entity.
- `pnpm db:regen-spots` regenerates `spots.ts` from a `spots.json` snapshot — an internal tool, not a normal workflow.
- Pool sizing: production → `max: 1` per Vercel instance (anti-thundering-herd against pgBouncer); local → `max: 5`. `withDbRetry` wraps every repo method via a Proxy in `src/lib/repositories/index.ts` (3 attempts, 15s deadline, jittered backoff). 8s server `statement_timeout` is set via libpq `options`.

### Spot list pagination

- `SPOT_LIST_HARD_CAP = 500` is exported from `src/lib/schemas/spot.ts`. It is the single source of truth for "how many rows one query can return."
- `SpotQuerySchema.limit` is `z.number().int().positive().max(SPOT_LIST_HARD_CAP).optional()` — the limit is **optional**, with no default. When absent, the repository falls back to the cap.
- The repository's `list()` (`src/lib/repositories/drizzle-spot-repository.ts:52`) returns `{ items, nextCursor }`. `nextCursor` is non-null when the page equals the cap; callers that need more rows must pass the cursor back as `query.cursor` and iterate.
- The home and map layouts call `listSpots()` with no args, so they get the full set within the cap. The sitemap does the same. None of them need to pass `limit` explicitly.
- **Trigger to revisit**: when `select count(*) from spots` exceeds 500, either raise the cap (one-line constant change) or add a `listAllSpots()` helper that iterates `nextCursor` internally. Do not raise the cap casually — 500 is also the safety net against an accidental "give me a million" request.

## Auth

- `src/proxy.ts` is the Next.js request middleware (Next 16 uses `proxy.ts`; this is intentional, not a typo of `middleware.ts`). It refreshes the Supabase session cookie via `supabase.auth.getClaims()` (no network round trip — JWT is verified locally or against the auth server). Matcher excludes static assets and image extensions.
- `getServerUserFromCookies()` returns `User | null` based purely on the real session. `isAdminUser(user)` returns `true` only if `user.email` is in `ADMIN_EMAILS`.
- Guards in `src/lib/auth/server.ts`: `requireUserOrRedirect` / `requireAdminOrRedirect` (Server Components, throw `redirect()`), `requireUser` / `requireAdmin` (server actions and route handlers, throw `Error`). Pages that need a session must call the appropriate guard.
- OAuth: `signInWithGoogle` (Google provider, scopes `email profile`). Callback lands at `/auth/callback/route.ts` which exchanges the code, calls `ensureProfileRow()` to upsert `public.profiles`, and redirects to the sanitized `next` param.
- Sign-out: `signOut()` revokes the refresh token server-side via `getAdminClient().auth.admin.signOut(accessToken)` before clearing cookies, so a leaked refresh token cannot outlive the click.
- Client-side: `useUser()` (re-exported by `src/hooks/useUser.ts` from `src/lib/user-context`) returns `User | null`. `useSignOut()` exposes `{ signOut, pending, isSignedIn: user !== null }`. `SignInLink` renders only when `user` is `null`; `SignOutButton` renders only when `user` is non-null. `useSavedSpots(null)` no-ops the network call and toasts `"Sign in to save spots"` when the user tries to toggle.

## Architecture

```
src/
  app/               Next.js App Router
    api/             Route handlers (REST shape: ?q=&types=&ids=&near=lat,lon,radius&cursor=&limit=)
    admin/           Operator dashboard; layout calls requireAdminOrRedirect
    auth/callback/   OAuth code exchange
    login/           Sign-in page (Google OAuth entry)
    account/         Server component (requireUserOrRedirect)
    spots/[id]/      Spot detail (calls connection() → dynamic)
    sport-events/    Events list + detail
    saved/, post/    User-only (requireUserOrRedirect)
    explore/         Home page (curated grid, no map)
    map/             Map page (full-bleed Leaflet + sidebar)
    sitemap.ts, robots.ts, manifest.ts, opengraph-image.tsx, icon.tsx, apple-icon.tsx
    error.tsx, global-error.tsx, not-found.tsx, loading.tsx
  components/        by feature: admin/, explore/, map/, post/, saved/, shell/, spot/, sport-events/, feedback/, ui/
  db/                schema, seed, apply-sql, health-cli, pool-check-cli, load-env, seed-data/{cities,countries,iso-codes,regions,sport-events,spots,taxonomy}
  hooks/             useSavedSpots (BroadcastChannel), useSignOut, useUser, useUserLocation, useMapFilter, useDistanceUnit, useTemperatureUnit, useToast, useBodyScrollLock, useFocusTrap, useKeyboardShortcuts, useNavList
  lib/
    auth.ts          getServerUserFromCookies, userFromClaims, ensureProfileRow, getAdminClient
    auth/server.ts   Guards (requireUser*, requireAdmin*, getSessionUser, signInWithGoogle, signOut) + AuthConfigError
    admin.ts         isAdminUser (ADMIN_EMAILS allow-list)
    env.ts           Zod-validated env + getDatabaseUrl/getSupabaseUrl/getSupabasePublishableKey/getSupabaseServiceRoleKey/getSpotImagesBucket
    db/client.ts     Drizzle + postgres-js client, withRetry / withDbRetry / withPoolRetry, TimeoutError
    db/concurrency.ts  p-limit clone used by server layouts to fan out DB calls
    repositories/    Drizzle*Repository implementations + Proxy-based retry + interface modules
    services/        Cached service layer ("use cache" + cacheTag + cacheLife) over repos
    supabase/        server.ts (createSupabaseServerClient), storage.ts (withImageUrls)
    geocode/         Nominatim response projection
    weather/         OpenWeather mappers + cached bundle (current + forecast per spot)
    schemas/         Zod schemas (spot.ts, event.ts) — single runtime mirror of DB CHECK constraints; home of SPOT_LIST_HARD_CAP
    sport-events/    Sport-event domain helpers
    spots/           Spot domain helpers (geo, suggestions)
    user.ts          User interface
    user-context.tsx, saved-spots-context.tsx   React Context (server-rendered initial values)
    cn.ts, constants.ts, log.ts, nav.ts, system-info.ts, types.ts
  proxy.ts           Next 16 middleware (Supabase session refresh)
  stores/            zustand: spots-store, ui-store, user-location-store, map-store, preferences-store, index.ts, HydrationGate.tsx, persist-helpers.ts
  types/             Shared TS types (saved-spot, sport-events, weather, vitest.d.ts)
scripts/             regen-spots-seed.ts (one-off seed regeneration tool)
test/                Vitest stubs (server-only no-op)
```

Service layer is the read path: `src/lib/services/*.ts` wrap repo calls with `"use cache"` + `cacheTag(...)` + `cacheLife({revalidate, stale, expire})`. Mutations call `revalidateTag(tag, LIST_CACHE_LIFE)` (Next 16 requires the profile arg). Cached functions MUST NOT call `connection()` — only the page/route callers do.

## Conventions

- **Path alias**: `@/*` → `src/*` (set in `tsconfig.json` and `vitest.config.ts`).
- **TS strict + noUncheckedIndexedAccess** + `noUnusedLocals/Parameters`. ESLint enforces `@typescript-eslint/no-unused-vars` with `^_` ignore pattern. `no-unused-vars` is explicitly turned off.
- **Tailwind v4** via `@tailwindcss/postcss`. No `tailwind.config.*` — design tokens live in `DESIGN.md` (YAML front matter) and are applied directly with arbitrary value classes.
- **`cn()` is local** (in `src/lib/cn.ts`) — no `clsx` / `tailwind-merge` dependency.
- **Lucide icons + motion are optimized** via `experimental.optimizePackageImports` in `next.config.mjs`.
- **Next 16 cache components** are enabled (`cacheComponents: true` in `next.config.mjs`).
- **ESLint config is curated**: `eslint.config.mjs` strips the `react/*` rules that eslint-config-next ships for stable React from the 21-rule set in `REACT_RULES_TO_SKIP`, because the project runs on React 19 RC. Don't re-enable them without testing the rule on the current RC.
- **API routes accept comma-separated arrays** for `types` and `ids`, and `near=lat,lon,radiusMeters` — the Zod query in `src/app/api/spots/route.ts` pre-shapes the input.
- **No fallback / in-memory source of truth.** Every read hits the DB. There is no `pickFallbackImage` (a spot must have an uploaded or URL image), no weather forecast fallback (empty data → UI shows "no data"), no `STATUS_LABELS`/`TIER_DISPLAY` hardcoded maps (display names come from `event_tiers.name` joined into the row).
- **State**: zustand stores are client-only and gated by `<HydrationGate />` (calls `useUIStore.persist.rehydrate()` on mount). `useSavedSpots` uses `BroadcastChannel` to sync toggles across tabs.
- **Server layout data fetching**: the home (`src/app/layout.tsx`) and map (`src/app/map/layout.tsx`) providers fan out DB calls via `withDbConcurrency(poolMax, [...])` (a p-limit clone) so a single slow query doesn't block the others. The pool size comes from `getDbPoolMax()` (1 on Vercel, 5 locally).

## Testing gotchas

- Vitest config (`vitest.config.ts`) aliases `server-only` to `test/server-only.ts`. The real `server-only` package throws at import time when bundled for the client; the stub is a no-op so transitive imports through `src/lib/repositories`, `src/lib/supabase/server`, `src/proxy.ts` load in `happy-dom`.
- Setup file is a single line: `import "@testing-library/jest-dom/vitest"` (in `vitest.setup.ts`).
- Route handler tests (e.g. `src/app/api/saved-spots/route.test.ts`) mock `@/lib/auth/server` and `@/lib/services/...` with `vi.mock` — see the existing pattern before adding new route tests.
- The dev server / dev CLI scripts log via `src/lib/log.ts`, which is a no-op when `NODE_ENV === "test"`. Don't write tests that assert on `console.log` output.
- The `checkDbHealth()` service (the one with `"use cache"`) throws when called outside the Next.js request lifecycle (e.g. under `tsx`). CLI scripts MUST use `runDbHealthCheck()` — that's the function `src/db/health-cli.ts` and `src/db/pool-check-cli.ts` call.
- `proxy.ts` is excluded from the test environment (no request lifecycle), so it never runs in Vitest.
