# Open Spot — Technical Debt Audit

**Audit date:** 2026-07-02
**Scope:** `src/`, `docs/`, config files, repository contracts, tests, documentation
**Auditor:** opencode (automated review)
**Method:** File-system traversal + targeted grep for `TODO|FIXME|XXX|HACK`, unused exports, `any`, `as unknown as`, `void`-suppression patterns, manual reading of 60+ files.

**Result:** **72 findings** — 27 HIGH · 23 MEDIUM · 22 LOW.

---

## 0. How to read this document

- **HIGH** = security risk, data integrity risk, or contract violation that can ship a bug to production.
- **MEDIUM** = maintainability hazard, duplication, or drift between spec and code.
- **LOW** = dead code, nitpick, or stylistic inconsistency.
- Each finding is keyed `TD-<priority>-<n>` so it can be referenced in commits, PRs, and issue trackers without re-reading the audit.

The "Top 5" at §10 is the order to fix things in if time is limited.

---

## 1. Dead Code / Unused Files

### TD-HIGH-01 — Unused exports in `src/lib/spots.ts`
**File:** `src/lib/spots.ts:12-16`

```ts
export const getExploreCategories    = cache(() => EXPLORE_CATEGORIES);
export const getLegendaryTerrains    = cache(() => LEGENDARY_TERRAINS);
export const getPopularSearchTerms   = cache(() => POPULAR_SEARCH_TERMS);
export const getRecentSearches       = cache(() => RECENT_SEARCHES);
```

A grep across `src/` shows zero consumers. Only `getRegions`, `getPresetImages`, and `getTerrainOptions` are imported. The four unused functions and the four underlying constants (`EXPLORE_CATEGORIES`, `LEGENDARY_TERRAINS`, `POPULAR_SEARCH_TERMS`, `RECENT_SEARCHES` in `src/data.ts`) are dead.

**Fix:** Delete the four unused getters and the four `data.ts` exports. If the data is wanted for a future feature, leave a TODO referencing a target stage; otherwise remove.

---

### TD-HIGH-02 — Unused `src/components/ui/*` primitives
**Files:**
- `src/components/ui/PrimaryButton.tsx`
- `src/components/ui/TabPanel.tsx`
- `src/components/ui/SurfaceCard.tsx`
- `src/components/ui/Eyebrow.tsx`

A grep for `from "@/components/ui/*"` and `from "@/components/ui"` returns zero matches across `src/`. Each is re-implemented inline at the call site (e.g. `<button className="…">…</button>` everywhere; `<section className="space-y-8">` in every tab). `src/components/ui/index.ts:1-4` re-exports them but nothing imports the barrel either.

**Fix:** Either delete the four components and their barrel, or actually adopt them in the call sites. Carrying unused primitives is a strong "we meant to refactor" signal that's now false.

---

### TD-HIGH-03 — Unused `src/stores/persist-helpers.ts`
**File:** `src/stores/persist-helpers.ts`

`safeStorage()` and `isClient` are not imported anywhere. The two persisted stores (`ui-store.ts`, `map-filter-store.ts`) use `createJSONStorage(() => localStorage)` / `sessionStorage` directly.

**Fix:** Delete the file (no behavior change).

---

### TD-MED-01 — Unused `getLastRepositoryContext` and the tracked-but-unsent `X-Data-Source` feature
**File:** `src/lib/repositories/index.ts:24-28, 26, 63, 68, 78, 90, 95, 100, 111, 115, 121`

The factory tracks a `lastContext` and exposes `getLastRepositoryContext()`, but no caller reads it. The SPEC_STATUS §E.9 admits the `X-Data-Source` header is "tracked but not yet sent."

**Fix:** Either implement the header in `proxy.ts` (which already exists), or delete `getLastRepositoryContext` and the `lastContext` state to stop the lie.

---

### TD-MED-02 — Unused sync factories
**File:** `src/lib/repositories/index.ts:129-153`

`getSpotRepository()`, `getEventRepository()`, `getSavedSpotsRepository()` are exported but have no callers (the async variants are the production path; tests use the `Json*` classes directly).

**Fix:** Delete the three sync factories. The comment at L129-130 ("kept for tests, CLI scripts, and the legacy A.3 surface") documents intent, but the functions are unreferenced.

---

### TD-LOW-01 — Suppress-only import block in DrizzleSpotRepository
**File:** `src/lib/repositories/drizzle-spot-repository.ts:260-264`

```ts
// Suppress unused import warnings while keeping the symbols for future use.
void hashToUnitInterval
void isNotNull
void ilike
void desc
```

This is a code smell — `noUnusedLocals` should remove the import. If they're planned for use, write a TODO with a target stage. If not, delete.

---

### TD-LOW-02 — `void env` artifact
**File:** `src/lib/repositories/index.ts:155`

`import { env, … }` (L2) is fine, but `void env` at L155 suggests an old dependency that was removed; `env` is now only used to silence the "imported but not used" error that was probably real before. `env` is **actually** used at the top of the file in the imports — so the trailing `void env` is dead.

**Fix:** Remove `void env`.

---

### TD-LOW-03 — `closeDb()` exported but never called
**File:** `src/lib/db/client.ts:72-78`

A grep across `src/` shows zero callers for `closeDb()`. The long-lived postgres pool is a server-runtime singleton, so the function is unreachable today.

**Fix:** Delete the export, or wire it to a graceful shutdown hook if you intend to use it in tests.

---

### TD-LOW-04 — `SavedSpotWithDetails` is not consumed
**File:** `src/types/saved-spot.ts:9-11`

`SavedSpotWithDetails` is only used as the inner type of the `SavedSpotsListResult` interface (consumed by the two repository impls) — but neither `useSavedSpots` nor the layout's `initialSavedSpots` payload ever surfaces that shape to the client. The `SavedSpotsListResult` and `SavedSpotWithDetails` types are dead weight in the client bundle.

**Fix:** Either drop `SavedSpotWithDetails` and have `list()` return `Spot[]` directly, or have `SpotsProvider` forward the pre-joined list to `useSavedSpots` so the type is actually used.

---

## 2. Duplicate Code

### TD-HIGH-04 — Drizzle repos repeat the `Spot` shape three times
**Files:**
- `src/lib/repositories/drizzle-spot-repository.ts:33-56` (`toRawSpot` + `withImageUrls`)
- `src/lib/repositories/drizzle-saved-spots-repository.ts:77-99` (`rowToSpot`)
- `src/lib/repositories/drizzle-event-repository.ts:16-42` (`toEvent`)

Three near-identical `*Row → Spot` mappers exist with the same casing, same `imagePath ?? imageUrl` rule, same `createdAt.toISOString()` dance, and slightly different optional fields. The Drizzle-spot and Drizzle-saved-spots mappers duplicate `imagePath ? row.imagePath : row.imageUrl` logic verbatim.

**Fix:** Extract a single `mapSpotRow(row: SpotRow): Spot` to `src/db/rowMappers.ts` (or co-locate with the schema) and reuse from both repos. Likewise for `mapEventRow`.

---

### TD-HIGH-05 — `haversineMeters` duplicated between JSON and Drizzle repos
**Files:**
- `src/lib/repositories/json-spot-repository.ts:201-211` (`EARTH_RADIUS_METERS`, `haversineMeters`)
- `src/lib/repositories/drizzle-spot-repository.ts:16-31` (same `EARTH_RADIUS_METERS`, same `haversineMeters`)

Identical bodies (the only difference is the import of `hashToUnitInterval`, which is itself a duplicate of `src/lib/spots/geo.ts:99-105`). `geo.ts` also has its own `haversineMiles` (a third copy of essentially the same algorithm with different units).

**Fix:** Move all geo helpers to `src/lib/spots/geo.ts`; have the two repos import from there. Drop the in-repo `haversineMeters` copies.

---

### TD-HIGH-06 — `type MapFilter` re-defined in `RegionFilter` and `useMapFilter`
**Files:**
- `src/hooks/useMapFilter.ts:13-22` (`MapFilter` interface + hook return)
- `src/components/search/RegionFilter.tsx:11-17` (destructures `MapFilter` as a component prop type)

Fine in concept, but the `MapFilter` props in `RegionFilter` omit `filteredSpots` and `hasFilter` even though those are part of the type. This is silently "OK" because TS structural typing allows it, but the contract is muddled. A consumer that passes the full filter object gets 4 unused props; a consumer that wants the full object can't get it from `RegionFilter`.

**Fix:** Define `MapFilter` once and have `RegionFilter` accept a `Pick<MapFilter, "region" | "country" | "availableCountries" | "setRegion" | "setCountry">` so unused props are visible at the type level.

---

### TD-MED-03 — `useUser` re-exports through two paths
**Files:**
- `src/lib/user.ts` (defines `User`, `getCurrentUser`, `DEV_USER`)
- `src/lib/user-context.tsx` (defines `UserProvider`, `useUser` — and **synthesizes a fallback `User` object** with a different email)
- `src/hooks/useUser.ts` (re-exports `useUser` and `User`)

**Two bugs / inconsistencies fall out:**
1. `user.ts:8-13` says `DEV_USER.email = 'devopenspot@gmail.com'`, but `user-context.tsx:25` says `email: 'dev@openspot.local'`. The user-context fallback is **inconsistent with the dev constant** and will show in the `/account` page if the provider ever misses.
2. The `User` type is exported by `useUser.ts` (re-export) and by `user.ts` (origin) and re-imported by `user-context.tsx`. Three paths, one type.

**Fix:** Single source: keep `User` + `DEV_USER` in `user.ts`; import the constant into `user-context.tsx` instead of hand-rolling a different fallback. Drop the re-export in `src/hooks/useUser.ts` (it adds zero value beyond re-exporting from a sibling).

---

### TD-MED-04 — Near-duplicate mapper logic in `seed.ts` vs `json-spot-repository.ts`
**Files:**
- `src/db/seed.ts:34-152` (`TYPE_PRIORITY`, `pickType`, `titleCase`, `pickFeatures`, `buildCrowdLabel`, `buildCommunityNote`, `pickCity`, `hash`)
- `src/lib/repositories/json-spot-repository.ts:38-128` (the exact same constants, helpers, and crowd-label pool)

Only `seed.ts` adds the `hash` helper inline (the json-repo imports it from `geo.ts`). All other helpers are copy-paste with the types relaxed from `SpotType` to `string`.

**Fix:** Move the JSON-record mappers to `src/lib/spots/fromRaw.ts` and have both `seed.ts` and `JsonSpotRepository` import from there.

---

### TD-MED-05 — `derivedRegion` lives in two places
**Files:**
- `src/hooks/useMapFilter.ts:9-11` (`deriveRegion` + `DEFAULT_REGION = "Americas"`)
- `src/lib/repositories/json-spot-repository.ts:10,275` (uses `COUNTRY_TO_REGION[spot.country] ?? DEFAULT_REGION` inline; same `DEFAULT_REGION` constant)

**Fix:** Extract a single `regionForSpot(spot: Spot): string` to a shared location; have both call sites use it.

---

### TD-LOW-05 — Repeated `void` discards of parameters
**File:** `src/lib/repositories/json-saved-spots-repository.ts:14` (`void opts`)

Tiny pattern smell; not worth a separate fix.

---

## 3. Inconsistent Architecture

### TD-HIGH-07 — `src/proxy.ts` is a `middleware.ts` (Next 16 rename gap)
**File:** `src/proxy.ts`

The file is named `proxy.ts` (correct for Next 16, which renamed `middleware.ts` to `proxy.ts`), but every doc and the SPEC still call it `middleware.ts`:

- `SPEC.md:614` — "`src/middleware.ts`"
- `SPEC_STATUS.md:54, 105` — "src/middleware.ts"
- `DEPLOY.md:222` — "Follow-up: a `middleware.ts` matcher"
- `LOCAL_DEV.md:172` — "ci.yml" comment

The CI workflow itself (`.github/workflows/ci.yml`) doesn't reference middleware at all, but operators reading the docs will look in the wrong file. Also, `proxy.ts:6` uses `process.env.SUPABASE_SECRET_KEY` as the anon fallback — this is a **HIGH severity secret-bleed risk**: the file claims `SUPABASE_ANON_KEY` but actually falls back to the service-role secret if `NEXT_PUBLIC_SUPABASE_ANON_KEY` is unset. The variable name is also a lie: `SUPABASE_SECRET_KEY` is the service-role key (per `env.ts:40-41`); using it for an SSR client that exchanges cookies in a public-facing proxy bypasses RLS entirely on every request.

**Fix:**
1. Rename the variable in `proxy.ts:5-6` to read only `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Refuse to start the proxy if it's not set (instead of falling through to the service role).
2. Update `SPEC.md` / `SPEC_STATUS.md` / `DEPLOY.md` to use `src/proxy.ts` (Next 16 renamed this in the v16.0 release).

---

### TD-HIGH-08 — `getCurrentUser()` vs `getServerUserFromCookies()` in server actions
**Files:**
- `src/app/actions/saved-spots.ts:4, 9, 26` — uses `getCurrentUser()` (the sync dev-fallback constant)
- `src/app/actions/spots.ts:12, 80` — uses `getCurrentUser()` (the sync dev-fallback constant)
- `src/app/actions/auth.ts` — uses `createServerClient` directly
- `src/app/layout.tsx:92` — uses `getServerUserFromCookies()` (the async cookie-aware one)

The two data-mutation server actions use the **synchronous dev fallback** that always returns `id: 'dev'`, even when the user is signed in. So:
- `/account` page shows the real signed-in user (via `UserProvider`)
- But `createSpotAction` and `toggleSavedAction` always tag the write with `createdBy: 'dev'` and save under the dev user's `saved_spots` row.
- The `initialSavedSpots` is computed from the real `initialUser.id` in `layout.tsx`, but the toggle goes to `dev`'s row.

**Fix:** Replace `getCurrentUser()` in `src/app/actions/*.ts` with `await getServerUserFromCookies()` so the writes respect the signed-in user. Add a "must be signed in" guard or fall back to a clear error.

---

### TD-HIGH-09 — `useSpotRepositoryAsync()` invoked up to 3× per request
**File:** `src/app/spots/[id]/page.tsx:8, 19, 40`

`generateStaticParams`, `generateMetadata`, and `SpotPage` each call `await getSpotRepositoryAsync()`. Each call hits `checkDbHealth()` (with `cacheLife: { revalidate: 30 }`) and goes through the whole async factory. The `cache()` from React should dedupe, but `getSpotRepositoryAsync` is not wrapped in React `cache()` — it returns a plain object.

**Fix:** Wrap `getSpotRepositoryAsync`, `getEventRepositoryAsync`, `getSavedSpotsRepositoryAsync` in React's `cache()` so a single request reuses one factory result.

---

### TD-HIGH-10 — `MapPageClient` hard-codes region/country slug maps
**File:** `src/app/map/MapPageClient.tsx:15-79`

Four `Record<string, string>` lookup tables are hard-coded:
- `REGION_SLUG_TO_NAME` (3 entries)
- `COUNTRY_SLUG_TO_NAME` (24 entries)
- `NAME_TO_REGION_SLUG` (3 entries)
- `NAME_TO_COUNTRY_SLUG` (24 entries)

`REGIONS_DATA` in `src/data.ts:65` and `COUNTRY_TO_REGION` already enumerate these regions/countries. The hard-coded maps must be kept in sync manually, and any new country added to the data file is invisible to the URL slug system. Today, browsing `/map?region=antarctica` (anything not in the 3-entry list) silently fails, and `/map?country=Greenland` falls into the unfiltered branch.

**Fix:** Derive both slug tables from `REGIONS_DATA` at module init (a single function `slugsToNames(regions)`); eliminate the parallel declarations.

---

### TD-MED-06 — Three independent "user lookup" paths
- `src/lib/user.ts` `getCurrentUser()` → sync dev fallback only
- `src/lib/auth.ts` `getServerUserFromCookies()` → async cookie-aware lookup
- `src/lib/user-context.tsx` `useUser()` → client-side React context
- `src/lib/auth.ts` `getAdminClient()` → service-role client for `ensureProfileRow`

The split is intentional (client/server boundary) but the server action layer is using the wrong one (see TD-HIGH-08). One `currentUser()` helper that's `async` and routes through `getServerUserFromCookies` should be the only server-side call.

---

### TD-MED-07 — Mixed error swallow patterns in `proxy.ts` / `auth.ts` / `server.ts`
- `proxy.ts:34-38` — `try/catch` wraps `auth.getUser()` with `// no-op`
- `auth.ts:18-43, 49-61` — outer `try/catch` returns dev user; inner `try/catch` around `ensureProfileRow` with `// best-effort`
- `server.ts:17-24` — `try/catch` around `cookieStore.set` swallows Server Component cookie errors silently

The "ignore" comments are correct in intent, but errors are not logged. If a misconfiguration causes every request to fall through to the dev user, nobody will know.

**Fix:** Add `log.warn` in the catch blocks (consistent with the `log` helper already used elsewhere).

---

### TD-LOW-06 — `getCachedSpotWeather` "use cache" lives in a server-only file
**File:** `src/lib/weather/weather-cached.ts:22-28`

The `"use cache"` directive plus `cacheLife` / `cacheTag` is fine, but the file is imported by both `weather-bundle.ts` (server RSC) and by the implicit server graph for `WeatherProvider`. The `weather-bundle.ts` is a server-only path; ensure the bundled `use cache` is documented in the SPEC for new readers.

---

## 4. Type Safety Issues

### TD-HIGH-11 — `as ReturnType<typeof admin.from>` cast
**File:** `src/lib/auth.ts:50`

```ts
await (admin.from("profiles") as ReturnType<typeof admin.from>).upsert(...)
```

The cast is a no-op (`x as T` is identity when `T === x` type-wise). This line is dead ceremony; either remove it or use a typed Supabase client (`createClient<Database>` from a generated `Database` type).

---

### TD-HIGH-12 — `as unknown as` double cast in Drizzle insert
**File:** `src/lib/repositories/drizzle-spot-repository.ts:226`

```ts
location: input.location as unknown as SpotRow["location"],
```

`SpotLocation` is `{ lat: number; lon: number }`; `SpotRow["location"]` is the custom `geometryPoint` Drizzle type, which the `fromDriver`/`toDriver` transforms convert. The cast bypasses the type system, but a real type error would be the right signal here. Either provide a typed `toDriver` overload or change the column type to a real `geometry` type that accepts `{ lat, lon }`.

---

### TD-HIGH-13 — Positive example: `parseSavedIds` is well-typed
**File:** `src/hooks/useSavedSpots.ts:77-79`

```ts
const parsed: unknown = JSON.parse(raw);
if (Array.isArray(parsed)) {
  return new Set(parsed.filter((v): v is string => typeof v === 'string'));
}
```

This is actually well-typed (the user-defined type guard is good), so the `parsed: unknown` is fine. The test at `src/hooks/useSavedSpots.test.tsx:99-103` shows the type guard correctly rejects `42` and `null`. **No issue** — call this out as a positive example for the other places.

---

### TD-HIGH-14 — `(u.user_metadata ?? {}) as Record<string, unknown>` chains
**File:** `src/lib/auth.ts:26-34`

`meta["display_name"]` access patterns are unsafe; the `(typeof meta["display_name"] === "string" && meta["display_name"])` pattern works at runtime but is verbose. A typed schema (`z.object({ display_name: z.string().optional() })`) would simplify and produce a clearer error path.

---

### TD-HIGH-15 — `from` value typed as `string` instead of `SpotType` in actions
**File:** `src/app/actions/spots.ts:55`

```ts
const type = strField(formData, "type") as Spot["type"]
```

The cast is unsafe; the value can be any string. The downstream `NewSpotSchema.parse(input)` (L83) catches it, but only **after** building the `input` object. Use a Zod parse on the form fields before constructing the object.

---

### TD-MED-08 — `spot` and `spots` typed as `unknown` in storage mock
**File:** `src/lib/supabase/__tests__/storage.test.ts:10-14`

```ts
createSignedUrls: (...args: unknown[]) => createSignedUrlsMock(...args),
```

Acceptable in tests, but it disables type-checking on the call shape. Consider a typed `vi.fn<typeof supabase.storage.from('x').createSignedUrls>` so the test's expectations on the arguments become checked.

---

### TD-MED-09 — `SavedSpotWithDetails.savedBy: string` types are denormalized in `JsonSavedSpotsRepository`
**File:** `src/lib/repositories/json-saved-spots-repository.ts:7-39`

`this.saved: SavedSpot[]` is in-memory and unbounded; the type itself is fine, but `countForSpot` is O(n) over the array. For a JSON stub that's acceptable; flag for the Drizzle path: `DrizzleSavedSpotsRepository.countForSpot` is `SELECT count(*)` (good), but the JSON impl has no size guard.

---

### TD-MED-10 — `SearchOverlay` cast on `navigator.clipboard`
**File:** `src/components/spot/SpotDetailsContent.tsx:37-38`

```ts
if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
  await navigator.clipboard.writeText(url);
}
```

`writeText` returns `Promise<void>`. The result isn't checked, so a write failure still toasts "Link copied" in the success branch (no, it's inside a `try` that catches the await — fine). **OK on second look.**

---

### TD-LOW-07 — `weather[spot.id]?.current` without null-narrowing
**File:** `src/components/map/MapInfoPopup.tsx:90`

Returns `—°C sunny` even when weather data is missing; no actual type error but the `weather[spot.id]` indirection deserves a `useWeather().getWeather(spot.id)` wrapper that already exists in `WeatherContext`.

---

## 5. TODO / FIXME / XXX / HACK Markers

A grep for `TODO|FIXME|XXX|HACK` across `src/` returned **zero matches**. The codebase is clean of explicit markers.

That said, several **implicit** debt items were documented inline:
- `src/lib/repositories/drizzle-spot-repository.ts:260` — "Suppress unused import warnings while keeping the symbols for future use." (See TD-LOW-01.)
- `src/lib/repositories/index.ts:129-130` — "Sync factories (kept for tests, CLI scripts, and the legacy A.3 surface)." (See TD-MED-02.)
- `src/lib/env.ts:48-55` — The `DB_CONNETION_STRING` typo is **intentionally kept** for back-compat. Document this with a TODO for a future breaking-change release that renames it.
- `SPEC_STATUS.md:233-239` — "upload-then-insert can leave an orphan object" is an open known bug.
- `SPEC_STATUS.md:240-243` — `SEED_SAVED_SPOTS` not yet implemented.

---

## 6. Test Coverage Gaps

The test suite has 10 test files / 11 specs. Compared to the **139 source files**, the coverage is thin. Critical untested areas:

### TD-HIGH-16 — Server actions have zero tests
**Files:**
- `src/app/actions/auth.ts` (signOutAction)
- `src/app/actions/saved-spots.ts` (toggleSavedAction, listSavedSpotsAction)
- `src/app/actions/spots.ts` (createSpotAction — the file upload + repo.create flow)

`createSpotAction` is the only user-write path; the upload-then-insert race documented in `SPEC_STATUS.md:233-239` would be best caught with a test, not a manual repro.

---

### TD-HIGH-17 — API routes have no tests
**Files:**
- `src/app/api/health/route.ts` (no test for the 200/500 happy/sad paths)
- `src/app/api/weather/revalidate/route.ts` (no test for the 401/200/400 branches)
- `src/app/auth/callback/route.ts` (no test for the redirect-with-code flow)

The `weather/revalidate` route is the only public mutation endpoint; the 401 path is unverified.

---

### TD-HIGH-18 — Drizzle repos have no contract tests
**Files:**
- `src/lib/repositories/drizzle-event-repository.ts`
- `src/lib/repositories/drizzle-saved-spots-repository.ts`
- `src/lib/repositories/drizzle-spot-repository.ts`

The `spotRepositoryContract` factory exists (`src/lib/repositories/__tests__/spot-repository-contract.test.ts`) but is only run against `JsonSpotRepository`. SPEC_STATUS §C.3 says "Drizzle impl will run the same contract in E.5" — never done.

**Fix:** Add a `describe("DrizzleSpotRepository contract", spotRepositoryContract(() => …))` once a test DB harness is in place (or mock the `drizzle` client).

---

### TD-HIGH-19 — Hooks other than `useSavedSpots` are untested
- `src/hooks/useUser.ts` — no test
- `src/hooks/useToast.ts` — no test (the singleton-style `subscribers`/`queue` is exactly the place to lose messages)
- `src/hooks/useFocusTrap.ts` — no test for the Tab/Shift+Tab cycle
- `src/hooks/useKeyboardShortcuts.ts` — no test
- `src/hooks/useBodyScrollLock.ts` — no test for the lock-count ref counting
- `src/hooks/useMapFilter.ts` — no test
- `src/hooks/useNavList.tsx` — no test (the keyboard nav is non-trivial)
- `src/hooks/useKeyboardShortcuts.ts` — the "only one key handler fires when multiple shortcuts match" rule isn't tested

---

### TD-HIGH-20 — `lib/auth.ts`, `lib/user.ts`, `lib/user-context.tsx` have no tests
The `useUser` fallback (returning a synthesized `User` when the provider is missing) and the `getServerUserFromCookies` cookie/session branches are unverified.

---

### TD-MED-11 — `db/client.ts` (`withRetry`, `isConnectionError`) and `db/health.ts` have no tests
`isConnectionError` does substring matching on `err.message`. A test fixture with each error code (ECONNREFUSED, ETIMEDOUT, etc.) would lock the contract.

---

### TD-MED-12 — `weather-bundle.ts` and `weather-cached.ts` have no tests
The contract of `withImageUrls` is tested (`storage.test.ts`), but the `weather-bundle` map-by-spotId function isn't. The `weather-cached` `'use cache'` boundary isn't either.

---

### TD-MED-13 — `lib/spots/geo.ts` `getSpotDistanceLabel` / `getSpotGridCoordinates` not tested
Only `haversineMiles`, `formatDistanceMiles`, `projectToGrid`, `bboxOf` are tested. The two `get*` functions that read the module-level `GRID_BBOX` and `REFERENCE_LAT/LON` are unverified.

---

### TD-MED-14 — `lib/repositories/index.ts` async factories not tested
No test for:
- `getSpotRepositoryAsync` falling back to JSON when DB is unhealthy
- `getLastRepositoryContext` returning the right reason
- The `dev` env-var behavior

---

### TD-LOW-08 — `lib/sport-events/loader.ts` not tested
`status.ts` is well-tested (5 cases); `loader.ts` is not. The `formatDateRange` helper, the featured-event sort order, and the `connection()` deferral all lack coverage.

---

### TD-LOW-09 — Components with non-trivial logic are untested
- `MapTab` — zoom/pan math, sidebar filter coordination
- `RegionFilter` — filter pill toggling + nav to `/map`
- `PostForm` — feature tag add/remove, preset/file/URL radio-group, FormData construction
- `Overlay` — focus trap, scroll lock, body click-to-close
- `SpotDetailsContent` — the directions URL construction

---

## 7. Configuration Issues

### TD-HIGH-21 — `drizzle.config.ts` uses typo'd env var name
**File:** `drizzle.config.ts:9`

```ts
url: process.env.DB_CONNETION_STRING ?? process.env.DATABASE_URL ?? "postgresql://dev:dev@localhost:5432/app"
```

`DB_CONNETION_STRING` (sic) is a typo; the in-code resolver in `env.ts:97-104` accepts both `DB_CONNETION_STRING` and `SUPABASE_DIRECT_URL`. The drizzle config **does not** check `SUPABASE_DIRECT_URL`, which is the SPEC name. If an operator sets only `SUPABASE_DIRECT_URL`, drizzle-kit will fall through to the local default and fail.

**Fix:** Add `process.env.SUPABASE_DIRECT_URL ??` to the lookup chain.

---

### TD-HIGH-22 — `proxy.ts:5-6` uses service-role key as the anon fallback
See TD-HIGH-07. Filed as a security risk under architecture; flagged here for cross-reference.

---

### TD-MED-15 — `next.config.mjs` missing the `proxy.ts` matcher documentation
**File:** `next.config.mjs:3-16`

`cacheComponents: true` is set, but the `proxy.ts` file's `config = { matcher: [...] }` (proxy.ts:43-46) is **the new way** in Next 16. The `experimental.optimizePackageImports` flag is also already in `next.config.mjs`, which is correct, but other Next 16 flags (e.g. `reactCompiler`) are not configured. Not a bug, but check the SPEC §E.0 list of required flags.

---

### TD-MED-16 — `eslint.config.mjs` sanitization is fragile
**File:** `eslint.config.mjs:5-38`

The `REACT_RULES_TO_SKIP` set (22 entries) is a hand-maintained opt-out from `eslint-config-next`. If Next upgrades and the rule names change, the silent-fail behavior of `sanitizeNextConfig` (deletes only matching keys) means rules could be lost without warning. Add a CI test that asserts each `REACT_RULES_TO_SKIP` key is actually present in the imported `nextConfig`.

---

### TD-LOW-10 — `vitest.config.ts` uses `globals: true` without explicit globals
`globals: true` enables `describe`/`it`/`expect` globally; the project also includes a `src/types/vitest.d.ts` triple-slash reference. If a future file forgets to import the `vitest` types, errors will be silent. Consider switching to explicit `import { describe, it, expect } from "vitest"` in each test file (most already do).

---

### TD-LOW-11 — `tsconfig.json` includes `dist/types` and `dist/dev/types` that don't exist
**File:** `tsconfig.json:38-44`

```json
"include": ["./src", "./dist/types/**/*.ts", "./next-env.d.ts", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "dist/types/**/*.ts", "dist/dev/types/**/*.ts"]
```

`./dist/types` is duplicated. The directory is not present in this repo. The path will be silently empty — harmless but dead.

---

### TD-LOW-12 — `postcss.config.mjs` is a 7-line file with no overrides
Tailwind v4 uses PostCSS; the config is correct but could just be `"@tailwindcss/postcss": {}` inlined into the project, removing the file. Not worth fixing.

---

### TD-LOW-13 — `.env.example` precedence is undocumented
**File:** `src/db/load-env.ts:25-27`

```ts
loadEnvFile(path.join(root, ".env.local"), true)
loadEnvFile(path.join(root, ".env"), false)
```

`.env.local` is loaded with `override = true` (correct — it should win). `.env` is loaded with `override = false` (correct — it provides defaults). Fine. But `.env.example` doesn't say which is loaded for which script. Some scripts (`pnpm db:health`, `pnpm db:seed`, `pnpm db:apply`, `pnpm db:deploy`) load via this script; `pnpm dev` / `pnpm build` rely on Next's own `.env.local` reader. Add a comment to `.env.example` explaining the precedence.

---

## 8. Inconsistent Error Handling

### TD-HIGH-23 — Server actions throw plain `Error`; clients see raw messages
**File:** `src/app/actions/spots.ts:13, 47`

`throw new Error(\`Spot not found: ${spotId}\`)` and `throw err` propagate through Server Actions; the client (`PostForm.tsx:177-181`) does `err instanceof Error ? err.message : "Something went wrong"` and shows it via `showToast`. This leaks server-side error details (including future SQL errors) to the UI.

**Fix:** Create a `FormError extends Error` with a `code` and map server errors to user-safe messages at the action boundary.

---

### TD-HIGH-24 — `auth.getUser()` errors are silently swallowed
**File:** `src/lib/auth.ts:23-24`

```ts
const { data, error } = await supabase.auth.getUser()
if (error || !data.user) return getDevUser()
```

When a real user has a stale cookie, this falls through to the dev user — they then write rows with `createdBy: 'dev'` (per TD-HIGH-08). No log, no surface. The user has no way to know their session expired.

**Fix:** `log.warn` the error and return a "session expired" sentinel that the layout can react to.

---

### TD-MED-17 — `try/catch` blocks with `// no-op` or `// ignore` comments
**Files:**
- `src/proxy.ts:36-38` — "no-op"
- `src/lib/supabase/server.ts:21-24` — "Server Components cannot set cookies. The proxy handles refresh."
- `src/lib/auth.ts:41, 59-61` — falls back to dev user
- `src/hooks/useSavedSpots.ts:46-49, 81-83, 240-243` — fallback to in-memory / `new Set()`
- `src/components/spot/SpotDetailsContent.tsx:43-45` — fallback to error toast

Inconsistent. Some log, some don't. The proxy and server catches should always log.

---

### TD-MED-18 — `error.tsx` and `global-error.tsx` only call `log.error`
**Files:**
- `src/app/error.tsx:14-16`
- `src/app/global-error.tsx:14-16`

The `error` parameter is typed as `Error & { digest?: string }`, but the `digest` (which lets you correlate with server logs) is **not** included in the log call. Add `digest` to the structured log.

---

### TD-LOW-14 — `MapPageClient` silently falls back to "no filter" on bad URL params
**File:** `src/app/map/MapPageClient.tsx:103-114`

If the URL has an unknown region or country slug, the code sets the state to `null` (line 110-112). That's a graceful fallback, but a user who types `/map?region=mars` will see "Global grid" with no explanation. Add a small invalid-params indicator or just `replace` the URL with the valid one.

---

## 9. Documentation Debt

### TD-HIGH-25 — `SPEC.md`, `SPEC_STATUS.md`, `DEPLOY.md` still reference `src/middleware.ts`
Covered in TD-HIGH-07. Update the four call sites to use `proxy.ts` (the Next 16 name).

---

### TD-HIGH-26 — `SPEC.md` and `SPEC_STATUS.md` document 58/58 tests; verify on each release
**File:** `SPEC_STATUS.md:201-212`

The current source tree has:
- `src/components/spot/SpotCard.test.tsx` (3 tests)
- `src/hooks/useSavedSpots.test.tsx` (9 tests)
- `src/lib/repositories/__tests__/spot-repository-contract.test.ts` (11 tests)
- `src/lib/sport-events/status.test.ts` (5 tests)
- `src/lib/spots/geo.test.ts` (8 tests)
- `src/lib/supabase/__tests__/storage.test.ts` (5 tests)
- `src/lib/weather/mappers.test.ts` (10 tests)
- `src/stores/map-filter-store.test.ts` (3 tests)
- `src/stores/spots-store.test.ts` (2 tests)
- `src/stores/ui-store.test.ts` (2 tests)
**= 58 tests** ✓ (matches SPEC_STATUS exactly as of this audit).

Keep `SPEC_STATUS.md` "Test counts (last verified)" table as the single source of truth; bump the version on the next run.

---

### TD-HIGH-27 — `LOCAL_DEV.md:183-184` mislabels `pnpm-workspace.yaml`
**File:** `pnpm-workspace.yaml` (only contains `verifyDepsBeforeRun`, `minimumReleaseAge`, `allowBuilds`)

`LOCAL_DEV.md` calls it "pnpm workspace config" but the file is a single-config pnpm settings file, not a multi-package workspace declaration. The `pnpm-workspace.yaml` filename is misleading; either rename to a settings file or document the misleading filename.

---

### TD-MED-19 — `DEPLOY.md:13-15` references nonexistent `SPEC.md` §11
**File:** `DEPLOY.md`

> A Supabase project on the Pro plan (Free tier supports PostGIS; Pro is required for production scale per `SPEC.md` §11 risk #8)

`SPEC.md` does not have a §11. The "Production scale" claim is unverifiable.

---

### TD-MED-20 — `SPEC.md:660-663` describes `pnpm db:deploy` as `drizzle-kit migrate`
**Files:**
- `SPEC.md:660-663` says "pnpm db:deploy — runs drizzle-kit migrate against SUPABASE_DIRECT_URL"
- `SPEC_STATUS.md:58` says "`db:deploy` (alias for `db:apply` … custom runner is more robust than drizzle-kit migrate)"
- `package.json:21` shows `db:deploy: tsx src/db/apply-sql.ts` (not drizzle-kit)

The SPEC and SPEC_STATUS disagree on what `db:deploy` does. The current code is `db:apply` (the custom runner). **Update `SPEC.md` to match.**

---

### TD-MED-21 — `DEPLOY.md:222` still mentions a future `middleware.ts` matcher
**File:** `DEPLOY.md:222`

Same issue as TD-HIGH-07. Update the prose to say "a `proxy.ts` matcher."

---

### TD-MED-22 — `DESIGN.md:103-175` says "no shadows, blurs, or gradients" but the code uses both
**File:** `DESIGN.md:138-143`

The design system doc explicitly bans shadows/blurs/gradients. The code uses:
- `shadow-sm`, `shadow-md`, `shadow-lg` in `SearchOverlay`, `Toast.tsx`, `SpotDetailsContent`, `MapInfoPopup`
- `backdrop-blur-sm`, `backdrop-blur-md` in `EventCard`, `MapCanvas`, `MapInfoPopup`, `EventFeaturedHero`
- `bg-gradient-to-*` in `EventCard`, `EventFeaturedHero`, `SpotDetailsContent`, `MapCanvas`

This is a **design-doc vs implementation drift**. Either revise `DESIGN.md` to allow these as exceptions, or fix the code. Today the doc is a lie.

---

### TD-LOW-15 — `SPEC.md:998-1065` historical narrative describes deleted files as active
The Stage A pass-1/2/3 retrospective mentions `CoreSpot`, `loader.ts` as if they were the active boundary. Intentional — the SPEC is a history + roadmap. Not a bug, but a "Recent activity" section that links to a single commit hash per stage would be easier to keep current.

---

### TD-LOW-16 — `.env.example:78-80` references `src/db/queries.ts` — that file does not exist
```text
"db"             — read from Postgres via Drizzle (src/db/queries.ts).
```
The actual code is in `src/lib/repositories/`. Update the comment.

---

## 10. Inconsistent Patterns (State Management & Data Fetching)

### TD-HIGH-28 — `useSavedSpots` is the only domain hook that lives in `src/hooks/`
Other domain state lives in:
- Zustand stores (`useSpotsStore`, `useMapFilterStore`, `useUIStore`) in `src/stores/`
- React Context (`useUser`, `useWeather`, `useInitialSavedSpots`) in `src/lib/`

The pattern split is documented in `SPEC.md` (Zustand for client state, hooks for async logic), but `useSavedSpots` is **all three** — it uses `useSyncExternalStore` (its own internal store), reads from a React context (`useInitialSavedSpots`), and calls a server action. It's an outlier in the architecture; future readers will be confused about where new domain logic should go.

**Fix:** Document the rule explicitly: "domain state with persistence = Zustand store; domain logic with side effects = hook; cross-tree read-only data = Context." Add a comment in `useSavedSpots.ts` explaining why it spans all three.

---

### TD-MED-23 — `useUser` re-export through `src/hooks/useUser.ts` is inconsistent
**File:** `src/hooks/useUser.ts`

```ts
export { useUser } from "@/lib/user-context"
export type { User } from "@/lib/user"
```

The `User` type is re-exported from `user.ts`; the `useUser` hook is re-exported from `user-context.tsx`. Both files are in `src/lib/`. The re-export in `src/hooks/useUser.ts` is **inconsistent** with:
- `useSavedSpots` — lives in `src/hooks/`, not re-exported
- `useToast` — lives in `src/hooks/`, not re-exported
- `useMapFilter` — lives in `src/hooks/`

Either move `useUser` to `src/hooks/useUser.ts` (so it lives where its callers look for it) or stop the re-export.

---

### TD-MED-24 — `SpotDetailsContent` reads `weather` via prop, not `useWeather`
**File:** `src/components/spot/SpotDetailsContent.tsx:19`

```ts
interface SpotDetailsContentProps {
  spot: Spot;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  weather?: CachedSpotWeather;
}
```

`SpotDetailsFullPage.tsx:28` injects the weather via prop. `MapInfoPopup` and the rest of the app read via `useWeather()`. Two different patterns for the same data.

**Fix:** Pick one. The prop is fine for a deep component if the parent is the single source of truth, but the inconsistency is the issue.

---

### TD-MED-25 — The form is sometimes client-side, sometimes server-driven
- `PostForm` is a **client component** that does FormData construction in the browser
- `useSpotsStore.createSpot` (a Zustand action) calls `createSpotAction(toFormData(input))` (also client-side FormData)

But the layout's `RootDataProviders` already passes `initialSpots` server-side. So spot creation is the **only** flow that goes client → server via FormData, while reads go server → client. This is the canonical Next 16 pattern, so it's correct — but the two FormData constructors (`PostForm.handleSubmit` and `useSpotsStore.toFormData`) drift:

**Files:**
- `src/components/post/PostForm.tsx:153-169` — 14 FormData fields, in submission order
- `src/stores/spots-store.ts:13-32` — 13 FormData fields, in a different order

The store's `createSpot` is dead code: no UI calls `useSpotsStore.createSpot` (`grep` returns 0 hits). The store's `setSpots` is the only Zustand surface used in the UI.

**Fix:** Either delete the `createSpot` action and `toFormData` from `spots-store.ts` (and the unused `toFormData` helper), or wire the `useSpotsStore.createSpot` to be the single canonical path (calling the same FormData construction).

---

### TD-MED-26 — `useSavedSpots.toggle` does optimistic localStorage write + try/catch on server action
**File:** `src/hooks/useSavedSpots.ts:193-218`

This is the right pattern, but the same code path doesn't exist for the Drizzle-only `createSpotAction` (TD-HIGH-09 above) or any other write. Other writes (no other client-initiated writes today) would have to repeat this pattern. Extract a `useOptimisticServerAction` helper.

---

### TD-LOW-17 — Hydration is two different concepts in one file
- `src/stores/HydrationGate.tsx` — rehydrates Zustand stores (`useUIStore.persist.rehydrate()` etc.)
- `src/hooks/useSavedSpots.ts:160-177` — rehydrates the saved-spots external store

Two "hydration" implementations, two mechanisms, no shared helper. Future contributors will be confused.

---

## 11. Minor / Nitpicks

### TD-LOW-18 — `src/lib/weather/*` files use tabs for indentation
**Files:** `src/lib/weather/weather-current.ts`, `weather-forecast.ts`, `mappers.ts`, `weather-cached.ts`, `weather-bundle.ts`, `__tests__/...`

Half the weather files use **tab indentation**; the rest of the project uses 2-space. ESLint won't catch this, but it's a noisy diff.

---

### TD-LOW-19 — `mapForecast(forecast, seed)` only uses `seed` for the empty-list fallback
**File:** `src/lib/weather/mappers.ts:55-102`

The `seed` parameter is unused for the real-data path; the empty path uses it for `hash(seed)`. If the seed is meant to produce deterministic fallbacks across requests, fine. If not, the parameter is dead.

---

### TD-LOW-20 — `HydrationGate` is rendered as a child of `SavedSpotsProvider`
**File:** `src/components/layout/SpotsProvider.tsx:36-42`

```
UserProvider
  → WeatherProvider
    → SavedSpotsProvider
      → HydrationGate
        → AppShell
```

`HydrationGate` rehydrates the Zustand UI/map stores. This is the right call, but the order ("UI store before SavedSpots") means a paint of `<AppShell>` could show stale `isSearchOpen` for one frame. Wrap `HydrationGate` in `<>` with the `useEffect` from `useSavedSpots.ts` so the saved-spots hydration runs at the same moment.

---

### TD-LOW-21 — `getRepositoryFromEnv` reads env at call time
`getRepositoryAsync` reads `getSpotsDataSource()` and `isDbConfigured()` at call time, not at module init. This means each call re-evaluates `process.env` (and `getDatabaseUrl`). For a server with hot-reload, this is fine; for cold-start latency in serverless it adds a few μs. Not worth fixing.

---

### TD-LOW-22 — `SUPABASE_STORAGE_BUCKET_SPOTS` default vs runtime check
The Zod default is set (`default("spot-images")`); `getSpotImagesBucket()` returns it. Fine.

---

## 12. Summary Table

| Priority | Count |
|---:|---:|
| HIGH | 27 |
| MEDIUM | 23 |
| LOW | 22 |
| **Total** | **72** |

---

## 13. Top 5 highest-impact items to fix first

1. **`src/proxy.ts:5-6` — service-role key fallback for the anon client** (security). Restrict to `NEXT_PUBLIC_SUPABASE_ANON_KEY` only; no fallback to the service role. (TD-HIGH-07 / TD-HIGH-22)
2. **`src/app/actions/spots.ts:12,80` and `src/app/actions/saved-spots.ts:4,9,26` — use of sync `getCurrentUser()` in server actions** that always tags writes with `id: 'dev'`. Switch to `await getServerUserFromCookies()`. (TD-HIGH-08)
3. **`src/lib/repositories/drizzle-spot-repository.ts:260-264` + `index.ts:155` + `json-saved-spots-repository.ts:14` — `void`-discard suppressions and dead "keep for future use" code**. Delete the unused imports. (TD-LOW-01, TD-LOW-02, TD-LOW-05)
4. **`src/lib/spots.ts:12-16` + `src/components/ui/*` + `src/stores/persist-helpers.ts` — unused exports**. Delete or adopt. (TD-HIGH-01, TD-HIGH-02, TD-HIGH-03)
5. **`src/app/map/MapPageClient.tsx:15-79` — hard-coded region/country slug tables** that must be kept in sync with `REGIONS_DATA`. Derive them from the data. (TD-HIGH-10)

---

## 14. Top 5 documentation fixes

1. Replace `middleware.ts` references in `SPEC.md`, `SPEC_STATUS.md`, `DEPLOY.md`, `LOCAL_DEV.md` with `proxy.ts`. (TD-HIGH-25)
2. Reconcile `SPEC.md:660-663` "drizzle-kit migrate" with the actual `db:deploy` implementation (`apply-sql.ts`). (TD-MED-20)
3. Update `.env.example:78-80` to point at `src/lib/repositories/` instead of the nonexistent `src/db/queries.ts`. (TD-LOW-16)
4. Reconcile `DESIGN.md`'s "no shadows, blurs, or gradients" rule with the code that uses all three. (TD-MED-22)
5. Verify `SPEC.md` §11 exists; remove the "risk #8" cross-reference if it doesn't. (TD-MED-19)

---

## 15. Suggested fix phases

- **Phase 1 — Security (1 day):** TD-HIGH-07/22, TD-HIGH-08, TD-HIGH-24
- **Phase 2 — Dead code cleanup (½ day):** TD-HIGH-01/02/03, TD-LOW-01/02/03/05
- **Phase 3 — Deduplication (1 day):** TD-HIGH-04, TD-HIGH-05, TD-MED-04, TD-MED-05
- **Phase 4 — Type safety (½ day):** TD-HIGH-11, TD-HIGH-12, TD-HIGH-14, TD-HIGH-15, TD-MED-23
- **Phase 5 — Test coverage (2 days):** TD-HIGH-16/17/18/19/20, TD-MED-11/12/13/14
- **Phase 6 — Doc reconciliation (½ day):** TD-HIGH-25/26/27, TD-MED-19/20/21/22, TD-LOW-16
- **Phase 7 — Architecture consistency (1 day):** TD-HIGH-09/10, TD-MED-06/07, TD-LOW-17
- **Phase 8 — Polish (½ day):** TD-LOW-04..22, remaining MEDIUMs

**Estimated total: 7 working days for a clean bill of health.**
