# AGENTS.md — Open Spot

Next.js 16 (App Router, Cache Components) + React 19 + TypeScript 5.8 (`strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`) + Tailwind 4 + Drizzle + Supabase + Zod 4 + Vitest 4. **pnpm 11 only** (Node 22). No monorepo (despite `pnpm-workspace.yaml`, it's a single-package config), no Storybook, no `docker-compose.yml` checked in.

The data layer is **DB-only at runtime** — Phase 1 and Phase 2 of the "Single Source of Truth (DB-Only) Refactor" are both implemented in code. `src/data.ts` and `src/data/*.json` are gone; seed data lives as typed TS constants in `src/db/seed-data/`. `src/lib/spots.ts` is also gone (only `src/lib/spots/geo.ts` remains).

## TL;DR — most-isolated gotchas

- `src/proxy.ts`, not `middleware.ts` (Next.js 16 rename). Refreshes the Supabase session via `auth.getClaims()` (no `/user` round trip).
- **Build is DB-free. The runtime reads exclusively from Postgres via Drizzle.** Every async server component that reads data calls `await connection()` from `next/server` to opt into per-request rendering — the build produces a static shell only. There is no `use cache` / `cacheTag` / `cacheLife` in the data layer. Admin mutations call `revalidatePath(...)` (not `revalidateTag`) to force the next request to re-render.
- **Saved spots are server-only.** `src/hooks/useSavedSpots.ts` keeps an in-memory `Set<string>` per user (module-level `userStores` map) and pushes every change through `toggleSavedAction` in `src/app/actions/saved-spots.ts`. There is no `localStorage` mirror — the previous v1/v2 keys are deleted on first mount of the new code. Cross-tab sync is done via `BroadcastChannel('openspot:saved-spots:<userId>')`. The hook seeds from `SavedSpotsProvider`'s server-fetched `initial` (fetched in `RootDataProviders`, even for the dev placeholder user).
- **Connection: `SUPABASE_DATABASE_URL` (pgBouncer Transaction pooler, port 6543) is the single source** — set in both `.env.local` and Vercel. The direct endpoint (`db.<project>.supabase.co`, port 5432) is not reachable from the Vercel function network. Local dev and prod point at the same Supabase project.
- **Use the Transaction mode pooler URL, not the Session mode pooler URL.** They share the same host/port but Session mode holds a server connection for the entire client session and saturates fast under serverless concurrency (`EMAXCONNSESSION ... max clients reached in session mode`). The `postgres-js` client uses `prepare: false`, `ssl: "require"`, `max: 5`, `max_lifetime: 1800` — compatible with pgBouncer Transaction.
- Admin identity is an env allow-list (`ADMIN_EMAILS`, CSV, case-insensitive). When Supabase is unconfigured, the dev placeholder user (`id === "dev"`, `devopenspot@gmail.com`, `isAdmin: true`) is **always** signed in. `getServerUserFromCookies()` also returns it on any thrown error in the auth chain — a broken Supabase config silently logs you in as admin locally.
- `DB_CONNETION_STRING` is intentionally misspelled (no `I`) — kept for CI back-compat. The new name is `SUPABASE_DIRECT_URL`.
- Supabase keys are the new `sb_publishable_*` (browser) / `sb_secret_*` (server) scheme. The legacy `anon` JWT and `SUPABASE_SERVICE_ROLE_KEY` env var are not read by the runtime.
- Vercel env naming, the `spot-images` Storage bucket creation step, and the Session-vs-Transaction pooler callout live in `DEPLOY.md` (not here).

## Prefer codebase-memory-mcp for code discovery

Use `search_graph` / `get_code_snippet` / `trace_path` / `query_graph` over grep/glob when looking for routes, repositories, server actions, or auth flow. The repo is already indexed.

## Commands

- `pnpm dev | build | start` — Next.js
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — `eslint src` (flat config; most React rules stripped from `eslint-config-next`, see `eslint.config.mjs`)
- `pnpm test` / `pnpm test:watch` — Vitest 4, happy-dom, `@testing-library/jest-dom/vitest`
- `pnpm exec vitest run path/to/file.test.ts` — run a single test file
- `pnpm exec vitest run -t "name"` — run tests matching a substring
- `pnpm db:generate | push | migrate | studio` — drizzle-kit against `src/db/schema.ts`
- `pnpm db:seed` → `tsx src/db/seed.ts` (typed TS constants from `src/db/seed-data/` → Postgres; idempotent upserts of regions, countries, spot types, sport disciplines, event tiers, spot features, preset images, 11 spot rows, 5 event rows)
- `pnpm db:apply` / `db:deploy` → `tsx src/db/apply-sql.ts` (splits on `--> statement-breakpoint`, one tx per file, records in `schema_migrations`). Runs `0000_fresh.sql` (single consolidated migration).
- `pnpm db:health` → `tsx src/db/health-cli.ts` (uses the cached `checkDbHealth`)

CI order (`.github/workflows/ci.yml`): `pnpm install --frozen-lockfile` → `typecheck` → `lint` → `test` → `pnpm db:apply` (only when `supabase/migrations/**` changed). Match this order locally before pushing.

## Environment quirks (read before touching env code)

- **Validation at module load.** `src/lib/env.ts` is a Zod `.passthrough()` schema evaluated at import time. Invalid envs throw; missing required keys fall back to defaults from `.env.example`. Anything that imports `@/lib/env` (transitively most of `src/lib/**`) blocks on this.
- **Connection resolution order** in `getDatabaseUrl()` (`src/lib/env.ts`): `SUPABASE_DATABASE_URL` (port 6543, pooler — runtime default) → `SUPABASE_DIRECT_URL` (port 5432, direct — operator override) → `DB_CONNETION_STRING` (legacy typo, CI) → `DATABASE_URL` (optional escape hatch) → `null`. The build never calls this — it's DB-free. The dev-console scripts (`db:seed`, `db:apply`, `db:health`) load `.env.local` then `.env` themselves via `src/db/load-env.ts`; Next.js env loading does not apply to them.
- **Dev placeholder user.** `src/lib/user.ts` `getCurrentUser()` always returns `id === "dev"`, `isAdmin: true`. `getServerUserFromCookies()` returns it when `isSupabaseConfigured()` is false *or* on any thrown error in the auth chain. Implications:
  - Local dev without Supabase env is fully functional and the admin dashboard is reachable.
  - In local dev, a broken Supabase config or a thrown error in the cookie path **silently logs the user in as admin**. Don't trust "I tested it locally" as evidence of auth working — smoke-test the configured path.
- **No local `docker-compose.yml` is checked in.** `.env.example` mentions `docker compose up -d infra-db`, but the compose file is yours to bring; ask before assuming infra is available. The default dev path is to point `.env.local` at the same Supabase project Vercel uses.
- **Nominatim Usage Policy.** Set a descriptive `NOMINATIM_USER_AGENT` (default is a placeholder). `GET /api/geocode/reverse` is admin-only and uses `cache: "no-store"` to respect the 1 req/sec policy. The canonical example coordinates are in `nominatim-api.rest` (use those for manual smoke tests).

## Architecture (the few facts that change how you work)

- **Next.js 16 `proxy.ts`, not `middleware.ts`.** Located at `src/proxy.ts`. Skipped when Supabase env is not set.
- **App Router pages are Server Components by default.** Client components opt in with `"use client"` (e.g. `src/components/spot/SpotCard.tsx`, `src/components/layout/SpotsProvider.tsx`).
- **Admin lives at `src/app/admin/*`, guarded by `requireAdminOrRedirect("/admin")` in its `layout.tsx`.** Admin pages are not wrapped in the public `AppShell` or `SpotsProvider`. The admin shell reuses `Overlay`, `SurfaceCard`, `Eyebrow`, `PrimaryButton`, `UserAvatar`, `cn`, `log`. Admin routes are excluded from `src/app/sitemap.ts`.
- **Server actions live in `src/app/actions/`.** Always call `requireAdmin()` / `requireUser()` (`src/lib/auth/server.ts`):
  - `requireAdmin()` / `requireUser()` (actions, route handlers) → throw `Error("Admin only")` / `Error("Not signed in")`.
  - `requireAdminOrRedirect` / `requireUserOrRedirect` (Server Components) → throw `NEXT_REDIRECT`. **Do not wrap in try/catch** — the framework intercepts the throw.
  - On success, mutations call `revalidatePath(...)` for the affected page(s).
- **Repository pattern (`src/lib/repositories/`)** has a single Drizzle implementation per entity (`DrizzleSpotRepository`, `DrizzleEventRepository`, `DrizzleSavedSpotsRepository`, `DrizzlePresetImagesRepository`). The async factories (`getSpotRepositoryAsync`, etc.) are lazy singletons — first call constructs the Drizzle client, subsequent calls reuse it. There is no JSON fallback and no env-driven runtime branching. If the DB is unreachable, the Drizzle query throws.
- **Zod schemas in `src/lib/schemas/` are the single source of truth** for input shapes — `NewSpotSchema`, `SpotPatchSchema`, `NewSportEventSchema`, `SportEventPatchSchema`. They are `.strict()`; unknown keys throw. Server actions parse with `.parse(...)` (throws on invalid).
- **Cache Components is on** (`cacheComponents: true` in `next.config.mjs`) for the static shell + streaming model. The data layer is **uncached** — no `use cache` / `cacheTag` / `cacheLife` in the public read path. `src/lib/db/health.ts` is the only `use cache` consumer; it's a diagnostic. Optimized package imports: `lucide-react` and `motion`.
- **Dimension reads are DB-only.** Regions, countries, spot types, sport disciplines, event tiers, spot features, and preset images are seeded by `src/db/seed.ts` from typed TS constants in `src/db/seed-data/` and read from the DB at runtime. The 11 base spot rows + 5 base event rows are typed `NewSpot` / `NewSportEvent` consts in `src/db/seed-data/spots.ts` and `sport-events.ts`. Preset images are a `preset_images` DB table (Phase 2).
- **Server-only data assembly** lives in `src/lib/data/` (e.g. `getRegionsForClient()` in `regions.ts`, `getSpotTypesForClient()` in `spot-types.ts`). The client tree reads them through `useSpotsStore` (hydrated by `SpotsProvider` in `RootDataProviders`).
- **Zustand `useSpotsStore` carries 4 reference-data slices** hydrated once at the root layout: `spots`, `regions`, `presetImages`, `spotTypes`. `useMapFilter`, `RegionFilter`, `ExploreTab`, and admin `ImageSourceField` all read from this store. The `useMapFilter` test seeds the store in `beforeEach`.
- `DEPLOY.md` covers Vercel env + the `spot-images` Storage bucket step. `DESIGN.md` is the design system source of truth.

## Database & migrations

- Drizzle schema: `src/db/schema.ts` (PostGIS `geometry(Point, 4326)` for `spots.location` and `sport_events.location`).
- SQL migrations: `supabase/migrations/*.sql`. The repo has a single consolidated `0000_fresh.sql` covering the full schema (extensions, all dimension tables including `preset_images`, all content tables, join tables, the `sport_events_with_status` view, RLS for every domain table, and the `spot-images` storage policies). The file is **fully idempotent** — every table, the view, and each storage policy are dropped via `… IF EXISTS` before being (re)created, so re-running `pnpm db:apply` on a populated DB wipes the schema and rebuilds it. New migrations must split statements on `--> statement-breakpoint` — `apply-sql.ts` will not split otherwise and the live DB will reject multi-statement strings.
- **DB-level CHECK constraints** validate every domain table at INSERT/UPDATE time: length checks on every slug/name/url/city, `crowd_level BETWEEN 0 AND 100`, `country_code ~ '^[A-Z]{2}$'`, `iso2 ~ '^[A-Z]{2}$'`, `iso3 ~ '^[A-Z]{3}$'` (nullable), `sort_order >= 0`, email format on `profiles.email`. The runtime Zod schemas in `src/lib/schemas/` are the application-side mirror. The Drizzle schema (`src/db/schema.ts`) does not model CHECKs — they live in the SQL file.
- `supabase/migrations/meta/` is drizzle-kit's bookkeeping (`_journal.json`, `*_snapshot.json`) — do not hand-edit.
- RLS is enabled on all domain tables: public read on `regions` / `countries` / `spot_types` / `sport_disciplines` / `event_tiers` / `preset_images` / `spots` / `sport_events` / `event_sports` / `spot_sports` / `profiles`; owner-only writes on `spots`, `saved_spots`, `profiles`, `preset_images`. Storage bucket policies scope objects to `spots/{userId}/{uuid}` folders.
- The `spot-images` Supabase Storage bucket is **created out-of-band** (Dashboard / supabase CLI). The repo does not provision it.
- Drizzle-kit config (`drizzle.config.ts`) reads `SUPABASE_DIRECT_URL` → `DB_CONNETION_STRING` → `DATABASE_URL`. Use a direct endpoint here, not the pooler.

## Testing gotchas

- `vitest.config.ts` aliases `"server-only"` to `./test/server-only.ts`. **That stub exists** (it just `export {}`s) — without it, any test that transitively imports `server-only` (via `@/lib/supabase/server`, `@/lib/supabase/storage`, `@/lib/auth/server`, `src/proxy.ts`) will fail to load. If you delete it, every test touching those modules breaks.
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

- Routes: `src/app/**/page.tsx`. Public: `explore/`, `spots/`, `map/`, `saved/`, `sport-events/`, `account/`, `login/`, `auth/callback/`. Admin: `admin/{layout,page,spots,events}` — the admin `layout.tsx` is the only place that calls `requireAdminOrRedirect`. `post/` is a stub (`<PostClosedNotice />`) — the public post flow is closed.
- API routes: `src/app/api/**/route.ts` (`auth/{session,signin,signout}/`, `geocode/reverse/`, `health/`).
- Server actions: `src/app/actions/*.ts` (`spots.ts`, `admin-spots.ts`, `admin-events.ts`, `saved-spots.ts`; matching `*.test.ts` files sit next to them).
- Auth / Supabase / DB plumbing: `src/lib/{auth,supabase,db,repositories,env,admin,user,data}/`. `src/lib/data/` is server-only and assembles rows into client-shaped data (`getRegionsForClient`, `getSpotTypesForClient`).
- Drizzle schema + CLI: `src/db/`. Seed bootstrap data: `src/db/seed-data/` (typed TS constants; the runtime never reads from JSON or bundled constants).
- Client state: `src/stores/*` (Zustand) + `src/components/layout/SpotsProvider.tsx`.
- Local repo skills (auto-loaded): `.agents/skills/` — the relevant ones for this codebase are `next-cache-components`, `next-best-practices`, `supabase`, `supabase-postgres-best-practices`, `drizzle`, `composition-patterns`, `react-best-practices`, `frontend-design`, `accessibility`, `seo`, `tailwind-css-patterns`, `typescript-advanced-types`. The `nodejs-*` and `vite` skills are not relevant (this is a Next.js app, not an Express/Vite project).
