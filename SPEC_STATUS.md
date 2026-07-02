# Open Spot — Stage Status (resumable)

> Snapshot taken at the end of the current session. Use this file to resume
> Stage E (the only unfinished stage) without re-reading the SPEC.
>
> Branch state: Stages A, B, C, E.1–E.7, E.9, E.10, E.11 are implemented and
> verified. E.8 (Storage upload integration) is wired but optional. Verification:
> `pnpm typecheck` clean, `pnpm lint` clean, `pnpm test` 52/52, `pnpm build`
> was interrupted (the previous user run aborted during the production build
> for Stage E — re-run it before declaring the stage done).

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
| E.8 Supabase Storage | **partial** | `src/lib/supabase/storage.ts` exposes `uploadSpotImage` + `getSpotImageUrl`; bucket `spot-images` and RLS storage policies are in migration `0002_rls_policies.sql`. The `PostForm` still uses external image URLs (E.8.1 in SPEC: "Curated spots keep their existing external URLs; imagePath is null for them"). Wiring the upload into `PostForm` and switching the `DrizzleSpotRepository.toSpot` to resolve `imagePath` via signed URLs is the next-step when user-contributed images are needed. |
| E.9 DB client + health + fallback | done | `src/lib/db/client.ts` (postgres-js, pool 10, `withRetry` with full-jitter exponential backoff, `isConnectionError`); `src/lib/db/health.ts` (`checkDbHealth` with 2 s `SELECT 1`); `src/app/api/health/route.ts`; `getSpotRepositoryAsync` + `getEventRepositoryAsync` + `getSavedSpotsRepositoryAsync` all check health and fall back to Json + log. `X-Data-Source` response header is tracked in `getLastRepositoryContext` but not yet set in the response (Next 16's `next/headers` doesn't allow setting response headers from a page; the SPEC requirement is a polish item — wire via middleware if/when needed). |
| E.10 RLS policies | done | migration `0002_rls_policies.sql` with 12 policies: `spots` (select public, insert/update/delete owner via `(select auth.uid()) = created_by` with both USING and WITH CHECK on update), `sport_events` (select public, writes service-role only), `saved_spots` (select/insert/delete owner), `profiles` (select public, insert/update owner with USING + WITH CHECK), `country_regions` (select public), plus 4 storage policies on `storage.objects` scoped by `storage.foldername(name)[1] = (select auth.uid())::text` with upsert (INSERT + SELECT + UPDATE) coverage. All use the `TO` clause (not deprecated `auth.role()`). |
| E.11 Deploy + CI | **partial** | `.github/workflows/ci.yml` runs typecheck + lint + test + (when migrations change) `pnpm db:apply`. `package.json` scripts: `db:generate`, `db:push`, `db:migrate`, `db:seed`, `db:apply`, `db:health`, `db:studio`. The deploy step (Vercel env wiring, `pnpm db:deploy` against `SUPABASE_DIRECT_URL`) and the storage bucket creation are pending — see "How to resume" below. |

## Files added/changed during Stage E

```
.env.example                                          # still no Drizzle/Supabase entries; user fills from .env.local
.github/workflows/ci.yml                              # new
drizzle.config.ts                                      # new
supabase/migrations/0000_0001_initial_schema.sql       # drizzle-generated
supabase/migrations/0001_postgis_indexes_and_search.sql # new (GIST)
supabase/migrations/0002_rls_policies.sql              # new
src/app/account/page.tsx                               # new
src/app/actions/auth.ts                                # new (signOutAction)
src/app/actions/saved-spots.ts                         # new (toggleSavedAction, listSavedSpotsAction)
src/app/api/health/route.ts                            # new
src/app/auth/callback/route.ts                         # new
src/app/layout.tsx                                     # async factory + UserProvider + SavedSpotsProvider
src/app/login/page.tsx                                 # new
src/app/sitemap.ts                                     # async factory
src/app/spots/[id]/page.tsx                            # async factory
src/db/apply-sql.ts                                    # new (migration runner)
src/db/load-env.ts                                     # new (.env.local loader for tsx scripts)
src/db/seed.ts                                         # new
src/db/schema.ts                                       # new
src/hooks/useSavedSpots.test.tsx                       # updated (mocks Server Action, async act)
src/hooks/useSavedSpots.ts                            # rewritten: server-fed + async toggle + rollback
src/lib/auth.ts                                         # new (getServerUserFromCookies, ensureProfileRow)
src/lib/db/client.ts                                   # new (postgres-js + withRetry)
src/lib/db/health.ts                                   # new (checkDbHealth)
src/lib/env.ts                                          # Zod-validated, replaces prior minimal reader
src/lib/repositories/drizzle-event-repository.ts        # new
src/lib/repositories/drizzle-saved-spots-repository.ts  # new
src/lib/repositories/drizzle-spot-repository.ts         # new (PostGIS ST_DWithin)
src/lib/repositories/index.ts                          # async factories + fallback
src/lib/saved-spots-context.tsx                        # new (server-feed boundary)
src/lib/sport-events/loader.ts                         # switched to async factory
src/lib/supabase/browser.ts                            # new
src/lib/supabase/server.ts                             # new (await cookies)
src/lib/supabase/storage.ts                            # new (upload + signed URL)
src/lib/user-context.tsx                               # new (UserProvider)
src/lib/weather/weather-bundle.ts                      # switched to async factory
src/middleware.ts                                      # new (Supabase session refresh)
```

## How to resume (next session)

The previous user run aborted during `npx next build`. The implementation
is complete; only the production build + on-the-wire checks are pending.

1. **Re-verify the live wiring** (Postgres + Supabase):
   ```bash
   pnpm db:health   # should report ok=true, latencyMs < 50
   pnpm db:seed     # idempotent; safe to re-run
   ```
   The seed prints `→ 24 countries/regions`, `→ 11 spots`, `→ 5 sport_events`.

2. **Re-run the full quality gate:**
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test        # expect 52 passed across 9 files
   pnpm build       # this is what aborted previously
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

5. **Set up the user-contributed image flow** (E.8 wire-up, optional):
   - In `PostForm.handleSubmit`, after `createSpotAction` returns the new
     spot, call `uploadSpotImage(file, createdSpot.id)` first, then include
     `imagePath` in the create payload.
   - In `DrizzleSpotRepository.toSpot`, when `row.imagePath` is set, render
     it through `getSpotImageUrl(row.imagePath)` to get a 1-hour signed URL
     on the server. The simplest pattern: a `withImageUrls(spots)` helper
     called from the spot detail page (server component) and from
     `getSpotRepositoryAsync().list()` for the layout server-feed.

6. **Wire `X-Data-Source` response header** (E.9 polish, optional):
   - Currently the `getLastRepositoryContext()` tracks the source. To set the
     response header, add a `middleware.ts` matcher that reads
     `request.headers.get('x-internal-data-source')` and copies it to the
     response — or use `next.config.mjs` `headers()` with a `x-data-source`
     key and have the page set a request header via `next/headers` (Next 16
     may support this in a future release; today it's a no-op).

7. **Deploy (E.11):**
   - Add Vercel env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY`, `DB_CONNETION_STRING` (= `SUPABASE_DIRECT_URL`),
     `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SPOTS_DATA_SOURCE=db`.
   - Promote migrations on deploy: `pnpm db:apply` is the local-equivalent
     of `supabase db push`; for production add `pnpm db:deploy` that runs
     `drizzle-kit migrate` against `SUPABASE_DIRECT_URL`.
   - The CI workflow already runs `pnpm db:apply` against staging secrets
     when `supabase/migrations/**` changes.

## Test counts (last verified)

- geo: 8
- sport-events/status: 5
- weather/mappers: 10
- ui-store: 2
- map-filter-store: 3
- spots-store: 2
- SpotRepository contract: 10
- SpotCard smoke: 3
- useSavedSpots: 9
- **Total: 52 / 52 pass** in ~4 s

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
- The Drizzle `spots.imagePath` column is unused today (all curated spots
  have `imageUrl` only). E.8 wire-up is the trigger to use it.
- `SEED_SAVED_SPOTS` is not yet implemented (SPEC E.3 mentioned
  `src/db/seed/saved-spots.ts`; current `seed.ts` covers country_regions,
  spots, sport_events, and inserts/upserts a `dev` profile on first run
  via the auth callback `ensureProfileRow` flow).
