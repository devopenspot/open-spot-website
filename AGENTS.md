# AGENTS.md — Open Spot

Next.js 16 (App Router) + React 19 + TypeScript 5.8 (strict, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`) + Tailwind 4 + Drizzle + Supabase + Zod 4 + Vitest 4. pnpm 11 only.

## Prefer codebase-memory-mcp for code discovery

Use `search_graph` / `get_code_snippet` / `trace_path` / `query_graph` over grep/glob when looking for routes, repositories, server actions, or auth flow. The repo is already indexed.

## Commands

- `pnpm dev | build | start` — Next.js
- `pnpm lint` — `eslint src` (flat config, many React rules stripped from `eslint-config-next`; see `eslint.config.mjs`)
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm test` / `pnpm test:watch` — Vitest 4, happy-dom, `@testing-library/jest-dom/vitest`
- `pnpm db:generate | push | migrate | studio` — drizzle-kit against `src/db/schema.ts`
- `pnpm db:seed` → `tsx src/db/seed.ts` (loads JSON → Postgres, idempotent upserts)
- `pnpm db:apply` / `db:deploy` → `tsx src/db/apply-sql.ts` (split on drizzle's `--> statement-breakpoint`, wraps each file in a tx, records in `schema_migrations`)
- `pnpm db:health` → `tsx src/db/health-cli.ts` (uses the cached `checkDbHealth`)

CI order (`.github/workflows/ci.yml`): `install --frozen-lockfile` → `typecheck` → `lint` → `test` → `db:apply` with `DB_CONNETION_STRING`. Match this order locally before pushing.

## Environment quirks (read before touching env code)

- **Read path is JSON by default.** `SPOTS_DATA_SOURCE=json` (default) reads `src/data/spots.json` and `src/data/sport-events.json`; no database required. `db` mode requires a reachable Postgres.
- **`DB_CONNETION_STRING` is intentionally misspelled** (missing the `I`) — kept for back-compat with the CI workflow. The new name is `SUPABASE_DIRECT_URL` (SPEC §E.4). See `getDatabaseUrl()` in `src/lib/env.ts` for the resolution order.
- **Supabase keys use the new `sb_publishable_*` / `sb_secret_*` scheme.** The legacy `SUPABASE_SERVICE_ROLE_KEY` and the `anon` JWT key are no longer read at runtime. The publishable key is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; the server-only secret is `SUPABASE_SECRET_KEY`.
- **Admin gate is an env allow-list, not a DB role.** `ADMIN_EMAILS` (CSV, case-insensitive). When Supabase is unconfigured, the dev placeholder user `id === "dev"` (`src/lib/user.ts`) is always admin and signed-in.
- **Direct Postgres URL only.** `SUPABASE_DIRECT_URL` is port 5432 — *not* the pgBouncer 6543 pooled URL. The runtime ignores `SUPABASE_DATABASE_URL` for now.
- **Nominatim** needs a descriptive `NOMINATIM_USER_AGENT` (Nominatim Usage Policy). The route in `src/app/api/geocode/reverse/route.ts` is admin-only and uses `cache: "no-store"` to respect the 1 req/sec policy.
- **Postgres connection string with `ssl: "require"`** in `src/lib/db/client.ts` and `apply-sql.ts` — Supabase direct URLs work, local docker needs `?sslmode=disable` (not currently set; local docker default URL works because `postgres-js` is permissive).
- Local Postgres is mentioned in `.env.example` as `docker compose up -d infra-db` but no `docker-compose.yml` is checked in. Ask before assuming infra is available.

## Architecture (the few facts that change how you work)

- **Next.js 16 `proxy.ts`, not `middleware.ts`.** Located at `src/proxy.ts`. Refreshes the Supabase session cookie via `auth.getClaims()` (validates JWT locally / via auth server — no full `/user` round trip).
- **App Router pages are Server Components by default.** Client components opt in with `"use client"` (e.g. `src/components/spot/SpotCard.tsx`, `src/components/layout/SpotsProvider.tsx`).
- **Server actions live in `src/app/actions/`.** Always call `requireAdmin()` / `requireUser()` (`src/lib/auth/server.ts`) — those guards throw `Error("Admin only")` / `Error("Not signed in")`, and `requireAdminOrRedirect` / `requireUserOrRedirect` throw `NEXT_REDIRECT` for Server Components (do not wrap in try/catch).
- **Repository pattern (`src/lib/repositories/`)** has JSON and Drizzle implementations. The async factories (`getSpotRepositoryAsync` etc.) are the production path — they fall back to JSON when the DB is unreachable. Sync factories exist for tests/CLI. Read `SPOTS_DATA_SOURCE` only through `getSpotsDataSource()` / `isSupabaseConfigured()` in `src/lib/env.ts`.
- **Zod schemas in `src/lib/schemas/` are the single source of truth** for input shapes — `NewSpotSchema`, `SpotPatchSchema`, `NewSportEventSchema`, `SportEventPatchSchema`. They're `.strict()`; unknown keys throw. Server actions parse with `.parse(...)` (throws on invalid).
- **Cache Components is on** (`cacheComponents: true` in `next.config.mjs`). `src/lib/db/health.ts` uses the `"use cache"` directive + `cacheTag` / `cacheLife`. Mutations call `revalidateTag("spots" | "sport-events" | "saved-spots:<userId>" | "weather:spot:<id>", "max")` plus `revalidatePath(...)`.
- **Public/legacy env var renames are tracked in `src/lib/env.ts` comments.** When in doubt, read the comments there — they're a checklist of name changes from SPEC §E.4.
- **Dimension reads are data-source-aware.** `src/data.ts` (`REGIONS_DATA`, `COUNTRY_TO_REGION`, `COUNTRY_NAME_OVERRIDES`, `TERRAIN_OPTIONS`) is the **JSON-mode fallback + seed bootstrap** (it seeds `regions`/`countries`/`spot_types` via `src/db/seed.ts`). In DB mode, the spot/event repositories read the dimension tables directly (`listCountries`/`listRegions`/`listTypes` join `regions`/`countries`/`spot_types`). Server components that need dimension data in DB mode call the **data-source-aware helpers** in `src/lib/spots.ts` (e.g. `getTerrainOptionsFromSource()`) which return DB-backed values in DB mode and the `src/data.ts` constants in JSON mode, then pass the result to client components as props. `src/data.ts` is the seed source of truth, not a live read.

## Database & migrations

- Drizzle schema: `src/db/schema.ts` (PostGIS `geometry(Point, 4326)` for `spots.location` and `sport_events.location` via a custom type).
- SQL migrations: `supabase/migrations/*.sql` (drizzle-generated). Each file must split statements on `--> statement-breakpoint` — `apply-sql.ts` will not split otherwise and the live DB will reject multi-statement strings.
- `supabase/migrations/meta/` is drizzle-kit's bookkeeping — do not hand-edit.
- RLS is enabled on all domain tables (`supabase/migrations/0002_rls_policies.sql`): public read on `spots` / `sport_events` / `profiles` / `regions` / `countries` / `spot_types` / `sport_disciplines` / `event_tiers` / `spot_features`; owner-only writes on `spots`, `saved_spots`, `profiles`. Storage bucket policies scope objects to `spots/{userId}/{uuid}` folders.
- The `spot-images` Supabase Storage bucket is **created out-of-band** (Dashboard / supabase CLI). The repo does not provision it.

## Testing gotchas

- Vitest config (`vitest.config.ts`) aliases `"server-only"` to `./test/server-only.ts` — **that file does not exist**. Tests that transitively import `server-only` (via `@/lib/supabase/server`, `@/lib/supabase/storage`, `@/lib/auth/server`, `src/proxy.ts`) will fail to load. Create the stub before adding tests that touch those modules. The stub only needs to be a no-op module.
- `src/lib/log.ts` silences `console.*` when `NODE_ENV === "test"`, so test output stays clean.
- `src/lib/env.ts` validates with Zod at module load — set required envs (or rely on the defaults from `.env.example`) before running tests that import it.

## Auth flow (so you do not duplicate it)

1. `src/proxy.ts` refreshes the Supabase session cookie on every request.
2. `src/lib/auth/server.ts` exposes guards: `requireUserOrRedirect` / `requireAdminOrRedirect` for Server Components, `requireUser` / `requireAdmin` for actions and route handlers, plus `signInWithGoogle`, `signOut`, `originFromRequest`, `sanitizeNext`.
3. `getServerUserFromCookies()` in `src/lib/auth.ts` is the only function that turns a Supabase session into a `User`. It uses `getClaims()` (not `getUser()`) and re-applies `isAdminUser(...)` from the env allow-list.
4. `src/app/auth/callback/route.ts` exchanges the OAuth code, calls `ensureProfileRow(...)` to upsert into `public.profiles` via the service-role admin client, then redirects to `?next=`.
5. The dev placeholder (`src/lib/user.ts`) is returned whenever `isSupabaseConfigured()` is false.

## Design system

`DESIGN.md` is the source of truth: monochrome, hard 0px corners, Archivo Narrow for headlines (uppercase), Inter for body, no shadows/blurs/gradients. Existing `src/components/ui/*` and the page chrome follow it — do not introduce rounded corners, color accents, or shadow utilities.

## Where things live

- Routes: `src/app/**/page.tsx` (Admin under `src/app/admin/*` — guarded by `requireAdminOrRedirect` in its `layout.tsx`)
- API routes: `src/app/api/**/route.ts`
- Server actions: `src/app/actions/*.ts`
- Auth / Supabase / DB plumbing: `src/lib/{auth,supabase,db,repositories,env,admin,user}/`
- Drizzle schema + CLI: `src/db/`
- Client state: `src/stores/*` (Zustand) + `src/components/layout/SpotsProvider.tsx`
- Static data (categories, regions, presets): `src/data.ts` + `src/data/*.json` — **JSON-mode fallback + seed bootstrap only** (see the data-source-aware dimension note under Architecture). In DB mode, live dimension reads come from `regions`/`countries`/`spot_types`.
- Local repo skills (auto-loaded): `.agents/skills/` — `next-cache-components`, `next-best-practices`, `supabase`, `drizzle`, `composition-patterns`, `react-best-practices`, `frontend-design`, `accessibility`, `seo` are the most relevant here. `SPEC.md` and `DESIGN.md` are the canonical product/design references.
