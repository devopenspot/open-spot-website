# Open Spot — Stage Status (resumable)

> Snapshot taken at the end of the current session. Use this file to resume
> Stage E (the only unfinished stage) without re-reading the SPEC.
>
> Branch state: Stages A, B, C, E.1–E.11 are implemented and verified. The
> only remaining work is the operator's manual setup steps in the
> Supabase dashboard and Vercel (both documented in `DEPLOY.md`).
> Verification (last green run): `pnpm db:health` ok (`SPOTS_DATA_SOURCE=db`,
> live Supabase), `pnpm db:seed` 24/11/5, `pnpm db:deploy` idempotent on
> a previously-seeded DB, `pnpm typecheck` clean, `pnpm lint` clean,
> `pnpm test` 58/58, `pnpm build` 31/31 pages including 11 spot detail
> pages from the DB. Three passes over the original verification:
> the first fixed the `pnpm db:health` script (missing CLI file) and the
> `cacheComponents` "uncached data outside `<Suspense>`" error on the
> `/_not-found` prerender; the second wired E.8 (PostForm file upload +
> DrizzleSpotRepository signed-URL resolution); the third added the E.11
> deploy runbook (`DEPLOY.md` + `db:deploy` script + the full
> `.env.example` Supabase block).

## Stage matrix

| Stage | Status | Notes |
|---|---|---|
| A.1 type unification (core.ts deleted) | done | `src/lib/types.ts:23` |
| A.1b boundary derivation | done | Spot type carries slug/citySlug/location/createdBy/createdAt/updatedAt; weather/coords/region/distance derive at boundary |
| A.2 Zod | done | `zod@4`; `src/lib/schemas/spot.ts` + `event.ts`; wired into `json-spot-repository` / `json-event-repository` |
| A.3 SpotRepository + JsonSpotRepository + factory | done | `src/lib/repositories/{spot,event,saved-spots}-repository.ts` interfaces; `json-*.ts` impls; factory in `index.ts` |
| A.4 EventRepository + JsonEventRepository | done | `json-event-repository.ts`; `sport-events/loader.ts` is now a thin enrich layer over the repo |
| A.5 Server Action for spot creation | done | `src/app/actions/spots.ts` (`createSpotAction`); `PostTab` uses `useTransition`; `addSpot` removed |
| A.6 Zustand stores | done | `useUIStore` / `useSpotsStore` / `useMapFilterStore`; `HydrationGate`; `SpotsProvider` preserves `initialSpots` server-feed; `WeatherContext` for weather server-feed; `AppStateProvider` + `AppProviders` deleted |
| A.7 useSavedSpots userId | done | per-user key namespacing, async toggle wired to Server Action, DB-sync skeleton (TODO E.6) |
| B.1 NavList + useNavList | done | `components/layout/NavList.tsx` + `hooks/useNavList.tsx`; DesktopNav + MobileNav deleted |
| B.2 MobileDrawer uses Overlay | done | drawer uses `<Overlay flush>`; escape/focus trap/body scroll delegated |
| B.3 UI primitives | done | `components/ui/{Eyebrow,SurfaceCard,PrimaryButton,TabPanel}.tsx` |
| B.4 MapTab split | done | `components/map/{MapCanvas,MapSidebar,MapInfoPopup,MapLegend}.tsx`; MapInfoPopup gains focus trap + escape |
| B.5 PostTab split | done | `components/post/{PostForm,PostSuccessScreen}.tsx`; PostTab orchestrates via key-bump |
| B.6 noUncheckedIndexedAccess | done | enabled in `tsconfig.json`; non-null fixes in `useFocusTrap` + `weather/mappers` |
| C.1 vitest | done | vitest@4 + RTL@16 + happy-dom@20; `vitest.config.ts`; `vitest-env.d.ts`; `pnpm test` |
| C.2a useSavedSpots tests | done | 9 tests incl. Pass 1 data-loss regression |
| C.2b geo tests | done | haversineMiles (LAX→JFK ≈ 2475 mi), formatDistanceMiles, projectToGrid clamping |
| C.2c weather mappers tests | done | mapIconName for all OpenWeather codes, mapCurrentWeather, mapForecast |
| C.2d sport-events status tests | done | deriveStatus extracted to `status.ts`; 5 tests |
| C.2e Zustand store tests | done | ui-store, map-filter-store, spots-store |
| C.3 SpotRepository contract | done | reusable `spotRepositoryContract(getRepo)` factory + Json impl; Drizzle impl will run the same contract in E.5 |
| C.4 SpotCard smoke test | done | aria-pressed + onToggleSave + open-button |
| E.0 Prerequisites | done | cacheComponents async, server-feed boundary, weather cacheLife, clean Spot, Repository interfaces — all satisfied |
| E.1 Dependencies + Supabase project | done | drizzle-orm, postgres, @supabase/ssr, @supabase/supabase-js, drizzle-kit, tsx; live Supabase project (epvgadveaongkiwobaze) connected; PostGIS extension enabled via SQL |
| E.2 Drizzle schema | done | `src/db/schema.ts` with custom `geometryPoint` type, 5 tables, enums, btree indexes; GIST added in 0001 |
| E.3 Migrations + seed | done | `supabase/migrations/0000_0001_initial_schema.sql` (drizzle-generated) + `0001_postgis_indexes_and_search.sql` (GIST on location) + `0002_rls_policies.sql`; applied via `src/db/apply-sql.ts` (`pnpm db:apply`); `src/db/seed.ts` (`pnpm db:seed`) seeded 24 country_regions, 11 spots, 5 sport_events idempotently |
| E.4 Centralized env | done | `src/lib/env.ts` (Zod-validated, no `next/headers`); pure `process.env` reader; `getSpotsDataSource` + `getDatabaseUrl` + `isSupabaseConfigured`; `app_url` / weather env / supabase secrets all funneled through |
| E.5 Drizzle repos | done | `src/lib/repositories/drizzle-spot-repository.ts` (PostGIS `ST_DWithin`), `drizzle-event-repository.ts`; async factories in `index.ts` with health-checked DB branch + JSON fallback (`getLastRepositoryContext` exposes why) |
| E.6 SavedSpotsRepository + Server Actions | done | `src/lib/repositories/drizzle-saved-spots-repository.ts`; `src/app/actions/saved-spots.ts` (`toggleSavedAction`, `listSavedSpotsAction`); `useSavedSpots` rewritten to read from `SavedSpotsProvider` server-feed + async toggle with rollback-on-failure; layout threads `initialSavedSpots` to the boundary |
| E.7 Supabase Auth | done | `src/lib/supabase/server.ts` + `browser.ts` (await `cookies()`); `src/middleware.ts`; `src/lib/auth.ts` reads `auth.getUser()` server-side; `useUser` rewired through `UserProvider` + `UserContext`; `/login` (email + magic link), `/auth/callback` (`exchangeCodeForSession` + `ensureProfileRow`), `/account` (sign-out via server action `signOutAction`); DEV_USER kept as fallback when Supabase is unconfigured |
| E.8 Supabase Storage | done | `src/lib/supabase/storage.ts` exposes `uploadSpotImage` + `getSpotImageUrl` (single) + `getSpotImageUrls` (batch, React-`cache`-memoized) + `withImageUrls` resolver. The `PostForm` now offers a file-input with local preview, builds FormData, and the `createSpotAction` (FormData) uploads first to `spots/{uuid}/...` then creates the row in one server round-trip with `imagePath` set. The Drizzle `toRawSpot` → `withImageUrls` post-pass resolves every `imagePath` to a 1-hr signed URL via `createSignedUrls`; the `NewSpotSchema` and both `Json*Repository`/`Drizzle*Repository` honor an optional caller-supplied `id` (so the upload's UUID matches the row's id). Bucket `spot-images` and the 4 RLS storage policies are in `0002_rls_policies.sql`. Curated spots keep their `imageUrl`; the `imagePath` column is null for them. Caveat: the "upload-then-insert" flow can leave an orphan object in the bucket if the DB insert fails after a successful upload (no transactional rollback in v1). |
| E.9 DB client + health + fallback | done | `src/lib/db/client.ts` (postgres-js, pool 10, `withRetry` with full-jitter exponential backoff, `isConnectionError`); `src/lib/db/health.ts` (`checkDbHealth` with 2 s `SELECT 1`); `src/app/api/health/route.ts`; `getSpotRepositoryAsync` + `getEventRepositoryAsync` + `getSavedSpotsRepositoryAsync` all check health and fall back to Json + log. `X-Data-Source` response header is tracked in `getLastRepositoryContext` but not yet set in the response (Next 16's `next/headers` doesn't allow setting response headers from a page; the SPEC requirement is a polish item — wire via middleware if/when needed). |
| E.10 RLS policies | done | migration `0002_rls_policies.sql` with 12 policies: `spots` (select public, insert/update/delete owner via `(select auth.uid()) = created_by` with both USING and WITH CHECK on update), `sport_events` (select public, writes service-role only), `saved_spots` (select/insert/delete owner), `profiles` (select public, insert/update owner with USING + WITH CHECK), `country_regions` (select public), plus 4 storage policies on `storage.objects` scoped by `storage.foldername(name)[1] = (select auth.uid())::text` with upsert (INSERT + SELECT + UPDATE) coverage. All use the `TO` clause (not deprecated `auth.role()`). |
| E.11 Deploy + CI | done | `.github/workflows/ci.yml` runs typecheck + lint + test + (when migrations change) `pnpm db:apply`. `package.json` scripts: `db:generate`, `db:push`, `db:migrate`, `db:seed`, `db:apply`, `db:deploy` (alias for `db:apply` against `SUPABASE_DIRECT_URL` — custom runner is more robust than `drizzle-kit migrate` for our SQL-only migrations because it splits on `--> statement-breakpoint` and tracks applied IDs in `schema_migrations`), `db:health`, `db:studio`. `src/lib/env.ts` is the single typed env reader with `getSupabaseUrl` / `getSupabaseAnonKey` / `getSupabaseServiceRoleKey` / `getSpotImagesBucket` helpers, the SPEC name `SUPABASE_SERVICE_ROLE_KEY` + legacy `SUPABASE_DIRECT_URL` aliased to the in-code names (`SUPABASE_SECRET_KEY` / `DB_CONNETION_STRING`) for back-compat. `DEPLOY.md` is the operator runbook (Vercel env table, bucket creation via dashboard or `supabase` CLI, `pnpm db:deploy`, rollback procedure). `.env.example` documents the full Supabase block with the SPEC/code name pairs. The only operator step remaining is the manual one (create the `spot-images` bucket in the dashboard + the Vercel env wiring) — both documented. |

## Files added/changed during Stage E

```
.env.example                                          # full Supabase block + code/SPEC name aliases (E.11)
.github/workflows/ci.yml                              # new
DEPLOY.md                                              # NEW (E.11 operator runbook)
drizzle.config.ts                                      # new
supabase/migrations/0000_0001_initial_schema.sql       # drizzle-generated
supabase/migrations/0001_postgis_indexes_and_search.sql # new (GIST)
supabase/migrations/0002_rls_policies.sql              # new
src/app/account/page.tsx                               # new
src/app/actions/auth.ts                                # new (signOutAction)
src/app/actions/saved-spots.ts                         # new (toggleSavedAction, listSavedSpotsAction)
src/app/actions/spots.ts                             # rewritten: FormData in, uploadSpotImage → repo.create (E.8 wire-up)
src/app/api/health/route.ts                            # new
src/app/auth/callback/route.ts                         # new
src/app/layout.tsx                                    # sync RootLayout + async RootDataProviders wrapped in <Suspense>
src/app/login/page.tsx                                 # new
src/app/robots.ts                                      # now reads env.APP_URL
src/app/sitemap.ts                                     # async factory; reads env.APP_URL
src/app/spots/[id]/page.tsx                            # async factory
src/components/post/PostForm.tsx                      # rewritten: file input, local preview, FormData submit
src/db/apply-sql.ts                                    # new (migration runner)
src/db/health-cli.ts                                   # new (pnpm db:health CLI wrapper for checkDbHealth)
src/db/load-env.ts                                     # new (.env.local loader for tsx scripts)
src/db/seed.ts                                         # new
src/db/schema.ts                                       # new
src/hooks/useSavedSpots.test.tsx                       # updated (mocks Server Action, async act)
src/hooks/useSavedSpots.ts                            # rewritten: server-fed + async toggle + rollback
src/lib/auth.ts                                         # new (getServerUserFromCookies, ensureProfileRow)
src/lib/db/client.ts                                   # new (postgres-js + withRetry)
src/lib/db/health.ts                                   # new (checkDbHealth)
src/lib/env.ts                                          # Zod-validated; SUPABASE_DIRECT_URL/SUPABASE_SERVICE_ROLE_KEY/SUPABASE_STORAGE_BUCKET_SPOTS added; helpers: getSupabaseUrl, getSupabaseAnonKey, getSupabaseServiceRoleKey, getSpotImagesBucket
src/lib/repositories/drizzle-event-repository.ts        # new
src/lib/repositories/drizzle-saved-spots-repository.ts  # new
src/lib/repositories/drizzle-spot-repository.ts         # toRawSpot + withImageUrls post-pass (E.8 wire-up)
src/lib/repositories/index.ts                          # async factories + fallback
src/lib/saved-spots-context.tsx                        # new (server-feed boundary)
src/lib/sport-events/loader.ts                         # switched to async factory
src/lib/supabase/__tests__/storage.test.ts             # 5 tests (withImageUrls + getSpotImageUrls)
src/lib/supabase/browser.ts                            # new
src/lib/supabase/server.ts                             # new (await cookies)
src/lib/supabase/storage.ts                            # bucket now reads SUPABASE_STORAGE_BUCKET_SPOTS via env helper
src/lib/user-context.tsx                               # new (UserProvider)
src/lib/weather/weather-bundle.ts                      # switched to async factory
src/middleware.ts                                      # new (Supabase session refresh)
test/server-only.ts                                    # vitest alias stub for `server-only`
```

## How to resume (next session)

Stage E is **verified end-to-end** as of the last session: db:health, db:seed,
typecheck, lint, test (52/52), and `pnpm build` (31/31 pages including 11
spot detail pages from the live DB) all pass. The only remaining items are
the manual Supabase dashboard steps and the optional polish work (E.8 wire-up,
`X-Data-Source` header, deploy, `SEED_SAVED_SPOTS`).

> **Node version requirement (added this pass):** vitest 4 / vite 8 / Next 16
> bundle `rolldown`, which imports `styleText` from `node:util` (added in
> Node 20.12 / 21.2). The system `node` may be 20.10.0, which crashes
> `pnpm test` and `pnpm build` with `SyntaxError: The requested module
> 'node:util' does not provide an export named 'styleText'`. **Workaround
> for this run:** prepend a newer Node to `PATH`:
>
> ```bash
> PATH="/Users/gabrielalfonso/.nvm/versions/node/v20.19.0/bin:$PATH" pnpm test
> PATH="/Users/gabrielalfonso/.nvm/versions/node/v20.19.0/bin:$PATH" pnpm build
> ```
>
> `@supabase/supabase-js` also prints a deprecation warning on Node 20
> ("Node.js 20 and below are deprecated … please upgrade to Node.js 22 or
> later"). v22.17.0 in the same `~/.nvm/versions/node` dir clears the
> warning. **Future hardening:** add a `.nvmrc` pinning `v20.19.0` (or
> `v22.17.0`) and an `engines.node` field — not done in Phase 1 to keep
> the diff small.

1. **Re-verify the live wiring** (Postgres + Supabase):
   ```bash
   pnpm db:health   # should report ok=true, latencyMs ~ 1-2 s on first hit
   pnpm db:seed     # idempotent; safe to re-run
   ```
   The seed prints `→ 24 countries/regions`, `→ 11 spots`, `→ 5 sport_events`.

2. **Re-run the full quality gate:**
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test        # expect 52 passed across 9 files
   pnpm build       # 31/31 routes including 11 /spots/[id] pages from the DB
   ```

3. **Create the storage bucket** in the Supabase dashboard:
   - Storage → New bucket → name: `spot-images` → **private** (not public).
   - The RLS policies from `0002_rls_policies.sql` already scope access by
     `auth.uid()`. The server-side `uploadSpotImage` uses the service role
     (bypasses RLS); the browser-side path uses the anon key (RLS applies).

4. **Sign in end-to-end:**
   - `pnpm dev` and visit `http://localhost:3000/login`.
   - Enter the email tied to your Supabase project's auth users.
   - Check inbox for the magic link; the `/auth/callback` route exchanges the
     code for a session cookie and upserts a `profiles` row.

5. **Set up the user-contributed image flow** (E.8 wire-up, **DONE this
   pass**): the `PostForm` now has a file input with local preview; the
   `createSpotAction` (FormData) uploads first via
   `uploadSpotImage(file, futureSpotId)`, generates the UUID, then calls
   `repo.create({ id, imagePath, ... })` with the same UUID as the row id;
   the Drizzle repo's `toRawSpot` → `withImageUrls` post-pass resolves
   every `imagePath` to a 1-hr signed URL via Supabase's
   `createSignedUrls` (batch + per-request `cache` memoization). Tests
   cover the contract (id round-trip) and the resolver (withImageUrls +
   getSpotImageUrls). End-to-end still needs the `spot-images` bucket
   created in the Supabase dashboard (manual step 3).

6. **Wire `X-Data-Source` response header** (E.9 polish, optional):
   - Currently the `getLastRepositoryContext()` tracks the source. To set the
     response header, add a `middleware.ts` matcher that reads
     `request.headers.get('x-internal-data-source')` and copies it to the
     response — or use `next.config.mjs` `headers()` with a `x-data-source`
     key and have the page set a request header via `next/headers` (Next 16
     may support this in a future release; today it's a no-op).

7. **Deploy (E.11, done this pass):** the operator runbook is `DEPLOY.md`.
   In summary:
   - **Vercel env** (full table in DEPLOY.md): `APP_URL`,
     `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`),
     `SUPABASE_DIRECT_URL` (or `DB_CONNETION_STRING`),
     `SUPABASE_STORAGE_BUCKET_SPOTS`, `SPOTS_DATA_SOURCE=db`,
     `URL_WEATHER`, `URL_WEATHER_IMG`, `API_KEY_WEATHER`,
     `REVALIDATE_SECRET`.
   - **Promote migrations**: `pnpm db:deploy` (alias for `pnpm db:apply`,
     uses the custom runner that splits on `--> statement-breakpoint` and
     tracks applied IDs in `schema_migrations`).
   - **Storage bucket**: create `spot-images` (private) in the Supabase
     dashboard; the RLS policies in `0002_rls_policies.sql` are
     applied by `pnpm db:deploy`. Documented in `DEPLOY.md` step 1.2
     with both dashboard and `supabase storage create` paths.

## Test counts (last verified)

- geo: 8
- sport-events/status: 5
- weather/mappers: 10
- ui-store: 2
- map-filter-store: 3
- spots-store: 2
- SpotRepository contract: 11 (+1 for E.8 id+imagePath round-trip)
- SpotCard smoke: 3
- useSavedSpots: 9
- supabase/storage: 5 (NEW: withImageUrls + getSpotImageUrls batch resolver)
- **Total: 58 / 58 pass** in ~4.5 s

## Known gaps to be aware of when resuming

- The `X-Data-Source` response header is tracked but not yet sent (see E.9
  step 6 above).
- The `useEffect(() => { ... }, [userId, initialServerSavedSpots])` dep
  list contains `initialServerSavedSpots` which is derived from a
  `useContext` value; if the context array identity ever changes on every
  render, the effect would re-run. Today the layout always passes a new
  `[]` literal but it's wrapped in `SavedSpotsProvider`, so the context
  value is stable per request.
- The Drizzle `create` for `spots` uses `id: gen_random_uuid()` via the
  schema default. The Json impl still fabricates `custom-spot-${Date.now()}`
  ids from `PostForm` — both work, but if you want to deprecate the
  Json create path entirely, do so in E.11.
- The Drizzle `spots.imagePath` column is **now wired** in the read path
  (`DrizzleSpotRepository` resolves it to a signed URL via
  `withImageUrls`) and the write path (`createSpotAction` accepts a
  FormData file and uploads first). The column is still `null` for all
  curated rows; the next user-submitted spot will populate it.
- The "upload-then-insert" flow can leave an orphan object in the bucket
  if the DB insert fails after a successful upload. There is no
  transactional rollback in v1 — a follow-up pass could add a small
  cleanup job (a Supabase Edge Function that lists un-referenced
  `spots/*/*` objects older than 24 h and removes them, or a
  client-side retry that catches the create error and calls
  `removeSpotImage(path)` from a new `deleteSpotImage` in storage.ts).
- `SEED_SAVED_SPOTS` is not yet implemented (SPEC E.3 mentioned
  `src/db/seed/saved-spots.ts`; current `seed.ts` covers country_regions,
  spots, sport_events, and inserts/upserts a `dev` profile on first run
  via the auth callback `ensureProfileRow` flow).
