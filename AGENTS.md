# AGENTS.md — Open Spot

Next.js 16 (App Router) + React 19 + TypeScript 5.8 (`strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`) + Tailwind 4 + Drizzle + Supabase + Zod 4 + Vitest 4. **pnpm 11 only** (Node 22). No monorepo, no Storybook, no `docker-compose.yml` checked in.

## TL;DR — most-isolated gotchas

- `src/proxy.ts`, not `middleware.ts` (Next.js 16 rename). Lives at `src/proxy.ts`.
- Default read path is **JSON** (`SPOTS_DATA_SOURCE=json`); no DB needed to run `pnpm dev`. Admin writes require `db` mode.
- Admin identity is an env allow-list (`ADMIN_EMAILS`, CSV, case-insensitive). When Supabase is unconfigured, the dev placeholder user (`id === "dev"`, email `devopenspot@gmail.com`) is **always** admin and signed-in — `getServerUserFromCookies()` also returns it on any thrown error, so auth bugs can silently appear to work locally.
- `DB_CONNETION_STRING` is intentionally misspelled (no `I`) — kept for back-compat with CI. The new name is `SUPABASE_DIRECT_URL`.
- Supabase keys are the new `sb_publishable_*` (browser) / `sb_secret_*` (server) scheme. The legacy `anon` JWT and `SUPABASE_SERVICE_ROLE_KEY` are not read at runtime.
- `SPOTS_DATA_SOURCE=db` reads through `SUPABASE_DIRECT_URL` port 5432 — *not* the pgBouncer 6543 pooled URL.
- `pnpm db:health | db:seed | db:apply` scripts run via `tsx` and load `.env.local` then `.env` themselves via `src/db/load-env.ts`. Next.js env loading does not apply to them.
- Vercel env naming and the `spot-images` Storage bucket are documented in `DEPLOY.md` (not in this file).

## Prefer codebase-memory-mcp for code discovery

Use `search_graph` / `get_code_snippet` / `trace_path` / `query_graph` over grep/glob when looking for routes, repositories, server actions, or auth flow. The repo is already indexed.

## Commands

- `pnpm dev | build | start` — Next.js
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — `eslint src` (flat config; most React rules stripped from `eslint-config-next`, see `eslint.config.mjs`)
- `pnpm test` / `pnpm test:watch` — Vitest 4, happy-dom, `@testing-library/jest-dom/vitest`
- `pnpm db:generate | push | migrate | studio` — drizzle-kit against `src/db/schema.ts`
- `pnpm db:seed` → `tsx src/db/seed.ts` (loads JSON → Postgres, idempotent upserts of regions/countries/spot_types + spot/event rows)
- `pnpm db:apply` / `db:deploy` → `tsx src/db/apply-sql.ts` (splits on `--> statement-breakpoint`, one tx per file, records in `schema_migrations`)
- `pnpm db:health` → `tsx src/db/health-cli.ts` (uses the cached `checkDbHealth`)
- `pnpm exec vitest run path/to/file.test.ts` — run a single test file
- `pnpm exec vitest run -t "name"` — run tests whose name matches a substring

CI order (`.github/workflows/ci.yml`): `pnpm install --frozen-lockfile` → `typecheck` → `lint` → `test` → `pnpm db:apply` (only when `supabase/migrations/**` changed). Match this order locally before pushing.

## Environment quirks (read before touching env code)

- **Env validation at module load.** `src/lib/env.ts` is a Zod `.passthrough()` schema evaluated at import time — invalid envs throw, missing required keys fall back to defaults from `.env.example`. Anything that imports `@/lib/env` (transitively most of `src/lib/**`) blocks on this.
- **Dev placeholder user.** `src/lib/user.ts` exports `getCurrentUser()` which always returns the same dev `User` with `id === "dev"`, `email === "devopenspot@gmail.com"`, `isAdmin: true`. Returned by `getServerUserFromCookies()` when `isSupabaseConfigured()` is false *or* on any thrown error in the auth chain. Implications:
  - Local dev without Supabase env is fully functional and the admin dashboard is reachable.
  - In local dev, a broken Supabase config or a thrown error in the cookie path **silently logs the user in as admin**. Don't trust "I tested it locally" as evidence of auth working — smoke-test the configured path.
- **Legacy env var names.** `SUPABASE_SERVICE_ROLE_KEY` and the `anon` JWT are no longer read. Use `SUPABASE_SECRET_KEY` (server) and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (browser).
- **Direct Postgres URL only.** `SUPABASE_DIRECT_URL` is port 5432 (direct). The pooled `SUPABASE_DATABASE_URL` (port 6543) is documented in `.env.example` but ignored by the runtime today. `getDatabaseUrl()` resolution order in `src/lib/env.ts`: `SUPABASE_DIRECT_URL` → `DB_CONNETION_STRING` → `DATABASE_URL` → `null`.
- **Postgres connection uses `ssl: "require"`** in `src/lib/db/client.ts` and `apply-sql.ts`. Supabase direct URLs work; local docker default (`postgresql://dev:dev@localhost:5432/app`) is accepted by `postgres-js` even without `?sslmode=disable`. No local `docker-compose.yml` is checked in — `docker compose up -d infra-db` mentioned in `.env.example` requires you to bring the compose file yourself; ask before assuming infra is available.
- **Nominatim Usage Policy.** Set a descriptive `NOMINATIM_USER_AGENT` (default is a placeholder). `GET /api/geocode/reverse` is admin-only and uses `cache: "no-store"` to respect the 1 req/sec policy. The canonical example coordinates are in `nominatim-api.rest` (use those for manual smoke tests).

## Architecture (the few facts that change how you work)

- **Next.js 16 `proxy.ts`, not `middleware.ts`.** Located at `src/proxy.ts`. Refreshes the Supabase session cookie via `auth.getClaims()` (validates JWT locally / via auth server — no full `/user` round trip on every request). Skipped when Supabase env is not set.
- **App Router pages are Server Components by default.** Client components opt in with `"use client"` (e.g. `src/components/spot/SpotCard.tsx`, `src/components/layout/SpotsProvider.tsx`).
- **Admin lives at `src/app/admin/*`, guarded by `requireAdminOrRedirect("/admin")` in its `layout.tsx`.** Admin pages are **not** wrapped in the public `AppShell` or `SpotsProvider`. The admin shell reuses `Overlay`, `SurfaceCard`, `Eyebrow`, `PrimaryButton`, `UserAvatar`, `cn`, `log`. A persistent `DataModeNotice` banner is rendered when `SPOTS_DATA_SOURCE === "json"` and write buttons are disabled with a `title="DB mode required"` tooltip. Admin routes are excluded from `src/app/sitemap.ts`.
- **Server actions live in `src/app/actions/`.** Always call `requireAdmin()` / `requireUser()` (`src/lib/auth/server.ts`):
  - `requireAdmin()` / `requireUser()` (actions, route handlers) → throw `Error("Admin only")` / `Error("Not signed in")`.
  - `requireAdminOrRedirect` / `requireUserOrRedirect` (Server Components) → throw `NEXT_REDIRECT`. **Do not wrap in try/catch** — the framework intercepts the throw.
  - On success, mutations call `revalidateTag("spots" | "sport-events" | "saved-spots:<userId>" | "weather:spot:<id>", "max")` *and* `revalidatePath(...)` for the affected page.
- **Repository pattern (`src/lib/repositories/`)** has JSON and Drizzle implementations. The async factories (`getSpotRepositoryAsync` etc.) are the production path — they fall back to JSON when the DB is unhealthy (`checkDbHealth()` cache hit). Sync factories (`getSpotRepository()` etc.) exist for tests/CLI. Read `SPOTS_DATA_SOURCE` only through `getSpotsDataSource()` / `isSupabaseConfigured()` in `src/lib/env.ts`. JSON event repo writes throw `"sport_events writes are not supported in JSON mode"` by design.
- **Zod schemas in `src/lib/schemas/` are the single source of truth** for input shapes — `NewSpotSchema`, `SpotPatchSchema`, `NewSportEventSchema`, `SportEventPatchSchema`. They are `.strict()`; unknown keys throw. Server actions parse with `.parse(...)` (throws on invalid).
- **Cache Components is on** (`cacheComponents: true` in `next.config.mjs`). `src/lib/db/health.ts` uses the `"use cache"` directive + `cacheTag` / `cacheLife` (`revalidate: 30, stale: 30, expire: 300`). Optimized package imports: `lucide-react` and `motion`.
- **Public/legacy env var renames are tracked in `src/lib/env.ts` comments** — they're a checklist of SPEC §E.4 renames.
- **Dimension reads are data-source-aware.** `src/data.ts` (`REGIONS_DATA`, `COUNTRY_TO_REGION`, `COUNTRY_NAME_OVERRIDES`, `TERRAIN_OPTIONS`, etc.) is the **JSON-mode fallback + seed bootstrap only** — it seeds `regions` / `countries` / `spot_types` / `sport_disciplines` / `event_tiers` via `src/db/seed.ts`. In DB mode, the spot/event repositories read dimension tables directly. Server components that need dimension data in DB mode call the data-source-aware helpers in `src/lib/spots.ts` (e.g. `getTerrainOptionsFromSource()`) and pass the result to client components as props. `src/data.ts` is the seed source of truth, not a live read.
- **`SPEC.md` is the Admin Dashboard implementation plan** (status header still says "pending implementation" but the admin code under `src/app/admin/`, `src/app/actions/admin-*.ts`, `src/components/admin/**`, `src/app/api/geocode/reverse`, `src/lib/admin.ts`, and the related tests are already in the tree). `SPEC-DATA-MODEL.md` is the historical data-model spec. `DEPLOY.md` covers Vercel env + the `spot-images` Storage bucket step. `DESIGN.md` is the design system source of truth.

## Database & migrations

- Drizzle schema: `src/db/schema.ts` (PostGIS `geometry(Point, 4326)` for `spots.location` and `sport_events.location`).
- SQL migrations: `supabase/migrations/*.sql`. The repo currently has a single consolidated `0000_initial_data_model.sql` (per its file header: "Replaces the historical 0000–0008 sequence"). New migrations are drizzle-generated and must split statements on `--> statement-breakpoint` — `apply-sql.ts` will not split otherwise and the live DB will reject multi-statement strings.
- `supabase/migrations/meta/` is drizzle-kit's bookkeeping (`_journal.json`, `*_snapshot.json`) — do not hand-edit.
- RLS is enabled on all domain tables (currently in `0000_initial_data_model.sql`): public read on `regions` / `countries` / `spot_types` / `sport_disciplines` / `event_tiers` / `spot_features` / `spots` / `sport_events` / `profiles`; owner-only writes on `spots`, `saved_spots`, `profiles`. Storage bucket policies scope objects to `spots/{userId}/{uuid}` folders.
- The `spot-images` Supabase Storage bucket is **created out-of-band** (Dashboard / supabase CLI). The repo does not provision it.
- Drizzle-kit config (`drizzle.config.ts`) reads `DB_CONNETION_STRING` then `DATABASE_URL` then falls back to the local docker URL.

## Testing gotchas

- `vitest.config.ts` aliases `"server-only"` to `./test/server-only.ts`. **That stub exists** (it just `export {}`s) — without it, any test that transitively imports `server-only` (via `@/lib/supabase/server`, `@/lib/supabase/storage`, `@/lib/auth/server`, `src/proxy.ts`) will fail to load. If you delete it, every test touching those modules breaks. If the stub is missing in a fresh checkout, create it (one-line no-op module).
- `src/lib/log.ts` silences `console.*` when `NODE_ENV === "test"`, so test output stays clean.
- `src/lib/env.ts` validates with Zod at module load — set required envs (or rely on the defaults from `.env.example`) before running tests that import it.
- Server actions and route handlers are tested with `vi.mock("@/lib/auth/server", …)` to bypass the real guards — see `src/app/actions/admin-spots.test.ts` and `src/app/api/geocode/reverse/route.test.ts` for the pattern.
- happy-dom is the environment, not jsdom.

## Auth flow (so you do not duplicate it)

1. `src/proxy.ts` refreshes the Supabase session cookie on every request (skipped when Supabase env is not set).
2. `src/lib/auth.ts` `getServerUserFromCookies()` is the only function that turns a Supabase session into a `User`. It uses `getClaims()` (not `getUser()`), projects via `userFromClaims(...)` then re-applies `isAdminUser(...)` from the env allow-list. Returns the dev placeholder on any error.
3. `src/lib/auth/server.ts` exposes guards: `requireUserOrRedirect` / `requireAdminOrRedirect` for Server Components, `requireUser` / `requireAdmin` for actions and route handlers, plus `signInWithGoogle`, `signOut` (revokes the refresh token via the service-role client), `originFromRequest`, `sanitizeNext`.
4. `src/app/auth/callback/route.ts` exchanges the OAuth code, calls `ensureProfileRow(...)` to upsert into `public.profiles` via the service-role admin client (`getAdminClient()` in `src/lib/auth.ts`), then redirects to `?next=`.
5. `src/lib/user.ts` `getCurrentUser()` is the dev placeholder returned whenever `isSupabaseConfigured()` is false or the auth chain throws.

## Design system

`DESIGN.md` is the source of truth: monochrome, hard 0px corners, Archivo Narrow for headlines (uppercase), Inter for body, no shadows / blurs / gradients. Existing `src/components/ui/*` and the page chrome follow it — do not introduce rounded corners, color accents, or shadow utilities.

## Where things live

- Routes: `src/app/**/page.tsx`. Public: `explore/`, `spots/`, `map/`, `saved/`, `sport-events/`, `account/`, `login/`, `auth/callback/`. Admin: `admin/{layout,page,spots,events}` — the admin `layout.tsx` is the only place that calls `requireAdminOrRedirect`. `post/` is now a stub (`<PostClosedNotice />`) — the public post flow is closed.
- API routes: `src/app/api/**/route.ts` (`auth/`, `geocode/reverse/`, `health/`, `weather/`).
- Server actions: `src/app/actions/*.ts` (`spots.ts`, `admin-spots.ts`, `admin-events.ts`, `saved-spots.ts`).
- Auth / Supabase / DB plumbing: `src/lib/{auth,supabase,db,repositories,env,admin,user}/`.
- Drizzle schema + CLI: `src/db/`.
- Client state: `src/stores/*` (Zustand) + `src/components/layout/SpotsProvider.tsx`.
- Static data (categories, regions, presets, terrains, search terms): `src/data.ts` + `src/data/spots.json` + `src/data/sport-events.json` — **JSON-mode fallback + seed bootstrap only**. In DB mode, live dimension reads come from the `regions` / `countries` / `spot_types` tables.
- Local repo skills (auto-loaded): `.agents/skills/` — the relevant ones for this codebase are `next-cache-components`, `next-best-practices`, `supabase`, `supabase-postgres-best-practices`, `drizzle`, `composition-patterns`, `react-best-practices`, `frontend-design`, `accessibility`, `seo`, `tailwind-css-patterns`, `typescript-advanced-types`. The `nodejs-*` and `vite` skills are not relevant (this is a Next.js app, not an Express/Vite project).
