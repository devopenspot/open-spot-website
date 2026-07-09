---
spec: Single Source of Truth (DB-Only) Refactor
status: Approved (plan), pending implementation
owner: TBD
target release: TBD
last updated: 2026-07-09
replaces: SPEC.md (Admin Dashboard — implementation complete, archived)
---

# SPEC — Single Source of Truth (DB-Only) Refactor

This spec replaces the current `SPEC.md` (Admin Dashboard). The Admin Dashboard
implementation is complete (`src/app/admin/**`, `src/app/actions/admin-*.ts`,
`src/components/admin/**`, `src/app/api/geocode/reverse`, `src/lib/admin.ts`,
related tests) and that plan is archived.

The new spec removes the JSON/DB data-source duality, collapses dimension
reads onto the database as the single source of truth, and deletes the
duplicated and dead code the duality created. The goal is a simpler,
scalable data layer with one read path (Postgres via Drizzle), one set of
dimension tables, and no env-driven runtime branching.

---

## 0. Glossary

| Term | Meaning |
| --- | --- |
| Single source of truth | The Postgres database (via Drizzle) is the only runtime read path for spots, events, saved spots, and dimension data (regions, countries, spot types, disciplines, tiers). No runtime fallback, no env toggle. |
| Seed source | The static files in `src/data.ts` + `src/data/*.json` used **only** by `src/db/seed.ts` to bootstrap a fresh database. Not a runtime read path. |
| Dimension data | Lookup tables (`regions`, `countries`, `spot_types`, `sport_disciplines`, `event_tiers`) seeded once and read from the DB at runtime. |
| UI config | Static constants that are **not** in the DB (preset images). Stay as a small constant module. |
| Dead code | Symbols with zero callers (confirmed by grep + knowledge graph). Deleted in phase 6. |
| Duality | The JSON/DB split: `SPOTS_DATA_SOURCE` env var, `getSpotsDataSource()`, `Json*Repository` classes, the async-factory JSON-fallback branch, the `DataModeNotice` banner, the `writeEnabled` prop, and the `getTerrainOptionsFromSource` JSON branch. |

---

## 1. Goals

1. **One read path.** All spot, event, saved-spot, and dimension reads go through the Drizzle repositories. The JSON repositories and the `SPOTS_DATA_SOURCE` toggle are deleted.
2. **One source for regions.** `REGIONS_DATA` is no longer bundled into client components. The root layout fetches regions from the DB and delivers them to the client tree via the existing `SpotsProvider` (already the server→client data bridge).
3. **No env-driven runtime branching for data.** `getSpotsDataSource()` and the `writeEnabled`/`DataModeNotice` admin machinery are deleted. The DB is required at all times.
4. **No dead code in the data layer.** Unused getters, the sync factory duplicates, and the JSON-only transformation helpers are deleted.
5. **No ambiguous dimension reads.** `getTerrainOptionsFromSource()` collapses to a single DB read. `pickFallbackImage` and `getPresetImages` (UI config) stay as the only non-DB helpers.

## 2. Non-goals

- Changing the public visual UX (regions still render in the same place; the "Browse Regions" grid still shows the same shape).
- Changing the auth axis. `isSupabaseConfigured()` and the dev-placeholder user fallback stay (separate concern from the data axis).
- Changing the Drizzle schema. The `regions` / `countries` / `spot_types` tables and their relations are already in `src/db/schema.ts` and the single consolidated `supabase/migrations/0000_initial_data_model.sql`.
- Changing `src/db/seed.ts`. It still uses `src/data.ts` + `src/data/*.json` as the bootstrap source.
- Soft delete, audit log, or any new migration. The `0000_initial_data_model.sql` is the only migration.

## 3. Decisions

| # | Decision | Rationale |
| --- | --- | --- |
| D1 | **DB is required to run dev and prod.** `pnpm dev` and `pnpm build` both require a reachable Postgres. No silent JSON read fallback. | Truest single source of truth. The user explicitly chose this over "keep a JSON dev fallback." Surfaces DB setup issues immediately. |
| D2 | **Regions flow server→client via `SpotsProvider` (Zustand store).** Not prop-drilled through `AppShell` → `SearchOverlay`. | `SpotsProvider` is already the server→client data bridge (`initialSpots`, `initialWeather`, `initialUser`, `initialSavedSpots`). Adding `initialRegions` to the same provider avoids threading regions through 4+ global chrome components. |
| D3 | **Regions are a Zustand slice on `useSpotsStore`, not a new store.** | All bootstrapped, read-only reference data lives in the same store. One store, one hydration point. |
| D4 | **`getRegions()` and `getTerrainOptions()` are deleted from `src/lib/spots.ts`.** Their callers (client components) read from the store or call the repo directly. | They were the JSON-mode fallbacks. With JSON mode gone, they are dead. |
| D5 | **`getPresetImages` and `pickFallbackImage` stay** (consumed by the Drizzle spot repo and the admin `ImageSourceField` client component). | `DEFAULT_PRESET_IMAGES` is UI config not in the DB. The Drizzle repo depends on `pickFallbackImage` for the image-fallback path. |
| D6 | **The async factory signature stays `async`.** Body simplifies to a lazy singleton. | The factories were async to accommodate the now-removed `checkDbHealth()` call. Making them sync is a breaking change at 26 call sites; out of scope for this refactor. |
| D7 | **`checkDbHealth()` and `pnpm db:health` stay as a diagnostic tool**, but the async factory no longer calls it. | Useful for ops; not a runtime read-path dependency. |
| D8 | **Sync factories (`getSpotRepository`, `getEventRepository`, `getSavedSpotsRepository`) are deleted.** | Zero callers (confirmed by grep + knowledge graph). The `AGENTS.md` note that they were "kept for tests, CLI" is stale. |
| D9 | **`src/data.ts` keeps** `REGIONS_DATA`, `COUNTRY_NAME_OVERRIDES`, `COUNTRY_TO_REGION`, `DEFAULT_PRESET_IMAGES` (the seed source). **Deletes** `EXPLORE_CATEGORIES`, `LEGENDARY_TERRAINS`, `POPULAR_SEARCH_TERMS`, `RECENT_SEARCHES`, `TERRAIN_OPTIONS` (dead). | The kept constants are the seed bootstrap. The deleted ones have zero callers. |
| D10 | **`src/data/spots.json` and `src/data/sport-events.json` stay** as the seed source. Not a runtime read path. | `src/db/seed.ts` still reads them. After the refactor, they are a **one-time bootstrap** for a fresh DB, not a fallback. |
| D11 | **The `writeEnabled` prop and `DataModeNotice` are deleted.** Admin write buttons are always enabled. | The DB is always the source, so writes always work. The prop and banner are pure JSON-mode scaffolding. |
| D12 | **The `Region.count` display field is computed** from `repo.listRegions()` spot counts (live data), not a static string. | "1.2k Spots" etc. in the seed were invented. Live counts are honest and match the single-source-of-truth principle. |

## 4. Architecture after the refactor

### 4.1 Read path (collapsed)

```
Server Component / Server Action
  └─ await getSpotRepositoryAsync()   ← lazy singleton, returns DrizzleSpotRepository
       └─ getDbClient()               ← throws if DATABASE_URL* not set
            └─ postgres(url, { ssl: "require" })
                 └─ drizzle(client, { schema })
```

There is no `if (source === "json")` branch anywhere. The factory body becomes:

```ts
let repo: SpotRepository | null = null
export async function getSpotRepositoryAsync(): Promise<SpotRepository> {
  if (!repo) {
    const { db } = getDbClient()
    repo = new DrizzleSpotRepository(db)
  }
  return repo
}
```

`getEventRepositoryAsync` and `getSavedSpotsRepositoryAsync` follow the same shape.

### 4.2 Dimension reads (collapsed)

`getTerrainOptionsFromSource()` (in `src/lib/spots/source.ts`) loses the JSON branch and becomes a single DB read:

```ts
export const getTerrainOptionsFromSource = cache(
  async (): Promise<readonly TerrainOption[]> => {
    const repo = await getSpotRepositoryAsync()
    const facets = await repo.listTypes()
    return facets.map((f) => ({ value: f.name, label: f.name }))
  },
)
```

### 4.3 Region delivery (server→client)

```
RootDataProviders (app/layout.tsx, async server component)
  └─ Promise.all([
       getSpotRepositoryAsync(),         ← existing
       getWeatherForAllSpots(),          ← existing
       getServerUserFromCookies(),       ← existing
       getRegionsForClient(),            ← NEW: regions+countries join + spot counts
     ])
  └─ <SpotsProvider
       initialSpots={...}                ← existing
       initialRegions={...}              ← NEW
       initialWeather={...}              ← existing
       initialUser={...}                 ← existing
       initialSavedSpots={...}           ← existing
     >
       └─ <AppShell> → <SearchOverlay>   ← reads regions from useSpotsStore
       └─ <MapTab>                       ← reads regions from useSpotsStore
       └─ <ExploreTab>                   ← reads regions from useSpotsStore
```

`getRegionsForClient()` is a new server function that:
- Joins `regions` + `countries` (via the existing `regionsRelations` / `countriesRelations`).
- Calls `repo.listRegions()` for live spot counts per region.
- Returns `Region[]` with `name`, `desc` (from `description`), `image` (from `imageUrl`), `link` (derived: `/map?region={slug}`), `count` (formatted from `spotCount`: e.g. `"1.2k"`, `"892"`), `countries` (array of country names).

### 4.4 `useSpotsStore` (extended)

```ts
interface SpotsState {
  spots: readonly Spot[]
  regions: readonly Region[]   // NEW
  setSpots: (spots: readonly Spot[]) => void
  setRegions: (regions: readonly Region[]) => void   // NEW
}
```

`SpotsProvider` hydrates both slices in the same `useEffect`. The existing `setSpots` call is joined by `setRegions(initialRegions)`.

### 4.5 Admin (simplified)

- `DataModeNotice` component: **deleted**.
- `getSpotsDataSource()`: **deleted** from `env.ts`.
- `SPOTS_DATA_SOURCE` env var: **deleted** from the Zod schema and `.env.example`.
- `writeEnabled` prop: **deleted** from all 7 admin pages and 6 admin components/forms. Write buttons are always enabled. The "DB mode required" tooltip strings are deleted.
- The `if (!writeEnabled) { … SPOTS_DATA_SOURCE=db }` JSX blocks in 4 admin forms are deleted.
- `SpotFormFields`'s `writeEnabled` prop (defaults to `true`, used to flip the lat/lon editor to read-only): **deleted**. The lat/lon editor is always editable.

## 5. File-by-file changes

### 5.1 Files to delete (13)

| File | Reason |
| --- | --- |
| `src/lib/repositories/json-spot-repository.ts` | JSON spot repo impl (365 lines). |
| `src/lib/repositories/json-event-repository.ts` | JSON event repo impl. |
| `src/lib/repositories/json-saved-spots-repository.ts` | JSON saved-spots repo impl. |
| `src/lib/repositories/spot-repository.ts` | The `SpotRepository` interface — see §5.3. |
| `src/lib/repositories/event-repository.ts` | The `EventRepository` interface — see §5.3. |
| `src/lib/repositories/saved-spots-repository.ts` | The `SavedSpotsRepository` interface — see §5.3. |
| `src/components/admin/DataModeNotice.tsx` | JSON-mode banner. |
| `src/data/sport-events.json` | Only consumed by the deleted `JsonEventRepository` (seed.ts reads from `src/db/seed.ts`'s inline data; confirm in §5.4). |
| `src/data/spots.json` | Same — only consumed by the deleted `JsonSpotRepository` (seed.ts reads from `../data/spots.json`; confirm in §5.4). |
| `src/lib/spots/source.ts` | The `getTerrainOptionsFromSource` file — collapsed to a 5-line inline call in the 2 admin pages (or moved to `src/lib/spots.ts` as a thin server-only export). |

> **§5.4 verification note:** the seed file (`src/db/seed.ts`) currently reads `src/data/spots.json` and `src/data/sport-events.json` at lines 2–3. These JSON files MUST stay if the seed still needs them. The deletion of `src/data/*.json` in the table above is **conditional on confirming the seed no longer needs them** during phase 1. If the seed still imports them, keep them. (Likely outcome: keep both JSON files, drop only the JSON repo classes.)

### 5.2 Files to keep, simplify, or extend

| File | Change |
| --- | --- |
| `src/lib/repositories/index.ts` | **Rewrite.** Drop `JsonSpotRepository`/`JsonEventRepository`/`JsonSavedSpotsRepository` imports. Drop the 3 `getJson*Repo` private helpers, `lastContext`/`forceSource`/`getLastRepositoryContext`. Drop the 3 sync factories. Keep the 3 async factories, simplified to lazy singletons. Re-export the 3 Drizzle repos as the implementations. |
| `src/lib/repositories/drizzle-spot-repository.ts` | No change. |
| `src/lib/repositories/drizzle-event-repository.ts` | No change. |
| `src/lib/repositories/drizzle-saved-spots-repository.ts` | No change. |
| `src/lib/repositories/types.ts` | No change. |
| `src/lib/repositories/spot-query.ts` | No change. |
| `src/lib/env.ts` | **Remove** `SPOTS_DATA_SOURCE` from the Zod schema and `getSpotsDataSource()`. **Keep** all auth/DB env vars and `isSupabaseConfigured()`. |
| `src/lib/db/client.ts` | No change. `getDbClient()` already throws if `getDatabaseUrl()` returns null. |
| `src/lib/db/health.ts` | No change. `checkDbHealth()` stays as a diagnostic (used by `pnpm db:health`). |
| `src/lib/spots.ts` | **Delete** `getExploreCategories`, `getLegendaryTerrains`, `getPopularSearchTerms`, `getRecentSearches`, `getRegions`, `getTerrainOptions` (and their imports from `@/data`). **Keep** `getPresetImages` and `pickFallbackImage` (Drizzle repo + admin depend on them). |
| `src/lib/spots/source.ts` | **Delete** the file. The 2 callers (`admin/spots/new/page.tsx`, `admin/spots/[id]/page.tsx`) inline the 5-line repo call, or call a new exported `getTerrainOptionsFromSource` from `src/lib/spots.ts` (which would make that file server-only). Cleanest: inline. |
| `src/lib/data/regions.ts` (new) | New server-only module. Exports `getRegionsForClient(): Promise<readonly Region[]>`. Joins `regions` + `countries`, calls `getSpotRepositoryAsync().listRegions()` for spot counts, formats the `Region[]` shape. |
| `src/stores/spots-store.ts` | **Extend** the `SpotsState` interface with `regions` and `setRegions`. |
| `src/components/layout/SpotsProvider.tsx` | **Add** `initialRegions` prop; call `useSpotsStore.setState({ regions: initialRegions })` in a `useEffect`. |
| `src/app/layout.tsx` | **Add** `getRegionsForClient()` to the `Promise.all` in `RootDataProviders`; pass `initialRegions` to `<SpotsProvider>`. |
| `src/hooks/useMapFilter.ts` | **Replace** `import { getRegions } from "@/lib/spots"` with `import { useSpotsStore } from "@/stores/spots-store"`. Change the `useMemo(() => getRegions(), [])` to `const regions = useSpotsStore((s) => s.regions)`. The `deriveRegion(spot)` helper becomes a closed-over function using the store value. |
| `src/hooks/useMapFilter.test.ts` | **Update** `beforeEach` to seed the store: `useSpotsStore.setState({ regions: TEST_REGIONS, spots: [] })`. Define `TEST_REGIONS` from the same data shape the production `getRegionsForClient` returns (a small fixture mirroring the seed). |
| `src/components/search/RegionFilter.tsx` | **Delete** the module-level `const regions = getRegions()`. Read from `useSpotsStore`. |
| `src/components/explore/ExploreTab.tsx` | **Replace** `const regions = useMemo(() => getRegions(), [])` with `const regions = useSpotsStore((s) => s.regions)`. |
| `src/app/map/page.tsx` | **Make async.** Call `getRegionsForClient()`, pass `regions` to `<MapPageClient regions={...} />`. |
| `src/app/map/MapPageClient.tsx` | **Accept** `regions` prop; pass to `MapTab`. |
| `src/components/map/MapTab.tsx` | **Accept** `regions` prop; pass to `useMapFilter(spots, searchParams, { regions })`. (Or: `useMapFilter` reads from store directly — see §6 design choice.) |
| `src/app/admin/layout.tsx` | **Delete** the `getSpotsDataSource` import, the `isJsonMode` variable, and the `<DataModeNotice>`. |
| `src/app/admin/spots/page.tsx` | **Delete** the `writeEnabled` derivation. `<SpotTable spots={...} />` (no prop). |
| `src/app/admin/spots/new/page.tsx` | **Delete** the `writeEnabled` derivation. `<AdminNewSpotForm terrainOptions={...} />` (no `writeEnabled`). |
| `src/app/admin/spots/[id]/page.tsx` | **Delete** the `writeEnabled` derivation. `<AdminEditSpotForm spot={...} terrainOptions={...} />` (no `writeEnabled`). |
| `src/app/admin/spots/new/AdminNewSpotForm.tsx` | **Delete** the `writeEnabled` prop, all `!writeEnabled` checks, the "DB mode required" label, the `{!writeEnabled ? … : …}` JSX block. |
| `src/app/admin/spots/[id]/AdminEditSpotForm.tsx` | Same as above. |
| `src/app/admin/spots/[id]/AdminEditSpotForm.tsx` (ImageSourceField) | The `imageDisabled` / `writeEnabled` props on `ImageSourceField` are dropped (see below). |
| `src/app/admin/events/page.tsx` | **Delete** the `writeEnabled` derivation. `<EventTable events={...} />` (no prop). |
| `src/app/admin/events/new/page.tsx` | **Delete** the `writeEnabled` derivation. `<AdminNewEventForm />` (no prop). |
| `src/app/admin/events/[id]/page.tsx` | **Delete** the `writeEnabled` derivation. `<AdminEditEventForm event={...} />` (no prop). |
| `src/app/admin/events/new/AdminNewEventForm.tsx` | **Delete** the `writeEnabled` prop and all conditional JSX. |
| `src/app/admin/events/[id]/AdminEditEventForm.tsx` | Same. |
| `src/components/admin/spots/SpotTable.tsx` | **Delete** the `writeEnabled` prop. Edit/Delete buttons always enabled. |
| `src/components/admin/events/EventTable.tsx` | Same. |
| `src/components/admin/spots/SpotFormFields.tsx` | **Delete** the `writeEnabled` prop (defaults to `true`). Lat/lon editor always editable. |
| `src/components/admin/spots/ImageSourceField.tsx` | **Delete** the `imageDisabled` and `writeEnabled` props (if present). |
| `src/data.ts` | **Delete** `EXPLORE_CATEGORIES`, `LEGENDARY_TERRAINS`, `POPULAR_SEARCH_TERMS`, `RECENT_SEARCHES`, `TERRAIN_OPTIONS` and their type imports (`ExploreCategory`, `LegendaryTerrain`, `TerrainOption`). **Keep** `REGIONS_DATA`, `COUNTRY_NAME_OVERRIDES`, `COUNTRY_TO_REGION`, `DEFAULT_PRESET_IMAGES`. **Keep** the `Region`, `Country`, `PresetImage` type imports. |
| `src/db/seed.ts` | No change. Still uses `src/data.ts` + `src/data/*.json` for bootstrap. |
| `.env.example` | **Delete** the `SPOTS_DATA_SOURCE` section and the `docker compose up -d infra-db` instruction's JSON-mode mention. Document that a DB is now required for dev. |
| `.env` / `.env.local` | If `SPOTS_DATA_SOURCE` is set, remove it. (Local-only; not committed.) |
| `AGENTS.md` | **Update** the "TL;DR" and "Environment quirks" sections: remove `SPOTS_DATA_SOURCE` references. Note that a DB is required for `pnpm dev` and `pnpm build`. Update the "Architecture" section: single read path (DB), no JSON repos, no `DataModeNotice`, no `writeEnabled`. Update the "Database & migrations" section: clarify the JSON files are now seed-only. |
| `nominatim-api.rest` | No change. |

### 5.3 Interface decision (in or out?)

The 3 interface files (`spot-repository.ts`, `event-repository.ts`, `saved-spots-repository.ts`) define the contracts the Drizzle repos implement. They are imported by:
- The async factories (which stay).
- The Drizzle repos (which stay).
- The JSON repos (which are deleted).
- The seed CLI (if it uses them — verify; it likely doesn't).
- The `src/lib/repositories/types.ts` re-exports (stays).

**Recommendation: keep the interfaces.** They document the contract and are a clean seam for future implementations. Only the 3 JSON `implements` statements are removed. The row in §5.1 above ("Files to delete") is **wrong** for the 3 interface files — correct it to "keep."

### 5.4 Seed file verification (phase 1)

`src/db/seed.ts` imports:
- `../data/spots.json` (line 2)
- `../data/sport-events.json` (line 3)
- `COUNTRY_NAME_OVERRIDES`, `COUNTRY_TO_REGION`, `REGIONS_DATA` from `../data` (line 6)

**Both JSON files MUST stay** for the seed to work. The row in §5.1 above is wrong — correct it. The seed is the single bootstrap path; the JSON files are its input, not a runtime fallback. If the seed is later rewritten to skip the JSON and insert directly from the seed constants + region/country tables, the JSON files can be deleted in a follow-up. Not in this refactor.

## 6. Design choice: `useMapFilter` regions via store or prop?

Two options for how `useMapFilter` receives regions:

**Option A — Store (recommended).** `useMapFilter` reads `useSpotsStore((s) => s.regions)`. No prop threading through `MapTab` or `SearchOverlay`. The store is the single source of truth on the client.

**Option B — Prop.** Add a `regions` param to `useMapFilter` and thread it through `MapTab` and `SearchOverlay`. `MapPageClient` receives it from the async `map/page.tsx`. `AppShell`/`SearchOverlay` receive it from `SpotsProvider`.

**Decision: Option A.** The store already holds `spots` (which `useMapFilter` also receives as a param, redundantly — but the param is needed for the test seam). Adding `regions` to the store avoids threading it through 3 components and keeps `useMapFilter` signature stable. The `useMapFilter` test seeds the store in `beforeEach`.

> This is the same approach as the existing `spots` hydration: `SpotsProvider` calls `setSpots(initialSpots)` and `useMapFilter` reads from the store via the param (which currently shadows the store — in practice the param and store are the same data). For regions, we **drop the param and read from the store** since the test seam for regions is the store itself.

## 7. The `Region.count` computation

`Region.count` is currently a hardcoded display string in `REGIONS_DATA` ("1.2k Spots", "840 Spots", "620 Spots"). After the refactor, `getRegionsForClient()` computes it from `repo.listRegions()`:

```ts
function formatCount(spotCount: number): string {
  if (spotCount >= 1000) return `${(spotCount / 1000).toFixed(1)}k Spots`
  return `${spotCount} Spots`
}
```

`getRegionsForClient()` does two queries:
1. `db.select().from(regions).leftJoin(countries, …).orderBy(regions.sortOrder)` — regions with their countries.
2. `repo.listRegions()` — `{ name, spotCount, countryCount }[]` from the existing facet query.

Then maps and merges by region name. The `link` is derived: `` `/map?region=${slugify(region.name)}` `` (or stored on the row if a column is added later — out of scope).

## 8. Testing impact

Zero tests break. The two action tests (`admin-spots.test.ts`, `admin-events.test.ts`) mock the async factories and are unaffected. `useMapFilter.test.ts` is **updated** (not broken) — `beforeEach` seeds the store. No test references `getSpotsDataSource`, `isSupabaseConfigured`, the JSON repo classes, or the sync factories (confirmed by grep + knowledge graph).

New test to add: `src/lib/data/regions.test.ts` — unit-test `getRegionsForClient()` with the Drizzle client mocked (or with a test DB if the project standardizes on integration tests). At minimum, a unit test for the `formatCount` helper and the slug→name mapping.

## 9. Phased implementation

| Phase | Scope | Exit criteria |
| --- | --- | --- |
| 1 | **Repository collapse.** Rewrite `src/lib/repositories/index.ts`: drop JSON imports, sync factories, `lastContext`/`forceSource`. Simplify async factories to lazy singletons. | `pnpm typecheck` green; `pnpm test` green (admin action tests still mock the async factories). |
| 2 | **Env + admin scaffolding.** Remove `SPOTS_DATA_SOURCE` from `env.ts`, `.env.example`, `.env.local`. Delete `DataModeNotice.tsx`. Remove `writeEnabled` from all 7 admin pages and 6 admin components. | `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green. The admin dashboard renders without the banner; all write buttons always enabled. |
| 3 | **Server-side regions.** Add `src/lib/data/regions.ts` with `getRegionsForClient()`. Wire `RootDataProviders` to fetch regions and pass `initialRegions` to `SpotsProvider`. Extend `useSpotsStore` with `regions` + `setRegions`. Hydrate in `SpotsProvider`. | `pnpm typecheck` green; `/explore` renders the region grid from DB data. |
| 4 | **Client regions migration.** Update `useMapFilter`, `RegionFilter`, `ExploreTab` to read from `useSpotsStore` instead of `getRegions()`. Update `useMapFilter.test.ts` to seed the store. | `pnpm test` green; the map and explore pages render the region filter from the store. |
| 5 | **Map page wiring.** Make `app/map/page.tsx` async, fetch regions, pass to `MapPageClient` → `MapTab`. | The map page renders without "use client" prop-drilling; the `regions` param on `useMapFilter` is removed (Option A). |
| 6 | **Dead-code cleanup.** Delete the 4 unused getters (`getExploreCategories`, `getLegendaryTerrains`, `getPopularSearchTerms`, `getRecentSearches`) and their constants (`EXPLORE_CATEGORIES`, `LEGENDARY_TERRAINS`, `POPULAR_SEARCH_TERMS`, `RECENT_SEARCHES`) from `src/lib/spots.ts` and `src/data.ts`. Delete `TERRAIN_OPTIONS` and `getTerrainOptions` (only used by the removed `getTerrainOptionsFromSource` JSON branch). Delete `src/lib/spots/source.ts` and inline the 5-line repo call in the 2 admin pages. | `pnpm typecheck && pnpm lint && pnpm test` green; `git grep` returns zero hits for the deleted symbols. |
| 7 | **AGENTS.md + docs update.** Update the TL;DR, env quirks, architecture, and testing sections. Remove all `SPOTS_DATA_SOURCE`, `JsonSpotRepository`, `DataModeNotice`, `writeEnabled`, and "JSON-mode fallback" references. Add a note that `pnpm dev` and `pnpm build` require a reachable Postgres. | AGENTS.md reflects the post-refactor reality. |

### 9.1 CI order

`.github/workflows/ci.yml` is unchanged: `install --frozen-lockfile` → `typecheck` → `lint` → `test` → `db:apply`. The test step does not require a DB (tests mock the repos). The `db:apply` step requires the Supabase `DB_CONNETION_STRING` secret. Local devs must run `pnpm db:health && pnpm db:apply && pnpm db:seed` once before `pnpm dev` or `pnpm build` (documented in `AGENTS.md` and `.env.example`).

### 9.2 Smoke test checklist (manual, before merge)

1. Fresh DB: `pnpm db:health` → ok. `pnpm db:apply` → applies `0000_initial_data_model.sql`. `pnpm db:seed` → seeds regions, countries, spot types, spots, events. `pnpm dev` → renders the public site.
2. `/explore` → "Browse Regions" grid renders 3 regions from the DB (Americas, Europe, Asia), each with its real spot count and a `/map?region=…` link.
3. `/map` → region pills and country pills render from the store. Selecting a region updates the URL and filters spots.
4. Cmd+K → search overlay opens. Region filter pills render. Selecting a region navigates to `/map?region=…`.
5. `pnpm dev` with no DB running → fails fast (the Drizzle client throws on the first query). No silent JSON fallback.
6. `/admin` → no `DataModeNotice` banner. All write buttons enabled. Create / edit / delete a spot and an event — changes persist.
7. `pnpm build` → succeeds (requires DB; `generateStaticParams` in `app/spots/[id]/page.tsx` calls the repo).
8. `pnpm test` → all 12 tests green.

## 10. File checklist

### 10.1 New files (1)

```
src/lib/data/regions.ts              # getRegionsForClient(): Promise<readonly Region[]>
```

### 10.2 Files to rewrite (3)

```
src/lib/repositories/index.ts        # simplify to 3 async factories + re-exports
src/lib/spots.ts                     # drop 5 dead getters, keep pickFallbackImage + getPresetImages
src/stores/spots-store.ts            # add regions + setRegions
```

### 10.3 Files to edit (~22)

```
src/lib/env.ts                                       # remove SPOTS_DATA_SOURCE + getSpotsDataSource
src/lib/data/regions.ts                              # NEW
src/components/layout/SpotsProvider.tsx              # add initialRegions prop
src/app/layout.tsx                                   # fetch + pass initialRegions
src/app/map/page.tsx                                 # async + fetch + pass regions
src/app/map/MapPageClient.tsx                        # accept + forward regions
src/components/map/MapTab.tsx                        # (option A: no change; option B: accept regions)
src/hooks/useMapFilter.ts                            # read regions from store
src/hooks/useMapFilter.test.ts                       # seed store in beforeEach
src/components/search/RegionFilter.tsx               # read from store
src/components/explore/ExploreTab.tsx                # read from store
src/app/admin/layout.tsx                             # drop DataModeNotice + getSpotsDataSource
src/app/admin/spots/page.tsx                         # drop writeEnabled
src/app/admin/spots/new/page.tsx                     # drop writeEnabled
src/app/admin/spots/[id]/page.tsx                    # drop writeEnabled
src/app/admin/spots/new/AdminNewSpotForm.tsx         # drop writeEnabled prop + JSX
src/app/admin/spots/[id]/AdminEditSpotForm.tsx       # drop writeEnabled prop + JSX
src/app/admin/events/page.tsx                        # drop writeEnabled
src/app/admin/events/new/page.tsx                    # drop writeEnabled
src/app/admin/events/[id]/page.tsx                   # drop writeEnabled
src/app/admin/events/new/AdminNewEventForm.tsx       # drop writeEnabled prop + JSX
src/app/admin/events/[id]/AdminEditEventForm.tsx     # drop writeEnabled prop + JSX
src/components/admin/spots/SpotTable.tsx             # drop writeEnabled prop
src/components/admin/spots/SpotFormFields.tsx        # drop writeEnabled prop
src/components/admin/spots/ImageSourceField.tsx      # drop imageDisabled/writeEnabled (if present)
src/components/admin/events/EventTable.tsx           # drop writeEnabled prop
src/data.ts                                          # drop 5 dead constants + imports
.env.example                                         # drop SPOTS_DATA_SOURCE section
.env / .env.local                                    # drop SPOTS_DATA_SOURCE line (local, not committed)
AGENTS.md                                            # update env + architecture + testing sections
```

### 10.4 Files to delete (6)

```
src/lib/repositories/json-spot-repository.ts
src/lib/repositories/json-event-repository.ts
src/lib/repositories/json-saved-spots-repository.ts
src/components/admin/DataModeNotice.tsx
src/lib/spots/source.ts                              # getTerrainOptionsFromSource inlined into 2 admin pages
```

> The 3 `*-repository.ts` interface files (`spot-repository.ts`, `event-repository.ts`, `saved-spots-repository.ts`) are **kept** (see §5.3).

### 10.5 Files explicitly NOT changed

```
src/lib/repositories/drizzle-spot-repository.ts
src/lib/repositories/drizzle-event-repository.ts
src/lib/repositories/drizzle-saved-spots-repository.ts
src/lib/repositories/types.ts
src/lib/repositories/spot-query.ts
src/lib/db/client.ts
src/lib/db/health.ts
src/db/seed.ts
src/db/apply-sql.ts
src/db/health-cli.ts
src/db/load-env.ts
src/db/schema.ts
src/lib/auth.ts
src/lib/auth/server.ts
src/lib/admin.ts
src/lib/user.ts
src/data/spots.json                                  # still used by seed.ts
src/data/sport-events.json                           # still used by seed.ts
supabase/migrations/0000_initial_data_model.sql
src/lib/weather/**                                   # no data-source coupling
src/components/admin/AdminShell.tsx                  # no writeEnabled/DataModeNotice coupling
src/components/admin/AdminSidebar.tsx
src/components/admin/AdminOverviewCards.tsx
src/components/admin/common/DeleteConfirmDialog.tsx
src/components/admin/common/FormSection.tsx
src/components/admin/common/KeyValueGrid.tsx
```

## 11. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| `pnpm dev` now requires a running Postgres, raising the local setup bar | Medium | Medium | `AGENTS.md` and `.env.example` document the `pnpm db:health && pnpm db:apply && pnpm db:seed` bootstrap. `docker compose` is mentioned in `.env.example`; the dev must bring their own compose file (existing constraint, not new). |
| `pnpm build` now requires a DB (`generateStaticParams` calls the repo) | Medium | Low | Documented in `AGENTS.md` and the smoke-test checklist. Vercel builds already have a DB connection. |
| Regions fetched at the root layout add a query to every request | Low | Low | The `useSpotsStore` is hydrated once per page load. `getRegionsForClient()` runs at most once per request. The regions table is small (3 rows in the seed). |
| `Region.count` changes from a static display string to a live spot count, changing what users see | Low | Low | Acceptable — live data is more honest. The format helper (`1.2k`, `892`) matches the previous visual style. |
| `useMapFilter.test.ts` needs to seed a Zustand store, which the test didn't do before | Low | Low | The test already runs in `happy-dom`; Zustand works there. `useSpotsStore.setState` is stable across renders. |
| The async factory signature stays `async` but is now trivially sync internally | Low | Low | Acceptable — the `await` overhead is microseconds. Making it sync touches 26 call sites and is out of scope. Follow-up note in `AGENTS.md`. |
| The 3 sync factory deletions break a hidden caller (despite grep + graph showing zero) | Very low | Low | `pnpm typecheck` catches dangling references. The sync factories are not exported in any `index.ts` barrel that would be hard to grep. |
| Deleting `TERRAIN_OPTIONS` breaks a hidden consumer | Very low | Low | The constant is exported from `src/data.ts` and used by exactly one function (`getTerrainOptions` in `src/lib/spots.ts`), which itself has one caller (`getTerrainOptionsFromSource`). All confirmed deleted in phase 6. |

## 12. Decisions log

| # | Decision | Rationale | Alternatives considered |
| --- | --- | --- | --- |
| D1 | **DB is required to run dev** | Truest single source of truth. Surfaces DB setup issues immediately. No silent fallback. | Keep a dev-only JSON read fallback; keep `seed.ts` as a one-time bootstrap only (but that IS this decision — the seed stays, the runtime doesn't). |
| D2 | **Regions delivered via `SpotsProvider` (Zustand)** | `SpotsProvider` is already the server→client data bridge. Avoids prop-drilling through 4+ global chrome components. | Pure prop threading through `MapPageClient` → `MapTab` and `AppShell` → `SearchOverlay`. More verbose, same outcome. |
| D3 | **Regions as a slice on `useSpotsStore`, not a new store** | All bootstrapped, read-only reference data lives in the same store. One store, one hydration point. | New `useRegionsStore`. More indirection for no benefit. |
| D4 | **`getRegions` and `getTerrainOptions` deleted from `src/lib/spots.ts`** | They were the JSON-mode fallbacks. With JSON mode gone, dead. | Keep them as thin wrappers over the store — adds a layer for no benefit. |
| D5 | **`getPresetImages` and `pickFallbackImage` stay** | `DEFAULT_PRESET_IMAGES` is UI config not in the DB. Drizzle repo + admin `ImageSourceField` depend on it. | Move preset images to a DB table — out of scope, no clear win. |
| D6 | **Async factory signature stays `async`** | Changing it touches 26 call sites; the refactor's focus is the duality, not API shape. | Make factories sync — cleaner but larger diff. Follow-up. |
| D7 | **`checkDbHealth()` stays as a diagnostic** | `pnpm db:health` is useful for ops. Not a runtime dependency anymore. | Delete it — removes a diagnostic tool for no gain. |
| D8 | **Sync factories deleted** | Zero callers (grep + graph). | Keep for "future tests" — YAGNI; the async factories are the production path. |
| D9 | **`src/data.ts` loses 5 dead constants** | `EXPLORE_CATEGORIES`, `LEGENDARY_TERRAINS`, `POPULAR_SEARCH_TERMS`, `RECENT_SEARCHES`, `TERRAIN_OPTIONS` have zero callers. | Keep for "future UI" — they are bundled into the client bundle today, so they cost bytes. |
| D10 | **`src/data/spots.json` + `sport-events.json` stay** | `seed.ts` still imports them. They are a one-time bootstrap, not a runtime read path. | Rewrite `seed.ts` to skip the JSON — out of scope. |
| D11 | **`writeEnabled` and `DataModeNotice` deleted** | They were JSON-mode scaffolding. The DB is always the source, so writes always work. | Keep them as a "no-op UI affordance" — adds noise. |
| D12 | **`Region.count` computed from live spot counts** | Honest live data. Matches the single-source-of-truth principle. | Keep as a static string (would require a new DB column or a seed constant). |
| D13 | **`useMapFilter` reads regions from the store (Option A)** | No prop threading. Store is the single source on the client. | Option B (prop threading) — more verbose, same outcome. |
| D14 | **Repository interfaces kept** | They document the contract and are a clean seam. Only the JSON `implements` statements are removed. | Delete the interfaces — Drizzle repos become the only impl, no abstraction. Less flexible for future swap-outs. |
| D15 | **`getRegionsForClient()` lives in `src/lib/data/regions.ts`** (new server-only module) | Keeps the region-joining logic in one place. `src/lib/data/` is a new home for server-only data-assembly functions (parallel to `src/lib/weather/`, `src/lib/sport-events/`). | Put it in `src/lib/spots.ts` — would force that file to be server-only, breaking the client `getPresetImages` import. |

## 13. Open questions for follow-up specs

1. **Make the async factories sync.** After this refactor, the async signature is vestigial. A follow-up can change `getSpotRepositoryAsync` → `getSpotRepository` and drop the `await` at all 26 call sites.
2. **Rewrite `seed.ts` to skip `src/data/*.json`.** Insert spots/events directly from typed constants. Drops the JSON dependency entirely.
3. **Move `DEFAULT_PRESET_IMAGES` to a `preset_images` DB table.** Currently bundled; a DB table would let admins curate presets. Not needed today.
4. **Add a `regions.display_count` column** if static display strings are preferred over live counts. Not needed today.
5. **Cache `getRegionsForClient()`** with the `"use cache"` directive (like `checkDbHealth()`), since regions change rarely. The current `SpotsProvider` hydration pattern means the query runs once per request, but a cache would let it be reused across server components in the same render.

These are explicitly out of scope for this spec.
