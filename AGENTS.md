# AGENTS.md — Open Spot

Next.js 16 (App Router) + React 19 + TypeScript 5.8 (`strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`) + Tailwind 4 + Drizzle + Supabase + Zod 4 + Vitest 4. **pnpm 11 only** (Node 22). No monorepo, no Storybook, no `docker-compose.yml` checked in.

## TL;DR — most-isolated gotchas

- `src/proxy.ts`, not `middleware.ts` (Next.js 16 rename). Lives at `src/proxy.ts`.
- **Build is DB-free. The runtime reads exclusively from Postgres via Drizzle.** `SUPABASE_DATABASE_URL` (port 6543, pgBouncer Transaction pooler) is the single source of connection — set in both `.env.local` (local dev) and Vercel. Dev and prod share the same Supabase project, so the string is the same in both. The pooler hostname is IPv4-only and DNS-resolves from the Vercel function network; the direct endpoint (`db.<project>.supabase.co`, port 5432) is not reachable from Vercel and is kept only as a fallback for operators who point at it from a non-serverless environment. Local docker Postgres is no longer in the runtime path.
- **Rendering is fully dynamic.** Every async server component that reads data calls `await connection()` from `next/server` to opt into per-request rendering. The build produces a static shell only; all data is fetched at request time. There are no `use cache` / `cacheTag` / `cacheLife` calls in the data layer. Admin mutations call `revalidatePath(...)` (not `revalidateTag`) to force the next request to re-render.
- Admin identity is an env allow-list (`ADMIN_EMAILS`, CSV, case-insensitive). When Supabase is unconfigured, the dev placeholder user (`id === "dev"`, email `devopenspot@gmail.com`) is **always** admin and signed-in — `getServerUserFromCookies()` also returns it on any thrown error, so auth bugs can silently appear to work locally.
- `DB_CONNETION_STRING` is intentionally misspelled (no `I`) — kept for back-compat with CI. The new name is `SUPABASE_DIRECT_URL`.
- Supabase keys are the new `sb_publishable_*` (browser) / `sb_secret_*` (server) scheme. The legacy `anon` JWT and `SUPABASE_SERVICE_ROLE_KEY` are not read at runtime.
- `pnpm db:health | db:seed | db:apply` scripts run via `tsx` from the dev console and load `.env.local` then `.env` themselves via `src/db/load-env.ts`. Next.js env loading does not apply to them. They use the same `SUPABASE_DIRECT_URL`.
- Vercel env naming and the `spot-images` Storage bucket are documented in `DEPLOY.md` (not in this file).

## Prefer codebase-memory-mcp for code discovery

Use `search_graph` / `get_code_snippet` / `trace_path` / `query_graph` over grep/glob when looking for routes, repositories, server actions, or auth flow. The repo is already indexed.

## Commands

- `pnpm dev | build | start` — Next.js
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — `eslint src` (flat config; most React rules stripped from `eslint-config-next`, see `eslint.config.mjs`)
- `pnpm test` / `pnpm test:watch` — Vitest 4, happy-dom, `@testing-library/jest-dom/vitest`
- `pnpm db:generate | push | migrate | studio` — drizzle-kit against `src/db/schema.ts`
- `pnpm db:seed` → `tsx src/db/seed.ts` (typed TS constants from `src/db/seed-data/` → Postgres, idempotent upserts of regions/countries/spot_types/preset_images + 11 spot rows + 5 event rows)
- `pnpm db:apply` / `db:deploy` → `tsx src/db/apply-sql.ts` (splits on `--> statement-breakpoint`, one tx per file, records in `schema_migrations`)
- `pnpm db:health` → `tsx src/db/health-cli.ts` (uses the cached `checkDbHealth`)
- `pnpm exec vitest run path/to/file.test.ts` — run a single test file
- `pnpm exec vitest run -t "name"` — run tests whose name matches a substring

CI order (`.github/workflows/ci.yml`): `pnpm install --frozen-lockfile` → `typecheck` → `lint` → `test` → `pnpm db:apply` (only when `supabase/migrations/**` changed). Match this order locally before pushing.

## Environment quirks (read before touching env code)

- **Env validation at module load.** `src/lib/env.ts` is a Zod `.passthrough()` schema evaluated at import time — invalid envs throw, missing required keys fall back to defaults from `.env.example`. Anything that imports `@/lib/env` (transitively most of `src/lib/**`) blocks on this.
- **Connection strategy: single source = `SUPABASE_DATABASE_URL`.** Local dev and Vercel set the same env var to the same value (the same Supabase project). `getDatabaseUrl()` resolves `SUPABASE_DATABASE_URL` (pooler, port 6543) → `SUPABASE_DIRECT_URL` (port 5432, fallback) → `DB_CONNETION_STRING` (legacy typo, CI only) → `DATABASE_URL` (optional escape hatch) → `null`. The build never calls this — it is DB-free. The `postgres-js` client config (`prepare: false`, `ssl: "require"`, `max: 10`, `connect_timeout: 8`) is compatible with pgBouncer transaction mode.
- **Dev placeholder user.** `src/lib/user.ts` exports `getCurrentUser()` which always returns the same dev `User` with `id === "dev"`, `email === "devopenspot@gmail.com"`, `isAdmin: true`. Returned by `getServerUserFromCookies()` when `isSupabaseConfigured()` is false *or* on any thrown error in the auth chain. Implications:
  - Local dev without Supabase env is fully functional and the admin dashboard is reachable.
  - In local dev, a broken Supabase config or a thrown error in the cookie path **silently logs the user in as admin**. Don't trust "I tested it locally" as evidence of auth working — smoke-test the configured path.
- **Legacy env var names.** `SUPABASE_SERVICE_ROLE_KEY` and the `anon` JWT are no longer read. Use `SUPABASE_SECRET_KEY` (server) and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (browser).
- **Pooler first, direct as fallback.** `SUPABASE_DATABASE_URL` is the pgBouncer Transaction pooler (port 6543) — the runtime default. `SUPABASE_DIRECT_URL` is port 5432 (direct) — only reachable from non-Vercel networks; kept for operators who run the app outside Vercel. `getDatabaseUrl()` resolution order in `src/lib/env.ts`: `SUPABASE_DATABASE_URL` → `SUPABASE_DIRECT_URL` → `DB_CONNETION_STRING` → `DATABASE_URL` → `null`. The dev-console scripts (`db:seed`, `db:apply`, `db:health`) read through the same `getDatabaseUrl()`.
- **Postgres connection uses `ssl: "require"`** in `src/lib/db/client.ts` and `apply-sql.ts`. The Supabase pooler URL (`aws-0-<region>.pooler.supabase.com:6543`) and the direct URL (`db.<project>.supabase.co:5432`) both work. No local `docker-compose.yml` is checked in — `docker compose up -d infra-db` mentioned in `.env.example` requires you to bring the compose file yourself; ask before assuming infra is available.
- **Nominatim Usage Policy.** Set a descriptive `NOMINATIM_USER_AGENT` (default is a placeholder). `GET /api/geocode/reverse` is admin-only and uses `cache: "no-store"` to respect the 1 req/sec policy. The canonical example coordinates are in `nominatim-api.rest` (use those for manual smoke tests).

## Architecture (the few facts that change how you work)

- **Next.js 16 `proxy.ts`, not `middleware.ts`.** Located at `src/proxy.ts`. Refreshes the Supabase session cookie via `auth.getClaims()` (validates JWT locally / via auth server — no full `/user` round trip on every request). Skipped when Supabase env is not set.
- **App Router pages are Server Components by default.** Client components opt in with `"use client"` (e.g. `src/components/spot/SpotCard.tsx`, `src/components/layout/SpotsProvider.tsx`).
- **Admin lives at `src/app/admin/*`, guarded by `requireAdminOrRedirect("/admin")` in its `layout.tsx`.** Admin pages are **not** wrapped in the public `AppShell` or `SpotsProvider`. The admin shell reuses `Overlay`, `SurfaceCard`, `Eyebrow`, `PrimaryButton`, `UserAvatar`, `cn`, `log`. Write buttons are always enabled (the DB is the only read/write path). Admin routes are excluded from `src/app/sitemap.ts`.
- **Server actions live in `src/app/actions/`.** Always call `requireAdmin()` / `requireUser()` (`src/lib/auth/server.ts`):
  - `requireAdmin()` / `requireUser()` (actions, route handlers) → throw `Error("Admin only")` / `Error("Not signed in")`.
  - `requireAdminOrRedirect` / `requireUserOrRedirect` (Server Components) → throw `NEXT_REDIRECT`. **Do not wrap in try/catch** — the framework intercepts the throw.
  - On success, mutations call `revalidatePath(...)` for the affected page(s). `revalidateTag` is no longer used — the data layer is uncached, so the next request hits the DB and gets the fresh data directly.
- **Repository pattern (`src/lib/repositories/`)** has a single Drizzle implementation per entity (`DrizzleSpotRepository`, `DrizzleEventRepository`, `DrizzleSavedSpotsRepository`, `DrizzlePresetImagesRepository`). The async factories (`getSpotRepositoryAsync`, `getEventRepositoryAsync`, `getSavedSpotsRepositoryAsync`, `getPresetImagesRepositoryAsync`) are lazy singletons — first call constructs the Drizzle client, subsequent calls reuse it. There is no JSON fallback and no env-driven runtime branching. If the DB is unreachable, the Drizzle query throws.
- **Zod schemas in `src/lib/schemas/` are the single source of truth** for input shapes — `NewSpotSchema`, `SpotPatchSchema`, `NewSportEventSchema`, `SportEventPatchSchema`. They are `.strict()`; unknown keys throw. Server actions parse with `.parse(...)` (throws on invalid).
- **Cache Components is on** (`cacheComponents: true` in `next.config.mjs`) for the static shell + streaming model. The data layer is **uncached** — no `use cache` / `cacheTag` / `cacheLife` in the public read path. `src/lib/db/health.ts` is the only `use cache` consumer; it's a diagnostic, not a data-path component. Optimized package imports: `lucide-react` and `motion`.
- **Public/legacy env var renames are tracked in `src/lib/env.ts` comments** — they're a checklist of SPEC §E.4 renames.
- **Dimension reads are DB-only.** The base dimension data (regions, countries, spot types, sport disciplines, event tiers, spot features) is seeded by `src/db/seed.ts` from typed TS constants in `src/db/seed-data/` and read from the DB at runtime. The 11 base spot rows + 5 base event rows are also typed TS constants in `src/db/seed-data/`. Preset images are a `preset_images` DB table (Phase 2). The `Region[]` consumed by client components is assembled server-side by `src/lib/data/regions.ts` (`getRegionsForClient()`, called from `RootDataProviders`) and delivered to the client tree via the `useSpotsStore` Zustand store (hydrated by `SpotsProvider`). `useMapFilter`, `RegionFilter`, and `ExploreTab` all read regions from `useSpotsStore((s) => s.regions)`. `ImageSourceField` (admin) reads presets from `useSpotsStore((s) => s.presetImages)`.
- **`SPEC.md` is the Single Source of Truth (DB-Only) Refactor plan.** Phase 1 is implemented; Phase 2 (§14) drops the JSON seed files and moves preset images to a `preset_images` DB table. `SPEC-DATA-MODEL.md` is the historical data-model spec. `DEPLOY.md` covers Vercel env + the `spot-images` Storage bucket step. `DESIGN.md` is the design system source of truth.

## Database & migrations

- Drizzle schema: `src/db/schema.ts` (PostGIS `geometry(Point, 4326)` for `spots.location` and `sport_events.location`).
- SQL migrations: `supabase/migrations/*.sql`. The repo has a consolidated `0000_initial_data_model.sql` (per its file header: "Replaces the historical 0000–0008 sequence") and a `0001_preset_images.sql` (Phase 2 — adds the `preset_images` table). New migrations must split statements on `--> statement-breakpoint` — `apply-sql.ts` will not split otherwise and the live DB will reject multi-statement strings.
- `supabase/migrations/meta/` is drizzle-kit's bookkeeping (`_journal.json`, `*_snapshot.json`) — do not hand-edit.
- RLS is enabled on all domain tables (in `0000_initial_data_model.sql` and `0001_preset_images.sql`): public read on `regions` / `countries` / `spot_types` / `sport_disciplines` / `event_tiers` / `spot_features` / `preset_images` / `spots` / `sport_events` / `profiles`; owner-only writes on `spots`, `saved_spots`, `profiles`, and (in Phase 2) `preset_images`. Storage bucket policies scope objects to `spots/{userId}/{uuid}` folders.
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
- Drizzle schema + CLI: `src/db/`. Seed bootstrap data: `src/db/seed-data/` (Phase 2 — typed TS constants for taxonomies, regions, countries, preset images, and the 11 base spots + 5 base events).
- Client state: `src/stores/*` (Zustand) + `src/components/layout/SpotsProvider.tsx`.
- Seed bootstrap data: `src/db/seed-data/` (typed TS constants; the runtime never reads from JSON or bundled constants). All dimension data and preset images are in the DB. The 11 base spot rows + 5 base event rows are typed `NewSpot` / `NewSportEvent` consts in `src/db/seed-data/spots.ts` and `sport-events.ts`.
- Local repo skills (auto-loaded): `.agents/skills/` — the relevant ones for this codebase are `next-cache-components`, `next-best-practices`, `supabase`, `supabase-postgres-best-practices`, `drizzle`, `composition-patterns`, `react-best-practices`, `frontend-design`, `accessibility`, `seo`, `tailwind-css-patterns`, `typescript-advanced-types`. The `nodejs-*` and `vite` skills are not relevant (this is a Next.js app, not an Express/Vite project).
