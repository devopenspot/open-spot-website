# Open Spot — Engineering Roadmap

> Status: **active**. The DB / Supabase / PostGIS / Drizzle integration has not started. This document is the agreed-upon plan for getting there, and for the structural cleanup that comes first.

---

## 1. Context & goals

We are about to introduce a real backend (Supabase + PostGIS + Drizzle ORM) and replace the JSON-backed loader. The current code was written assuming the loader is a free function that imports `spots.json` directly. The work to migrate to a DB touches:

- the domain model (two `Spot` types live side-by-side)
- the data loader (no repository abstraction, no validation)
- the client state (`AppStateProvider` mutates server data in memory)
- the post-creation form (a demo that loses data on refresh)
- the saved-spots persistence (localStorage only, no user scope)
- the map (a hand-rolled CSS grid, not a real map)

The goal of the next stages is to make that swap **mechanical**: every domain read goes through a `Repository` interface, every domain write goes through a Server Action, every identity-bearing string goes through one of two small hooks (`useUser`, `system-info`). Once those boundaries are in place, replacing the JSON-backed `JsonSpotRepository` with a `DrizzleSpotRepository` is a one-file change.

Out of scope for Stages A–C: the Supabase project, RLS policies, real map library, geocoding. Stage D captures those.

---

## 2. Stage A — DB-ready foundations

The structural changes that make the DB swap mechanical. Estimated ~15 files, ~600 lines net.

### A.1 Unify the two `Spot` types

Today:

- `src/lib/types.ts:23` — UI `Spot` (the entity the app renders)
- `src/types/core.ts:26` — `Spot` (the Nominatim-shaped source) imported as `CoreSpot` in `loader.ts`

The `core.ts` type exists only because the JSON was shaped like a Nominatim response. After A.3, the source-of-truth becomes the DB schema, not Nominatim. The `core.ts` file is removed.

**Action:** delete `src/types/core.ts`; delete the `CoreSpot` alias in `loader.ts`; keep the UI `Spot` in `src/lib/types.ts` as the single domain type. Move the presentational denormalizations (uppercase name, pre-formatted distance, `{x,y}` percentage coordinates) to a separate `SpotView` type so the domain entity is clean.

### A.2 Add Zod and validate source data

Every JSON import is currently a blind `as CoreSpot[]` cast (`src/lib/spots/loader.ts:18`, `src/lib/sport-events/loader.ts:10`). Zod gives us runtime validation and a single source of type + schema.

**Add:** `zod` to `dependencies`. Define:

- `src/lib/schemas/spot.ts` — `SpotSchema`, `NewSpotSchema`, `SpotPatchSchema`, `SpotFilterSchema`
- `src/lib/schemas/event.ts` — `SportEventSchema`, `SportEventFilterSchema`

The JSON loader will validate each row through `SpotSchema.parse()` once, then return a typed array. The Repository interface in A.3 will declare its return types with these schemas as the runtime guard.

### A.3 Introduce the `SpotRepository` interface

This is the **central** change. The interface is what the rest of the app codes against. The JSON implementation is what we ship today. The Drizzle implementation is what we ship tomorrow.

**New files:**

```
src/lib/repositories/
├── types.ts                  # shared types: SpotFilter, NewSpot, SpotPatch
├── spot-repository.ts        # interface SpotRepository
├── event-repository.ts       # interface EventRepository
├── json-spot-repository.ts   # implementation backed by spots.json
├── json-event-repository.ts  # implementation backed by sport-events.json
└── index.ts                  # getSpotRepository(), getEventRepository()
```

**Interface (target shape):**

```ts
// src/lib/repositories/spot-repository.ts
export interface SpotRepository {
  list(filter?: SpotFilter): Promise<readonly Spot[]>;
  findById(id: string): Promise<Spot | null>;
  findNearby(params: { lat: number; lon: number; radiusMeters: number }): Promise<readonly Spot[]>;
  create(input: NewSpot): Promise<Spot>;
  update(id: string, patch: SpotPatch): Promise<Spot>;
  delete(id: string): Promise<void>;
}

// src/lib/repositories/types.ts
export interface SpotFilter {
  type?: SpotType;
  query?: string;       // substring across name/city/address/features
  ids?: readonly string[];
}

export interface NewSpot {
  name: string;
  city: string;
  address: string;
  type: SpotType;
  features: readonly string[];
  image: string;
  communityNote?: string;
  lat: number;
  lon: number;
}

export interface SpotPatch {
  name?: string;
  type?: SpotType;
  features?: readonly string[];
  image?: string;
  communityNote?: string;
}
```

The `JsonSpotRepository` wraps the existing loader logic: `spots.json` is parsed via `SpotSchema.array().parse()` at module init, and every method is a pure function over the in-memory array. The existing `pickType`, `pickFeatures`, `buildCrowdLabel`, `buildCommunityNote` helpers move to the repo's private implementation; the `Spot` returned by the repo has no `weather` field (that becomes a separate concern in A.6).

### A.4 Make `SPOTS_DATA_SOURCE` real

The `.env.example` already documents the `SPOTS_DATA_SOURCE=json|db` switch but nothing reads it. After A.3, `src/lib/repositories/index.ts` becomes:

```ts
import { JsonSpotRepository } from './json-spot-repository';
import { DrizzleSpotRepository } from './drizzle-spot-repository';

let cached: SpotRepository | null = null;

export function getSpotRepository(): SpotRepository {
  if (cached) return cached;
  const source = process.env.SPOTS_DATA_SOURCE ?? 'json';
  cached = source === 'db' ? new DrizzleSpotRepository() : new JsonSpotRepository();
  return cached;
}
```

For Stage A we ship only the `json` branch. The `drizzle-spot-repository.ts` file is added in Stage D, and the import is conditional on the env var so the JSON code path stays in the bundle.

### A.5 `EventRepository` (parallel, smaller)

Same pattern, smaller surface. `list(filter?)`, `findById(id)`, `findFeatured()`. The current `loader.ts` becomes `json-event-repository.ts`.

### A.6 Server Action for spot creation

`PostTab.handleSubmit` is currently a client-side `addSpot()` that mutates a `useState`. After A.6:

- New: `src/app/actions/spots.ts` (a Server Action) exports `createSpotAction(formData: FormData)`. It validates via `NewSpotSchema.parse(Object.fromEntries(formData))`, calls `getSpotRepository().create(input)`, and calls `revalidateTag('spots')`.
- `PostTab.handleSubmit` becomes one line: `await createSpotAction(formData)` followed by `showToast` and the success-screen toggle.
- The `addSpot` method disappears from `AppStateProvider` (see A.7).

### A.7 Split `AppStateProvider`

Today the provider holds three unrelated concerns:

- domain data (`spots`, `addSpot`)
- persistent user data (`savedIds`, `toggleSaved`, `count` — actually delegated to `useSavedSpots`)
- ephemeral UI state (`isSearchOpen`, `isDrawerOpen`, `openSearch`, `closeSearch`, `toggleSearch`, `isDrawerOpen`, `openDrawer`, `closeDrawer`)

**After A.7:**

- `src/components/layout/UIStateProvider.tsx` — owns only `isSearchOpen` / `isDrawerOpen` and their openers/closers. The current `AppStateProvider` is renamed to this and trimmed.
- `src/components/layout/SpotsProvider.tsx` — owns `spots: Spot[]` (initialized from a server fetch), exposes `createSpot` (calls the Server Action). No local mutation; refresh via tag invalidation.
- `src/hooks/useSavedSpots.ts` — already a hook, no provider change. Stage A.8 scopes it by user.

The rename propagates: `AppProviders` becomes:

```tsx
<UIStateProvider>
  <SpotsProvider initialSpots={initialSpots}>
    <AppShell>{children}</AppShell>
  </SpotsProvider>
</UIStateProvider>
```

Consumers update: `useAppState()` splits into `useUIState()` and `useSpots()`. The migration is mechanical (`rg 'useAppState' src/`).

### A.8 `useSavedSpots` gains a `userId` namespace

When a real user is wired up, the saved-spots key should not be `openspot_saved_ids_v2` globally — it should be `openspot_saved_ids_v2:${userId}`. After A.8:

```ts
export function useSavedSpots(userId: string = 'dev') { ... }
const STORAGE_KEY = `openspot_saved_ids_${STORAGE_KEY_VERSION}:${userId}`;
```

The hook signature change is one line per call site. The Stage A.8 change also adds a `useEffect` to sync to a `saved_spots` table once the Server Action exists — for now that effect is a TODO comment.

### A.9 Outcome of Stage A

After Stage A:

- `getSpots()` no longer exists as a free function — only `getSpotRepository().list()`.
- Every spot read in the app goes through the repository.
- Every spot write is a Server Action.
- Domain `Spot` has no `weather` field (see A.6 / future Stage D).
- Two `Spot` types become one.
- `SPOTS_DATA_SOURCE=db` is a real switch, not a comment.
- Supabase / Drizzle integration = "write `drizzle-spot-repository.ts`, set the env var."

---

## 3. Stage B — Composition & duplication cleanup

After Stage A the data layer is sound. Stage B cleans up the UI layer so the code is easier to read and extend. Estimated ~12 files, ~400 lines net.

### B.1 Unify the three nav components

`DesktopNav.tsx`, `MobileNav.tsx`, `MobileDrawer.tsx` each repeat:

- the `isActive` calc (`item.path === '/' ? pathname === '/' : ...`)
- the `showBadge` calc (`item.id === 'saved' && savedCount > 0`)
- the roving-tabindex keydown handler
- the `handleSelect = (path) => () => onSelect(path)` curry

The `VARIANT_STYLES` table in `NavLink.tsx` already proves the right pattern.

**After B.1:**

- `src/components/layout/NavList.tsx` — one component, takes `variant: 'desktop' | 'mobile-tab' | 'mobile-drawer'`. Internally maps each `NAV_ITEMS` entry to a `<NavLink variant={...}>` (or, for `mobile-drawer`, the bespoke button styling).
- `src/hooks/useNavList.ts` — extracts the roving-tabindex + active-path logic. Used by all three call sites.
- `src/lib/nav.ts:65` already exports `isActivePath(current, path)`; it gets used here.
- `DesktopNav`, `MobileNav`, the drawer section of `MobileDrawer` are deleted.

### B.2 `MobileDrawer` uses `<Overlay flush>`

Today `MobileDrawer` reimplements backdrop + focus trap + escape + body scroll lock in 25 lines. After B.2, it renders `<Overlay isOpen={isDrawerOpen} onClose={closeDrawer} labelledBy={DRAWER_TITLE_ID} flush>` and just supplies the panel content. The `Overlay` component already supports the `flush` prop.

The 50ms `setTimeout` to focus `#close-hamburger-btn` is removed — `Overlay`'s `useFocusTrap` handles first-focusable-element.

### B.3 Extract UI primitives

Four primitives cover ~50% of the repeated class strings:

- `src/components/ui/Eyebrow.tsx` — wraps the `font-mono text-[10px] font-bold tracking-widest text-secondary uppercase` pattern (12 uses).
- `src/components/ui/SurfaceCard.tsx` — wraps the `rounded-xl border border-outline-variant bg-surface-bright` chrome (10 uses).
- `src/components/ui/PrimaryButton.tsx` — wraps the `bg-on-surface text-surface` CTA (10 uses, with a `variant="outline"` for the secondary).
- `src/components/ui/TabPanel.tsx` — wraps the `role="tabpanel" aria-labelledby="nav-btn-X" className="space-y-X pb-24 animate-fade-in"` opener (5 uses, one per tab).

These are leaf components with no business logic. The 21 uses of the `font-display text-X font-bold tracking-X text-on-surface uppercase` heading pattern become a fifth primitive if the repetition stays after Stage A; otherwise it stays inline.

### B.4 Split `MapTab.tsx` (417 lines) into four files

The `<MapAdapter>` boundary makes the future real-map swap a one-file change.

- `src/components/map/MapCanvas.tsx` — the CSS-grid background + absolute-positioned pins + zoom/pan transforms.
- `src/components/map/MapSidebar.tsx` — the filter chips + the list of spot names.
- `src/components/map/MapInfoPopup.tsx` — the `role="dialog"` info card on pin click (currently missing focus trap and escape; gets them).
- `src/components/map/MapLegend.tsx` — the "Los Angeles Grid Active" hardcoded label (becomes a `<MapGridLabel>` prop or derived from data).

The "Los Angeles Grid Active" hardcoded string is removed; the legend reads `spots[0]?.city ?? 'Open Spot'` or accepts a `label` prop.

### B.5 Split `PostTab.tsx` (481 lines) into two files

- `src/components/post/PostForm.tsx` — the form, the `useState` calls, the validation, the submit. Reduced to a single responsibility: collect and submit.
- `src/components/post/PostSuccessScreen.tsx` — the success state, the "View your spot" CTA.

Form state stays as `useState` (no `useReducer` — it doesn't earn its complexity for ten fields).

### B.6 Enable `noUncheckedIndexedAccess`

Add `"noUncheckedIndexedAccess": true` to `tsconfig.json`. Fix the resulting non-null assertions in `loader.ts` (already much smaller after Stage A) and in `MapTab.tsx`'s `SOURCE_SPOTS[i]!` pattern. This is the TS-level rigor Stage A enables.

### B.7 Outcome of Stage B

After Stage B:

- ~250 lines of duplication gone.
- The three nav files collapse to one.
- The drawer reuses `<Overlay>`.
- Five UI primitives handle ~50% of repeated styling.
- `MapTab` is 4 focused files instead of one 417-line file.
- `PostTab` is 2 focused files instead of one 481-line file.
- TypeScript is strictly checked.

---

## 4. Stage C — Testing infrastructure

After Stages A and B, the code is in a state where tests are actually useful. Estimated ~6 files, ~200 lines net.

### C.1 Install the test runner

- `vitest` (test runner)
- `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- `happy-dom` (DOM env, faster than `jsdom`)

Add `vitest.config.ts` (or inline in `vite.config.ts` if it exists — it doesn't here) and a `test` script in `package.json`.

### C.2 Unit tests for the new pure helpers

Files that exist today and have **zero** tests:

- `src/hooks/useSavedSpots.ts` — test the post-Stage-A.8 version: `parseSavedIds` round-trips, `migrateLegacy` promotes v1 to v2 and deletes v1, the storage-write effect doesn't run until after hydration (regression test for the Pass 1 fix).
- `src/lib/spots/geo.ts` — `haversineMiles` against a known pair (LAX → JFK ≈ 2150 mi), `projectToGrid` clamps to 5–95%.
- `src/lib/weather/mappers.ts` — `mapIconName` covers the OpenWeather icon code → `WeatherIconName` mapping.
- `src/lib/sport-events/loader.ts` — `deriveStatus` for upcoming / live / completed, the sort order.

### C.3 Contract test for `SpotRepository`

The test calls `JsonSpotRepository.list()`, `.findById()`, `.create()`. When the Drizzle implementation lands, the **same** test runs against it. The test is the contract.

```ts
// src/lib/repositories/__tests__/spot-repository-contract.test.ts
export function spotRepositoryContract(getRepo: () => SpotRepository) {
  return () => {
    it('list returns an array', async () => { ... });
    it('findById returns null for unknown id', async () => { ... });
    it('create returns a Spot with the supplied fields', async () => { ... });
    it('findNearby returns spots within radiusMeters', async () => { ... });
  };
}

spotRepositoryContract(() => new JsonSpotRepository())();
```

### C.4 Component smoke test for `<SpotCard>`

One render test that asserts the save button toggles `aria-pressed` and fires `onToggleSave`. Establishes the testing-library pattern for future component tests without committing to a large suite yet.

### C.5 Outcome of Stage C

After Stage C:

- The fix from Pass 1 has a regression test.
- The pure helpers are protected from accidental breakage.
- The future `DrizzleSpotRepository` is testable against the same contract.
- The testing setup is in place; future PRs can add component tests incrementally.

---

## 5. Stage D — Future (out of scope for this SPEC)

The eventual Supabase + PostGIS + Drizzle + real-map work. **Not** part of the current engineering effort; listed here so the prior stages land in a way that doesn't paint us into a corner.

### D.1 Drizzle schema

`src/db/schema.ts` mirrors the `Spot` / `SportEvent` / `User` / `SavedSpot` tables. The `spots` table has a `geometry(Point, 4326)` column with a GIST index. The migration is a single `drizzle-kit generate` + `drizzle-kit push` (or a Supabase migration applied through the dashboard).

### D.2 Supabase client + middleware

`src/lib/supabase/server.ts` and `src/lib/supabase/browser.ts` for the two clients. `src/middleware.ts` refreshes the session on every request. The `useUser` hook (stubbed in Pass 1) becomes `useUser()` → `getServerSession()` → typed `User`.

### D.3 `DrizzleSpotRepository`

`src/lib/repositories/drizzle-spot-repository.ts` implements `SpotRepository` using Drizzle queries. `findNearby` uses `ST_DWithin(geom, ST_MakePoint(lon, lat)::geography, radiusMeters)`. The interface is the same; the implementation is the swap.

### D.4 RLS policies

SQL migrations in `supabase/migrations/`. Authenticated users can `select` from `spots`; only the owner can `insert` / `update` / `delete` on `spots` they created; `saved_spots` is scoped by `user_id`.

### D.5 Real map

`maplibre-gl` + `react-map-gl` (or `react-leaflet`). The `<MapAdapter>` boundary from Stage B.4 makes the swap a one-file change: replace `MapCanvas` internals, leave the pin / sidebar / popup contracts.

### D.6 Geocoding client

`src/lib/geocode/nominatim.ts` wraps the Nominatim API (the `NOMINATIM_URL` env var is already declared). The Add Spot form's `address` field becomes a `<AddressInput>` that geocodes on submit and feeds the `lat` / `lon` into the `NewSpot` payload.

### D.7 PostGIS-powered search

`search` (text) and `nearby` (geo) become first-class `SpotRepository` methods. The search overlay transitions from `spots.filter()` (in-memory) to `getSpotRepository().list({ query })` (DB).

---

## 6. Migration order & dependencies

```
Stage A.1  (unify Spot types)
   │
   ▼
Stage A.2  (Zod schemas)
   │
   ▼
Stage A.3  (SpotRepository interface + JsonSpotRepository)
   │
   ├──► Stage A.5  (EventRepository, parallel)
   │
   ├──► Stage A.6  (Server Action)
   │
   ├──► Stage A.7  (split AppStateProvider)
   │        │
   │        └──► Stage A.8  (useSavedSpots userId scope)
   │
   └──► Stage A.4  (SPOTS_DATA_SOURCE dispatch — wired at the end)

Stage B  (composition cleanup) — independent of Stage A's internal order,
         but assumes A.7 has renamed the providers.
         │
         ▼
Stage C  (testing) — independent of A and B; can run anytime after A.

Stage D  (Supabase / Drizzle / map) — after A.4 lands; the `drizzle-spot-repository.ts`
         is the only file Stage D needs in the TS world; the rest is infra / SQL.
```

A.1 → A.2 → A.3 is a tight sequence (A.2 needs A.1 to define the single type; A.3 needs A.2 to validate the JSON). After A.3, A.5 / A.6 / A.7 / A.8 can be parallel PRs.

---

## 7. Breaking changes list

The migration will require coordinated updates. Capture them here so reviewers see the full surface.

- **A.1:** `src/types/core.ts` deleted. `loader.ts:5-6` alias removed. Any import of `Spot` from `@/types/core` must change to `@/lib/types`.
- **A.3:** `getSpots()` / `getSpotById()` deleted in favor of `getSpotRepository().list()` / `.findById()`. Call sites: `app/layout.tsx:71`, `app/spots/[id]/page.tsx:7`, `app/sitemap.ts:20`, `lib/spots/loader.ts:230-236` (gone). The return type changes from `readonly Spot[]` to `readonly Spot[]` **minus** `weather`.
- **A.6:** `addSpot` removed from `AppStateProvider`. `PostTab` calls `createSpotAction(formData)` instead.
- **A.7:** `useAppState()` splits into `useUIState()` (search/drawer) and `useSpots()` (domain). Migration: every `useAppState()` consumer picks the right hook.
- **A.8:** `useSavedSpots()` → `useSavedSpots(userId)`. All callers pass `useUser().id`.
- **B.1:** `DesktopNav`, `MobileNav` deleted. `MobileDrawer` loses its nav section. `Header.tsx` and `AppShell.tsx` use `<NavList variant="desktop" | "mobile-tab" | "mobile-drawer" />`.
- **B.2:** `MobileDrawer` becomes much thinner; the `DRAWER_ID` and `DRAWER_TITLE_ID` constants either move to the new shell or become props.
- **B.3:** `Eyebrow` / `SurfaceCard` / `PrimaryButton` / `TabPanel` are opt-in — new code uses them, old code migrates file-by-file.
- **B.4:** `MapTab` is replaced by `MapCanvas` + `MapSidebar` + `MapInfoPopup` + `MapLegend`. The `dynamic(..., { ssr: false })` wrapper in `app/map/MapPageClient.tsx` moves around the new shell.
- **B.5:** `PostTab` (default export) becomes `PostForm` (named). `app/post/page.tsx` updates the import.
- **B.6:** `noUncheckedIndexedAccess: true` is a strictness upgrade; expect ~10 small TS fixes.
- **C.2:** none — tests are additive.
- **D.3:** `getSpotRepository()` may now return the Drizzle implementation. Any test that relied on the JSON in-memory shape (e.g., asserting the result of `findById` on a `custom-spot-…` id) needs updating.

---

## 8. Risks & open questions

1. **The `custom-spot-${Date.now()}` IDs.** `PostTab` currently manufactures IDs client-side. With the DB, the server assigns the id. The migration path: (a) the Server Action returns the created spot with the assigned id, (b) the existing v1 storage key `openspot_saved_ids_v2` may contain old `custom-spot-…` ids that don't exist in the DB. The legacy migration should drop those gracefully (or migrate them to a real id on first server hit — out of scope for Stage A).

2. **Weather inlining on `Spot`.** Currently `Spot.weather` is computed per-spot and inlined. After A.3, the repository returns a `Spot` without `weather`, and the consumer does `getCachedSpotWeather(spot.id)`. The `weather-cached.ts` module already exists; the change is mechanical, but the `Omit<Spot, "weather">` pattern will appear in the loader and at every call site. Consider a `SpotWithWeather` view type that the consumer composes from `Spot` + `WeatherItem`.

3. **The `coordinates: { x, y }` percentage projection.** The fake map uses 0–100% percentages, not lat/lon. When Stage D swaps in a real map, the projection goes away. The `Spot.coordinates` field should be removed in A.1 and the map code should hold its own pin positions (or read them from a separate `SpotPin` view).

4. **`generateStaticParams` for `/spots/[id]`.** With a DB, this can either stay (build-time query — fine for small datasets) or move to `dynamic = 'force-dynamic'` (necessary for large datasets). Decide based on the expected scale. For Stage A, keep it as-is.

5. **The `lucide-react` icons that wrap `useUser().initials`.** Currently a single component reads `OS` literally. With multiple users, this becomes dynamic. Pass 1 already plumbed `user.initials` through — confirm the design system still treats the `OS` chip as monochrome (it does, per `DESIGN.md`).

6. **`verifyDepsBeforeRun: false`.** Currently pnpm won't warn about missing deps. With Stage A adding `zod`, `drizzle-orm`, `pg` / `postgres`, `drizzle-kit`, this becomes a real risk. Consider flipping it on after the dep set stabilizes.

7. **`images.unoptimized: true`.** Fine today. When the Add Spot form supports file uploads (Supabase Storage), `next/image` optimization matters more. Not a Stage A concern, but flag it for Stage D.

8. **No `prettier` / no formatter.** The codebase is consistent today, but Stage A will touch ~15 files; a formatter would normalize the result. Consider adding `prettier` (no config — use defaults) in Stage C alongside the test setup.

9. **The `useUser` hook is a static stub today.** When the Supabase session lands, the hook becomes async (`useEffect` + `useState`). Consumer code (Header, MobileDrawer) doesn't change, but the hook's signature does. Stage A keeps the static return type so the consumers don't churn.

10. **`SearchOverlay` is dynamic-imported via `dynamic(..., { ssr: false })` for the map but not for itself.** Currently it's SSR'd. The search UX would benefit from `ssr: false` too, since `getRecentSearches()` returns hardcoded demo data anyway. Not a blocker, but worth noting in the B pass.

---

## 9. What we shipped in this refactor (Pass 1 + Pass 2)

Done, not planned. For reviewers who want the deltas only.

- **Pass 1 (behavioral):**
  - Fixed the `useSavedSpots` data-loss bug — the first-render empty Set was deleting localStorage. Added a `hydratedRef` guard so the write effect skips until after the migration effect runs.
  - Added `src/lib/user.ts` + `src/hooks/useUser.ts` (returns a static dev user). `Header.tsx` and `MobileDrawer.tsx` consume it. Sets the swap point for Supabase.
  - Added `src/lib/system-info.ts` (`APP_VERSION`, `BUILD_TZ`). `MobileDrawer.tsx` consumes it.
  - Wired ESLint: spread `eslint-config-next` (was installed but unused), added `eslint-plugin-jsx-a11y` and `@next/eslint-plugin-next` as direct devDeps, removed the unused `@typescript-eslint/parser` and `@eslint/eslintrc`. The Next-specific rule set + jsx-a11y are now active. Skipped the `react/*` rules that are broken on ESLint 10.
  - Replaced `<a href="/">` in `BrandLogo` with `<Link>` (caught by the newly-wired `@next/next/no-html-link-for-pages` rule).

- **Pass 2 (cosmetic):**
  - New `src/lib/constants.ts` — `MAIN_CONTENT_ID`, `CROWD_LEVEL`, `MAP_VIEWPORT_OFFSET_PX`, `MAP_ZOOM`, `SEARCH_FOCUS_DELAY_MS`, `STORAGE_KEY_VERSION`. Five files updated to use them.
  - Deleted `src/components/spot/SpotDetailsModal.tsx` (no callers).
  - Collapsed the `variant="modal"` branch in `SpotDetailsContent.tsx` (also dead). The `variant` prop and its two cases are gone; only the page layout remains.
  - Deleted `SearchSpotCard` export from `SpotCard.tsx` (no callers).
  - Deleted `resetSpotsCache` empty stub from `src/lib/spots/loader.ts:238`.
  - Removed `TIER_LABELS` duplicate map from `src/lib/sport-events.ts`. `TIER_DISPLAY` (the survivor) is now typed `as const`.
  - Removed the no-op `useEffect(() => {}, [pathname])` from `DesktopNav.tsx`.
  - Folded `useEscapeKey` into `useKeyboardShortcuts` (one-line per call site; one hook deleted).

- **Verified:** `pnpm lint`, `pnpm typecheck`, `pnpm dev` (all routes 200, no client errors).
