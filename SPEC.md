# Open Spot — Engineering Roadmap

> Status: **active**. Stage A-prep (Passes 1–3) is shipped. Stage A is next.
> Stage E (PostgreSQL + PostGIS + Supabase + Auth + Storage) is the backend destination.
> This document is the agreed-upon plan from the current state through full
> persistence in Supabase: a clean data model, RSC + Server Actions, Zustand
> for client state, no React Query, and graceful DB-outage fallback.

---

## 1. Context & goals

We are about to introduce a real backend (Supabase + PostGIS + Drizzle ORM) and replace the JSON-backed loader. The work to migrate touches:

- **Domain model** — the UI `Spot` type, the loader types, the saved-spots hook.
- **Data layer** — a `Repository` interface, two implementations (Json, Drizzle).
- **Client state** — `AppStateProvider` is replaced with three Zustand stores; `useSavedSpots` stays a hook.
- **Writes** — every domain write goes through a Server Action.
- **Identity** — `useUser` becomes Supabase Auth in E.7.

The goal is to make the swap **mechanical**: every read goes through a `Repository`, every write through a Server Action, every UI slice through a Zustand store. Replacing `JsonSpotRepository` with `DrizzleSpotRepository` becomes a one-file change.

**Frozen — must not change:** the UI/design layer is contract-frozen for the entire roadmap. `DESIGN.md` (color, typography, layout, shape, components), the `src/data.ts` UI catalog shapes (`ExploreCategory`, `LegendaryTerrain`, the UI-facing `Region`/`Country` with `count`/`desc`/`image`/`link`), component markup, and Tailwind class strings are out of scope for every stage below. A clean entity type (§8.13) must coexist with the UI catalog types, not replace them.

**Out of scope (this SPEC):** real map library, geocoding. The CSS-grid map stays. The `MapTab` file split in B.4 sets the boundary for the future swap.

**State management — non-goals:**

- **React Query / TanStack Query is out of scope.** The data flow is server-authoritative RSC (reads) + Server Actions (writes) + `useTransition` / `useOptimistic` (optimistic UI). The dataset is small (~60 spots, ~10 events) and there is no client-side fetching today. If a future feature needs client-side caching — typeahead search, bbox-driven map queries, offline mutation replay — introduce React Query at that point, scoped to that feature, not globally. Adding it pre-emptively would add ~13 KB gz to the bundle and a second cache layer to keep in sync with Next's `cacheLife` / `cacheTag` (the real weather-cache API in `src/lib/weather/weather-cached.ts`) and the repo's in-memory fallback.
- **Zustand is the chosen client-state library** for the small set of slices that survive the `AppStateProvider` removal (UI toggles, map filter, spots domain). See A.6 + §8.13.

---

## 2. Current state of the project

The baseline every later stage assumes. Snapshot taken after the Stage A-prep cleanup (Passes 1–3: dead-code removal, nav helper, weather env centralization, focus timer, logger, saved-spots error surfacing, `core.ts` deletion).

**Shipped (Pass 1 + Pass 2 + Stage A prep / Pass 3):**

- **Type unification (partial — A.1 only):** `core.ts` deleted; a single `Spot` interface lives in `src/lib/types.ts:23`. **The field stripping promised by the old A.1 has not happened** — `weather`, `coordinates: { x, y }`, `region`, `distance`, and `isSaved?` are still on `Spot`. That work is re-opened as **A.1b** in §4.
- `ROUTES.*` and `isActivePath()` used everywhere; no inline URL templates.
- `log` helper in `src/lib/log.ts`; console calls routed through it.
- `useSavedSpots` no longer deletes localStorage on first render (Pass 1 fix).
- Dead code purged (`getActiveTabFromPath`, `getCountriesRegion`, `getSportDisciplines`, etc.).
- `STORAGE_KEY_VERSION = 'v2'`; `openspot_saved_ids_v2` is the live key.
- ESLint wired with `eslint-config-next` + `eslint-plugin-jsx-a11y` + `@next/eslint-plugin-next`.

**Runtime / build facts today (corrected against the real tree):**

- **`AppStateProvider` + `AppProviders` still present.** `useAppState()` is consumed by ~13 files (Header, MobileDrawer, MobileDrawerTrigger, AppShell, ExploreTab, MapTab, SavedTab, PostTab, SpotDetailsFullPage, SearchOverlay, RegionFilter, map/MapPageClient, …), not ~7 as the old SPEC stated.
- **`AppProviders` (`src/components/layout/AppProviders.tsx:8-19`) takes a server-fed `initialSpots: readonly Spot[]` prop** and nests `AppStateProvider > AppShell`. This server-feed pattern is the precedent E.6 will reuse for `savedSpots`; A.6 must preserve the boundary, not delete the idea.
- **No Zustand, no Zod, no Drizzle, no Supabase, no vitest, no repositories, no Server Actions, no `app/actions/`, no `stores/`, no `db/`, no `lib/schemas/`, no `lib/repositories/`, no `lib/env.ts`.** All of those land in their stages below.
- **`next.config.mjs` has `cacheComponents: true`** (Next 16 + React 19). Under this flag every `cookies()` / `headers()` / `draftMode()` call site becomes async, and Server Actions + middleware must `await` these APIs. The Stage E server/client wiring in §E.4, §E.7 reflects this.
- **Weather cache uses Next 16 `cacheLife` / `cacheTag` from `next/cache`** (`src/lib/weather/weather-cached.ts:1`), not the old `unstable_cache` API. `getCachedSpotWeather(spot.id)` is the boundary call referenced in §8.13.1 #7.
- **A route handler,** `src/app/api/weather/revalidate/route.ts`, already exists for tag revalidation. It is outside the A.5 Server Action scope and stays untouched.

**Pending work, by stage:**

| Stage | Status | Touches |
|---|---|---|
| A.1 (type unification — `core.ts` deleted) | done | `src/lib/types.ts` |
| A.1b (boundary derivation — strip weather/coords/region/distance; add slug/location/audit) | **not started** | `src/lib/types.ts`, `loader.ts`, consumers |
| A.2 (Zod) | not started | `lib/schemas/*` |
| A.3 (SpotRepository + factory) | not started | `lib/repositories/*` |
| A.4 (EventRepository) | not started | `lib/repositories/*` |
| A.5 (Server Action) | not started | `app/actions/spots.ts` |
| A.6 (Zustand stores) | not started | `stores/*` |
| A.7 (useSavedSpots userId) | not started | `hooks/useSavedSpots.ts` |
| B (composition cleanup) | not started | nav, map, post, primitives |
| C (testing infra) | not started | vitest, contract test |
| E (DB + PostGIS + Supabase) | not started | this SPEC |

**Runtime data today (no DB):**

- Domain entities: `src/data/spots.json` (~12 KB / 381 lines, Nominatim-shaped) and `src/data/sport-events.json` (~3.6 KB / 102 lines).
- UI catalogs (frozen — see §1): `src/data.ts` exports `EXPLORE_CATEGORIES`, `LEGENDARY_TERRAIN`, `REGIONS` (a UI `Region` with `count`, `desc`, `image`, `link`, `countries`), `COUNTRY_TO_REGION` (`src/data.ts:132`), `COUNTRY_NAME_OVERRIDES` (`src/data.ts:122`). The data-model `Region` in §8.13.2 must coexist with this UI `Region`, not delete it.
- User: hardcoded `DEV_USER` in `src/lib/user.ts:8` — `id: 'dev'`, `name: 'Active Scout'`, `initials: 'OS'`.
- Favorites: `localStorage` only, key `openspot_saved_ids_v2`, no user scope, no server mirror, no cross-device sync.
- Weather: live OpenWeather API, cached via Next 16 `cacheLife` + `cacheTag` per `spotId` (`src/lib/weather/weather-cached.ts`); a route handler `src/app/api/weather/revalidate/route.ts` refreshes the tag.
- `.env.example` already documents `DATABASE_URL` and `SPOTS_DATA_SOURCE=json|db` — neither is read yet.

---

## 3. Favorites: Save Spots feature

The user's "this spot matters to me" affordance. The only piece of user-generated data in the app today, and the centerpiece of the Stage A → E migration.

**Behavior contract (target, all stages combined):**

- A user can mark any spot as "saved" from `ExploreSpotCard`, `SavedSpotCard`, the spot detail page, and the map sidebar.
- The saved state shows in the header badge (`savedCount`) and the `/saved` tab.
- Saved spots persist across sessions and devices for the same user.
- The first sign-in migrates the user's existing `localStorage` v2 set into the DB once, then clears the local key.
- Optimistic UI: the heart fills instantly; rollback on server error + toast.

**Files today (read path):**

- `src/hooks/useSavedSpots.ts` — `useSyncExternalStore`-based hook.
- `src/components/saved/SavedTab.tsx` — empty state + grid of `SavedSpotCard`.
- `src/components/spot/SpotCard.tsx:177` — `SavedSpotCard` variant.
- `src/components/layout/Header.tsx`, `DesktopNav`, `MobileNav`, `MobileDrawer` — `savedCount` badge.

**Migration milestones:**

- **A.7:** Add `userId` parameter; key becomes `openspot_saved_ids_v2:${userId}`.
- **E.6:** Replace localStorage as the source of truth with a `SavedSpotsRepository`; Server Actions `toggleSavedAction(spotId)` and `listSavedSpotsAction()`. localStorage becomes the offline write-through cache. RLS scopes rows by `auth.uid()`.
- **E.7 (sign-in) + E.10 (RLS):** Cross-device sync lands. On sign-in, the v2 local key is migrated to the DB for that user and cleared.

**Out of scope:** collections / folders for saves, sharing saved lists, public "favorites" profiles.

---

## 4. Stage A — DB-ready foundations

The structural changes that make the DB swap mechanical.

### A.1 Single `Spot` type — DONE (partial: type unification only)

`core.ts` is deleted; `src/lib/types.ts:23` holds the single UI `Spot`. This milestone covers the **merge** of the former `CoreSpot`/`Spot` split only. The field stripping described in the old A.1 ("weather, {x,y}, region, distance are out of the type") has **not** happened — see A.1b.

### A.1b Boundary derivation — strip presentation fields, add entity fields

This is the missing half of the old A.1. It moves every presentation-only field *off* `Spot` and adds the server-owned fields the DB (Stage E) and Zod (A.2) require. Done before A.2, because A.2 validates this target shape.

**`Spot` after A.1b** (matches §8.13.2):

```ts
export interface Spot {
  id: string;                    // today: client-built 'custom-spot-<ts>'; later: server uuid
  slug: string;                  // NEW; URL-safe unique handle
  name: string;                  // raw case; UI uppercases at the boundary
  city: string;
  citySlug: string;              // NEW; lowercased hyphenated
  address: string;
  type: SpotType;
  features: readonly string[];
  image: string;                 // external URL today; signed-URL path in E.8
  communityNote: string;
  crowdLevel: number;
  crowdLevelLabel: string;
  country: string;               // canonical, after COUNTRY_NAME_OVERRIDES
  location: { lat: number; lon: number };   // NEW; replaces coordinates {x,y}
  createdBy: string | null;      // NEW; null for curated
  createdAt: string;             // NEW; ISO 8601
  updatedAt: string;             // NEW; ISO 8601
}
```

**Removed fields and where they derive at the UI boundary** (no UI/design change — only the derivation moves out of the entity):

| Removed from `Spot` | Derives at the boundary | File today |
|---|---|---|
| `weather: { current, forecast }` | `getCachedSpotWeather(spot.id)` → `WeatherIcon` / `SpotDetailsContent` | `src/lib/weather/weather-cached.ts` |
| `coordinates: { x, y }` | `projectToGrid(spot.location)` → `MapPin` absolute-position | `src/lib/spots/geo.ts`, `MapTab.tsx` |
| `region: string` | `COUNTRY_TO_REGION[spot.country]` → `RegionFilter` / nav | `src/data.ts:132`, `useMapFilter` |
| `distance: string` | `haversineMiles(user, spot.location)` → `SpotCard` / `SavedSpotCard` | `src/lib/spots/geo.ts`, `SpotCard.tsx` |
| `isSaved?: boolean` | `useSavedSpots().isSaved(spot.id)` → heart button `aria-pressed` | `src/hooks/useSavedSpots.ts` |

**`src/data.ts` catalog types stay frozen.** The UI-facing `Region` (`count`, `desc`, `image`, `link`, `countries`) and `ExploreCategory` / `LegendaryTerrain` exported from `src/data.ts` are NOT touched. A.1b only removes presentation fields from the **entity** `Spot`; the catalog types remain the source for `ExploreTab` / region tiles. The data-model `Region` from §8.13.2 is a separate interface (facet shape), coexisting with the UI `Region`.

**Loader changes:** `src/lib/spots/loader.ts`'s `buildBaseSpot` (line ~173) stops adding `distance`, `coordinates`, `region`, `weather`, `isSaved`. The `Omit<…, 'weather' | 'isSaved'>` scaffolding (around line 176/229) collapses. The new fields (`slug`, `citySlug`, `location`, `createdBy`, `createdAt`, `updatedAt`) are derived from the raw JSON in `JsonSpotRepository` (A.3) — `slug` from name+city, `location` from the raw lat/lon already in `spots.json`, `createdBy: null`, timestamps from a stable hash or the file mtime. The JSON-backed `id` stays the existing `custom-spot-<ts>` pattern until E.5 assigns server uuids.

**Breaking but mechanical:** every `spot.weather` / `spot.coordinates` / `spot.region` / `spot.distance` read in components is replaced by the boundary call above. ~13 call sites; lint fails fast on the missing fields.

### A.2 Add Zod and validate source data

Every JSON import is currently a blind `as CoreSpot[]` cast. Zod gives us runtime validation and a single source of type + schema.

**Add:** `zod` to `dependencies`. Define:

- `src/lib/schemas/spot.ts` — `SpotSchema`, `NewSpotSchema`, `SpotPatchSchema`, `SpotQuerySchema`.
- `src/lib/schemas/event.ts` — `SportEventSchema`, `SportEventQuerySchema`.

The JSON loader validates each row through `SpotSchema.parse()` once at module init. The Repository interface in A.3 declares its return types with these schemas as the runtime guard.

### A.3 `SpotRepository` interface + `JsonSpotRepository`

This is the **central** change. The interface is what the rest of the app codes against. The JSON implementation is what we ship today. The Drizzle implementation ships in E.5.

**New files:**

```
src/lib/repositories/
├── types.ts                  # SpotFilter, NewSpot, SpotPatch, SpotQuery
├── spot-repository.ts        # interface SpotRepository
├── event-repository.ts       # interface EventRepository
├── json-spot-repository.ts   # implementation backed by spots.json
├── json-event-repository.ts  # implementation backed by sport-events.json
├── saved-spots-repository.ts # interface SavedSpotsRepository (json no-op + Drizzle in E.6)
└── index.ts                  # getSpotRepository(), getEventRepository(), getSavedSpotsRepository()
```

The `getSpotRepository()` factory reads `SPOTS_DATA_SOURCE` from `process.env` and returns the right implementation. For Stage A the env var is read but only the `json` branch is shipped; `SPOTS_DATA_SOURCE=db` is a no-op until E.5 lands. In E.9 the factory also gets the connection-fallback path (DB unreachable → fall back to Json for the request, log, set `X-Data-Source: fallback` header).

The `JsonSpotRepository` wraps the existing loader logic: `spots.json` is parsed via `SpotSchema.array().parse()` once at module init, and every method is a pure function over the in-memory array. The existing `pickType`, `pickFeatures`, `buildCrowdLabel`, `buildCommunityNote` helpers move to the repo's private implementation.

**Async server context (`cacheComponents: true`).** `next.config.mjs` has `cacheComponents: true`; under this flag the RSC tree is rendered in an async context where `cookies()`, `headers()`, and `draftMode()` from `next/headers` are async. `getSpotRepository()` itself must stay synchronous (no cookie read at factory time — the env-var switch is sync). Any auth- or request-scoped repo behavior (per-user RLS in E.6, fallback header in E.9) is **injected by the caller** (`getSpotRepository({ userId })` after `await cookies()`) rather than read inside the factory. This keeps the factory usable from static RSC and `generateStaticParams`. The same rule applies to `env.ts` in E.4: only `process.env.*` reads are sync; anything cookies-derived is awaited by the caller.

### A.4 `EventRepository` (parallel, smaller)

Same pattern. `list(q?)`, `findById(id)`, `findFeatured()`. The current `src/lib/sport-events/loader.ts` becomes `json-event-repository.ts`. Writes (`create` / `update` / `delete`) are **service-role only** — sport events are admin-curated via dashboard / seed scripts, not user-facing.

### A.5 Server Action for spot creation

`PostTab.handleSubmit` is currently a client-side `addSpot()` that mutates a `useState`. After A.5:

- New: `src/app/actions/spots.ts` exports `createSpotAction(formData)`. It validates via `NewSpotSchema.parse(Object.fromEntries(formData))`, calls `getSpotRepository().create(input)`, and calls `revalidateTag('spots')`.
- `PostTab.handleSubmit` becomes one line: `await createSpotAction(formData)` followed by `showToast` and the success-screen toggle. Pending state via `useTransition`; error handling via try/catch.
- The `addSpot` method disappears from `AppStateProvider` (see A.6).

**Note:** `src/app/api/weather/revalidate/route.ts` already exists (weather cache tag refresh) and is untouched by A.5. A.5 introduces a new Server Action at `src/app/actions/spots.ts`; it does not delete or refactor any existing route handler.

### A.6 Replace `AppStateProvider` with Zustand stores

`AppStateProvider` currently holds four unrelated concerns: domain data (`spots`, `addSpot`), persistent user data (`savedIds`, `toggleSaved`, `count`), ephemeral UI state (`isSearchOpen`, `isDrawerOpen`, openers/closers), and map filter (`region`, `country`, setters). The replacement is three focused Zustand stores + a hydration gate. No `AppStateProvider` and no `AppProviders` wrapper.

**New files:**

```
src/stores/
├── ui-store.ts           # search + drawer toggles
├── spots-store.ts        # domain data + createSpot action
├── map-filter-store.ts   # region + country
├── persist-helpers.ts    # shared SSR-safe persist config
└── index.ts              # re-exports
```

**`useUIStore` — ephemeral UI toggles:**

```ts
interface UIState {
  isSearchOpen: boolean;
  isDrawerOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        isSearchOpen: false,
        isDrawerOpen: false,
        openSearch:  () => set({ isSearchOpen: true }),
        closeSearch: () => set({ isSearchOpen: false }),
        toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),
        openDrawer:  () => set({ isDrawerOpen: true }),
        closeDrawer: () => set({ isDrawerOpen: false }),
      }),
      {
        name: 'openspot-ui-v1',
        storage: createJSONStorage(() => sessionStorage),  // toggles should not survive browser close
        skipHydration: true,
        partialize: (s) => ({ isSearchOpen: s.isSearchOpen }),
      },
    ),
    { name: 'UIStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);
```

**`useSpotsStore` — domain data + create action:**

```ts
interface SpotsState {
  spots: readonly Spot[];
  setSpots: (spots: readonly Spot[]) => void;
  createSpot: (input: NewSpot) => Promise<Spot>;
}

export const useSpotsStore = create<SpotsState>()(
  devtools(
    (set) => ({
      spots: [],
      setSpots: (spots) => set({ spots }),
      createSpot: async (input) => {
        const created = await createSpotAction(input);
        set((s) => ({ spots: [created, ...s.spots] }));
        return created;
      },
    }),
    { name: 'SpotsStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);
```

No `isCreating` / `createError` state in the store — `useTransition` handles pending; the caller catches errors. No `persist` middleware — server is the source of truth.

**`useMapFilterStore` — region + country filter:**

```ts
interface MapFilterState {
  region: string | null;
  country: string | null;
  setRegion: (name: string | null) => void;
  setCountry: (name: string | null) => void;
  clearMapFilter: () => void;
}

export const useMapFilterStore = create<MapFilterState>()(
  devtools(
    persist(
      (set) => ({
        region: null,
        country: null,
        setRegion: (name) => {
          if (name === null) { set({ region: null, country: null }); return; }
          set({ region: name });
        },
        setCountry: (name) => set({ country: name }),
        clearMapFilter: () => set({ region: null, country: null }),
      }),
      {
        name: 'openspot-map-filter-v1',
        storage: createJSONStorage(() => localStorage),
        skipHydration: true,
        partialize: (s) => ({ region: s.region, country: s.country }),
        version: 1,
        migrate: (persisted, version) => {
          if (version === 0) return { region: null, country: null };
          return persisted as MapFilterState;
        },
      },
    ),
    { name: 'MapFilterStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);
```

The `setRegion` cascade (clearing country if it no longer belongs to the new region) lives in the consumer `useMapFilter` hook, not in the store, so the store stays pure and testable.

**`<HydrationGate>` for SSR safety:**

```tsx
'use client';
import { useEffect } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { useMapFilterStore } from '@/stores/map-filter-store';

export function HydrationGate({ children }: { children: ReactNode }) {
  useEffect(() => {
    useUIStore.persist.rehydrate();
    useMapFilterStore.persist.rehydrate();
  }, []);
  return <>{children}</>;
}
```

The server always renders with `isSearchOpen = false`, `region = null`, `country = null`. The client rehydrates from storage in an effect after first paint. No flash, no hydration mismatch warning.

**Consumer migration pattern (replaces `useAppState()`):**

```tsx
// Before: const { spots, savedIds, toggleSaved, savedCount, isSearchOpen, openSearch, ... } = useAppState();
// After:
const spots = useSpotsStore((s) => s.spots);
const { savedIds, isSaved, toggle, count } = useSavedSpots();
const isSearchOpen = useUIStore((s) => s.isSearchOpen);
const openSearch = useUIStore((s) => s.openSearch);
const region = useMapFilterStore((s) => s.region);
const setRegion = useMapFilterStore((s) => s.setRegion);
```

Granular re-renders: a consumer that only reads `openSearch` does not re-render when `isDrawerOpen` changes. Mechanical migration: `rg 'useAppState' src/` returns the call sites (~7).

**Files deleted:** `src/components/layout/AppStateProvider.tsx`, `src/components/layout/AppProviders.tsx`.

**Preserving the server-feed boundary.** `AppProviders` today takes `initialSpots: readonly Spot[]` from `app/layout.tsx:71` and threads it into `AppStateProvider`. This server-feed pattern must **not** be lost — E.6 reuses it for `savedSpots`. After A.6, the new boundary (the root layout or a thin `<SpotsProvider>` peer to `<HydrationGate>`) keeps taking `initialSpots` from the server and seeding `useSpotsStore` once on mount (e.g. `useSpotsStore.setState({ spots: initialSpots })` in a client effect or a `useSyncExternalStore`-style init). A second `savedSpots` prop is **reserved** on the same boundary — left unused in A.6, wired in E.6.

**`useSavedSpots` stays a hook.** Its `useSyncExternalStore` semantics are correct for the data-loss fix from Pass 1; rewriting it as a Zustand store would lose that.

### A.7 `useSavedSpots` gains a `userId` namespace

When a real user is wired up, the saved-spots key must not be `openspot_saved_ids_v2` globally — it must be `openspot_saved_ids_v2:${userId}`. After A.7:

```ts
export function useSavedSpots(userId: string = 'dev') { ... }
const STORAGE_KEY = `openspot_saved_ids_${STORAGE_KEY_VERSION}:${userId}`;
```

The hook signature change is one line per call site. A.7 also adds a `useEffect` skeleton that will sync to a `saved_spots` table once the Server Action exists — for now that effect is a TODO comment. The DB sync lands in E.6.

### A.8 Outcome of Stage A

After Stage A:

- `getSpots()` and `getSpotById()` no longer exist as free functions (`src/lib/spots/loader.ts:256,260`) — only `getSpotRepository().list()` / `.findById()`. (The old SPEC referenced a `getSpot()` export; the real exports are `getSpots` / `getSpotById`.)
- Every spot read in the app goes through the repository.
- Every spot write is a Server Action.
- `AppStateProvider` and `AppProviders` are deleted; three Zustand stores own the state. The `initialSpots` server-feed boundary is preserved (see A.6).
- The `Spot` type has no `weather`, no `coordinates: { x, y }`, no `region`, no `distance` — **A.1b** moved those to the UI boundary. (`Spot` gets `slug`, `citySlug`, `location`, `createdBy`, `createdAt`, `updatedAt`.)
- `SPOTS_DATA_SOURCE=db` is read by the factory; only the JSON branch is shipped until E.5.
- Supabase / Drizzle integration = "write `drizzle-spot-repository.ts`, set the env var."

---

## 5. Stage B — Composition & duplication cleanup

After Stage A the data layer is sound. Stage B cleans up the UI layer.

### B.1 Unify the three nav components

`DesktopNav.tsx`, `MobileNav.tsx`, `MobileDrawer.tsx` each repeat the `isActive` calc, the `showBadge` calc, the roving-tabindex keydown handler, and the `handleSelect` curry. The `VARIANT_STYLES` table in `NavLink.tsx` already proves the right pattern.

**After B.1:**

- `src/components/layout/NavList.tsx` — one component, `variant: 'desktop' | 'mobile-tab' | 'mobile-drawer'`.
- `src/hooks/useNavList.ts` — extracts the roving-tabindex + active-path logic.
- `src/lib/nav.ts:65` already exports `isActivePath(current, path)`; it gets used here.
- `DesktopNav`, `MobileNav`, the drawer section of `MobileDrawer` are deleted.

### B.2 `MobileDrawer` uses `<Overlay flush>`

`MobileDrawer` reimplements backdrop + focus trap + escape + body scroll lock in 25 lines. After B.2, it renders `<Overlay isOpen={isDrawerOpen} onClose={closeDrawer} labelledBy={DRAWER_TITLE_ID} flush>` and supplies the panel content. The 50ms `setTimeout` to focus `#close-hamburger-btn` is removed — `Overlay`'s `useFocusTrap` handles first-focusable-element.

### B.3 Extract UI primitives

Four primitives cover ~50% of the repeated class strings:

- `src/components/ui/Eyebrow.tsx` — `font-mono text-[10px] font-bold tracking-widest text-secondary uppercase` (12 uses).
- `src/components/ui/SurfaceCard.tsx` — `rounded-xl border border-outline-variant bg-surface-bright` chrome (10 uses).
- `src/components/ui/PrimaryButton.tsx` — `bg-on-surface text-surface` CTA (10 uses, with `variant="outline"`).
- `src/components/ui/TabPanel.tsx` — `role="tabpanel" aria-labelledby="nav-btn-X" className="space-y-X pb-24 animate-fade-in"` (5 uses).

These are leaf components with no business logic. The 21 uses of the `font-display text-X font-bold tracking-X text-on-surface uppercase` heading pattern become a fifth primitive if the repetition stays after Stage A; otherwise it stays inline.

### B.4 Split `MapTab.tsx` into four files

The `<MapAdapter>` boundary makes the future real-map swap a one-file change.

- `src/components/map/MapCanvas.tsx` — the CSS-grid background + absolute-positioned pins + zoom/pan transforms.
- `src/components/map/MapSidebar.tsx` — the filter chips + the list of spot names.
- `src/components/map/MapInfoPopup.tsx` — the `role="dialog"` info card on pin click (currently missing focus trap and escape; gets them).
- `src/components/map/MapLegend.tsx` — the hardcoded "Los Angeles Grid Active" label becomes `<MapGridLabel>` prop or derived from data.

### B.5 Split `PostTab.tsx` into two files

- `src/components/post/PostForm.tsx` — the form, the `useState`, the validation, the submit.
- `src/components/post/PostSuccessScreen.tsx` — the success state, the "View your spot" CTA.

Form state stays as `useState` (no `useReducer` — it doesn't earn its complexity for ten fields).

### B.6 Enable `noUncheckedIndexedAccess`

Add `"noUncheckedIndexedAccess": true` to `tsconfig.json`. Fix the resulting non-null assertions in `loader.ts` (already much smaller after Stage A) and in `MapTab.tsx`'s `SOURCE_SPOTS[i]!` pattern.

### B.7 Outcome of Stage B

After Stage B: ~250 lines of duplication gone. The three nav files collapse to one. The drawer reuses `<Overlay>`. Five UI primitives handle ~50% of repeated styling. `MapTab` is 4 focused files instead of one 379-line file. `PostTab` is 2 focused files instead of one 490-line file. TypeScript is strictly checked.

---

## 6. Stage C — Testing infrastructure

After Stages A and B, the code is in a state where tests are actually useful.

### C.1 Install the test runner

- `vitest` (test runner)
- `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- `happy-dom` (DOM env, faster than `jsdom`)

Add `vitest.config.ts` and a `test` script in `package.json`.

### C.2 Unit tests for the new pure helpers

Files that exist today and have **zero** tests:

- `src/hooks/useSavedSpots.ts` — `parseSavedIds` round-trips, `migrateLegacy` promotes v1 to v2, the storage-write effect doesn't run until after hydration (regression test for the Pass 1 fix).
- `src/lib/spots/geo.ts` — `haversineMiles` against a known pair (LAX → JFK ≈ 2150 mi), `projectToGrid` clamps to 5–95%.
- `src/lib/weather/mappers.ts` — `mapIconName` covers the OpenWeather icon code → `WeatherIconName` mapping.
- `src/lib/sport-events/loader.ts` — `deriveStatus` for upcoming / live / completed.
- `src/stores/ui-store.ts`, `src/stores/spots-store.ts`, `src/stores/map-filter-store.ts` — pure state transitions; tests use `useUIStore.getState()` / `setState()` directly (reset in `beforeEach`).

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

A second contract test covers `SavedSpotsRepository` (E.6) — `save` / `unsave` / `isSaved` / `list` round-trip.

### C.4 Component smoke test for `<SpotCard>`

One render test that asserts the save button toggles `aria-pressed` and fires `onToggleSave`. Establishes the testing-library pattern for future component tests without committing to a large suite yet.

### C.5 Outcome of Stage C

The fix from Pass 1 has a regression test. The pure helpers are protected. The future `DrizzleSpotRepository` is testable against the same contract. The Zustand stores are testable without rendering. The testing setup is in place; future PRs can add component tests incrementally.

---

## 7. Stage E — PostgreSQL + PostGIS + Supabase + Auth + Storage

In scope. This is the stage that brings the app from a JSON-backed prototype to a real, multi-user, multi-device, server-authoritative product.

**Why "Stage E" instead of "Stage D":** the original SPEC reserved D for "out of scope, future". We are now committing to it, and the work is too large to land in a single stage.

### E.0 Prerequisites (carried forward from Stages A–C)

Stage E is **not** executable unless Stages A–C left these seeds in place. Keep this subsection as a checklist before starting E.1.

1. **Async server contract (`cacheComponents: true`).** `next.config.mjs` runs with `cacheComponents: true`; every `cookies()` / `headers()` / `draftMode()` call site in Stage E (E.4 env reads from headers, E.7 middleware + `createServerClient`, E.6 `toggleSavedAction`) must `await` these APIs. Server Actions and middleware are async functions under this flag.
2. **Server-feed boundary preserved (A.6).** The replacement for `AppProviders` must still take a server-fed prop (`initialSpots`, and a reserved `savedSpots`) so E.6 can inject the user's saved spots from the server without a client fetch.
3. **`Region` / `SpotFacets` reconciliation (A.1b).** The data-model `Region` in §8.13.2 coexists with the frozen UI `Region` in `src/data.ts`. E.5's `listRegions()` returns the **facet** shape; consumers map it onto the UI catalog at the boundary. The two interfaces are not merged.
4. **Weather cache API.** Boundary calls use Next 16 `cacheLife` / `cacheTag` (`src/lib/weather/weather-cached.ts:1`), not `unstable_cache`. E.9 observability and the `getCachedSpotWeather(spot.id)` boundary call in §8.13.1 #7 must reference the real API.
5. **Clean `Spot` (A.1b) + Zod (A.2) + Repository (A.3).** E.5 implements the `SpotRepository` interface defined in A.3 against the A.1b-shaped `Spot`. If any of A.1b/A.2/A.3 is skipped, E.5 is blocked.

### E.1 Dependencies & local PostGIS

- Add deps: `drizzle-orm`, `drizzle-kit`, `pg`, `@types/pg`, `postgres`, `zod`, `@supabase/supabase-js`, `@supabase/ssr`.
- New `docker-compose.yml`:
  ```yaml
  services:
    infra-db:
      image: postgis/postgis:16-3.4
      environment:
        POSTGRES_USER: dev
        POSTGRES_PASSWORD: dev
        POSTGRES_DB: app
      ports: ["5432:5432"]
      volumes: ["./.data/postgres:/var/lib/postgresql/data"]
  ```
- `pnpm db:up` → `docker compose up -d infra-db`. `pnpm db:down` → `docker compose down`.

### E.2 Drizzle schema

Three core tables + one lookup + one auth mirror. See §8.13 for the column lists and indexes.

### E.3 Migrations & seeds

- `drizzle.config.ts`: `out: './supabase/migrations'`, `schema: './src/db/schema'`, `dialect: 'postgresql'`.
- Scripts in `package.json`:
  - `pnpm db:generate` → `drizzle-kit generate`
  - `pnpm db:push` → `drizzle-kit push` (dev only, local PostGIS)
  - `pnpm db:migrate` → `drizzle-kit migrate` (production, reads `SUPABASE_DIRECT_URL`)
  - `pnpm db:seed` → `tsx src/db/seed.ts` (idempotent; `INSERT … ON CONFLICT (slug) DO NOTHING`)
- `src/db/seed/spots.ts` — reads `src/data/spots.json`, transforms via the existing helpers in `src/lib/spots/geo.ts`, inserts.
- `src/db/seed/sport-events.ts` — reads `src/data/sport-events.json`, inserts.
- `src/db/seed/country-regions.ts` — seeds from the current `COUNTRY_TO_REGION` map in `src/data.ts:132-140`.
- `src/db/seed/profiles.ts` — inserts the `dev` profile so the dev user has a `created_by` row.
- `src/db/seed/README.md` — explains the seed contract: deterministic ids, idempotent, safe to re-run.

### E.4 Supabase project & env vars

- New `.env.example` section:
  ```bash
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
  SUPABASE_SERVICE_ROLE_KEY=<service role>     # server-only, never NEXT_PUBLIC
  SUPABASE_STORAGE_BUCKET_SPOTS=spot-images
  # Pooled connection (PgBouncer, port 6543) for serverless / Vercel
  SUPABASE_DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
  # Direct connection (port 5432) for migrations
  SUPABASE_DIRECT_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
  ```
- `src/lib/env.ts` — single typed env reader, Zod-validated at process start. Throws on missing required vars in production; warns in dev. All `process.env.*` reads funnel through here (replaces the current `weather/env.ts` pattern for all other env groups). **`cacheComponents` note:** `process.env.*` reads are sync and safe to call at module init; however, any env value that would derive from request headers (e.g. per-request overrides) must instead be passed in by the caller after `await headers()`. Keep `env.ts` a pure `process.env` reader — no `next/headers` import.

### E.5 Drizzle repository implementations

- `src/lib/repositories/drizzle-spot-repository.ts` — implements `SpotRepository` (defined in A.3). `list` returns rows ordered by slug (the cursor key). `findNearby` uses `ST_DWithin` + bbox pre-filter. `create` / `update` / `delete` set `created_by` from the session user.
- `src/lib/repositories/drizzle-sport-event-repository.ts` — parallel; no `create` / `update` / `delete` (sport events are admin-curated).
- The existing `JsonSpotRepository` stays as the fallback (E.9).

### E.6 SavedSpotsRepository + Server Actions (the favorites end-state)

- `src/lib/repositories/saved-spots-repository.ts`:
  ```ts
  export interface SavedSpotsRepository {
    list(userId: string, opts?: { cursor?: string; limit?: number }): Promise<{
      items: readonly SavedSpotWithDetails[];
      nextCursor: string | null;
    }>;
    isSaved(userId: string, spotId: string): Promise<boolean>;
    save(userId: string, spotId: string): Promise<void>;
    unsave(userId: string, spotId: string): Promise<void>;
    countForSpot(spotId: string): Promise<number>;
  }
  ```
- `DrizzleSavedSpotsRepository` — RLS-enforced; every call includes `auth.uid()` server-side.
- `src/app/actions/saved-spots.ts`:
  - `toggleSavedAction(spotId: string)` — calls `getServerSession()`, flips the row, `revalidateTag('saved-spots:${userId}')`, returns the new boolean.
  - `listSavedSpotsAction()` — returns the user's spot ids.
- `useSavedSpots(userId)` rewritten:
  - Reads from a server-fed `SavedSpot[]` passed to the server-feed boundary preserved in A.6 (the `savedSpots` prop reserved there; `AppProviders` itself is already gone).
  - `toggle(id)` calls the Server Action; on success, updates local state; on failure, rolls back + toast.
  - On first mount while online, `localStorage` is reconciled with the server.

### E.7 Supabase Auth

- `src/lib/supabase/server.ts` — `createServerClient(cookies)` from `@supabase/ssr`.
- `src/lib/supabase/browser.ts` — `createBrowserClient()` from `@supabase/ssr`.
- `src/middleware.ts` — refreshes the session on every request, `config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }`. **`cacheComponents` note:** `middleware.ts` is already async in Next 16; `createServerClient`'s cookie read uses `await cookies()` (the awaited form is required under `cacheComponents: true`). Same for `signOutAction`.

- `useUser` rewritten:
  - Server: `getCurrentUser()` in `src/lib/user.ts` calls `await createServerClient().auth.getUser()`, returns the typed `User`. The `cookies()` call inside `createServerClient` is awaited.
  - Client: `useUser()` reads from a `UserContext` provided by `<AppProviders user={user}>` (the same server-feed boundary preserved in A.6).
- New pages: `/login` (email + magic link form), `/auth/callback`, `/account` (profile + sign-out).
- `signOutAction()` Server Action clears the cookie + redirects to `/`.

### E.8 Supabase Storage (Spot images)

- Bucket: `spot-images`, private; signed URLs for reads.
- `src/lib/supabase/storage.ts`:
  - `uploadSpotImage(file: File, spotId: string): Promise<{ path, url }>` — uploads to `spots/{spotId}/{uuid}`.
  - `getSpotImageUrl(path: string): Promise<string>` — returns a 1-hr signed URL.
- `PostForm.handleSubmit` (B.5 split) uploads first, then creates the spot with `imagePath` set; the UI renders via `getSpotImageUrl(imagePath)` (or `imageUrl` if it's still an external URL).
- Curated spots keep their existing external URLs; `imagePath` is null for them.

### E.9 Connection error handling

- `src/lib/db/client.ts`:
  - Singleton `drizzle` client, pool size 10 (matches Vercel function concurrency). Use `postgres-js` driver (pgBouncer transaction-mode safe).
  - `withRetry<T>(fn, { maxAttempts: 3, baseDelayMs: 200, jitter: 'full' })` — exponential backoff with full jitter; retries only on connection-class errors.
  - `isConnectionError(err)` — classifies errors; non-retryable errors bubble immediately.
- `src/lib/db/health.ts`:
  - `checkDbHealth(): Promise<{ ok, latencyMs, source, error? }>` — `SELECT 1` with a 2 s timeout.
- `GET /api/health`:
  - Returns `{ ok, db: { ok, latencyMs }, version, buildTz }`.
  - Used by Vercel / external uptime check.
- Fallback strategy in `src/lib/repositories/index.ts`:
  - When `SPOTS_DATA_SOURCE=db` and `checkDbHealth()` returns `ok: false`, log the failure with `log.error`, set the repo to `JsonSpotRepository` for the request, set response header `X-Data-Source: fallback`, show a one-time toast on the client.
  - When `SPOTS_DATA_SOURCE=json`, the DB is never touched.
- Observability:
  - `log.error('db.query_failed', { requestId, sql, durationMs, errorCode, errorMessage })`.
  - `app/error.tsx` updated to surface a "Data is stale" message when the error digest is in the `db-fallback` namespace.

### E.10 RLS policies

- New SQL migration `supabase/migrations/0002_rls_policies.sql`:
  - `spots`: `select` open to `anon` + `authenticated`; `insert` requires `auth.uid() = created_by`; `update`/`delete` requires `auth.uid() = created_by`.
  - `sport_events`: `select` open; `insert/update/delete` only via `service_role` (admin via dashboard / seed scripts).
  - `saved_spots`: `select/insert/delete` requires `auth.uid() = user_id`; `update` forbidden.
  - `profiles`: `select` open; `insert/update` requires `auth.uid() = id`.
  - `storage.objects` (bucket `spot-images`): `select` via signed URL; `insert/update/delete` requires `auth.uid()::text = (storage.foldername(name))[1]`.

### E.11 Deploy

- `pnpm db:deploy` — runs `drizzle-kit migrate` against `SUPABASE_DIRECT_URL`.
- `supabase/config.toml` — project id, region, db version.
- Vercel env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DATABASE_URL`, `SUPABASE_DIRECT_URL`, `SPOTS_DATA_SOURCE=db`.
- CI (`.github/workflows/ci.yml`): `pnpm typecheck && pnpm lint && pnpm test && pnpm db:deploy` when `supabase/migrations/**` changes.

### E.12 Outcome of Stage E

After Stage E:

- All entity reads go through a Drizzle repository; JSON loaders stay as a fallback.
- Saved spots are server-authoritative, cross-device synced, RLS-protected.
- Auth is real (Supabase); the static `DEV_USER` stub is gone.
- User-contributed spot images go to Supabase Storage; curated images stay external.
- PostGIS powers `findNearby`; `search` and `findNearby` are first-class `SpotRepository` methods.
- DB outages don't take the site down — the JSON fallback is automatic and observable.
- Migrations are checked in; the schema is reviewable, diffable, and reversible (down migrations per drizzle-kit).

---

## 8. Stage E.13 — Data model

The detailed schema, types, indexes, and query strategy for the three domain entities + supporting lookups. Self-contained; cross-references E.2 (Drizzle schema), E.3 (migrations/seeds), E.5 (Drizzle repos), E.6 (SavedSpots), and C.3 (contract tests).

### 8.13.1 Design principles

1. **No `region` column on `spots`.** Region is a presentation grouping over `country`. The filter flow is: pick region → distinct countries in that region (with at least one spot) → pick country → filter spots by `country`.
2. **No static reference tables** for `country`, `type`, `tier`, or `discipline`. All four are derived from `SELECT DISTINCT` on the live rows. New rows appear in filters; deleted rows disappear.
3. **`country_regions` is the only lookup table** (~200 rows; maps `country → region`). Idempotent, seeded from the current `COUNTRY_TO_REGION` map.
4. **Full-text search via basic `to_tsvector('simple', name || ' ' || city || ' ' || address || ' ' || features || ' ' || country)` with a GIN index.** No weight classes, no trigram — add later if needed.
5. **Pagination is cursor-based** (slug-lexical for spots, `start_date` for events), not offset.
6. **Facets via live `GROUP BY`** against the rows. Materialized view deferred to > 100k spots.
7. **`weather` is not in the schema** — fetched at the boundary via `getCachedSpotWeather(spot.id)`, which wraps Next 16 `cacheLife` / `cacheTag` from `next/cache` (see `src/lib/weather/weather-cached.ts:1`). Not the legacy `unstable_cache` API.
8. **No `isSaved` column on `Spot`** — saved state is owned by the `saved_spots` join, not the row.
9. **No custom `tsvector` weights, no custom `geometry` type abstraction.** Drizzle's `geometry` helper + Zod re-validation at the repo boundary.

### 8.13.2 TypeScript types

```ts
// src/lib/types.ts
export type SpotType =
  | "Plaza" | "DIY" | "Stair" | "Bowl" | "Park" | "Ledges" | "Pools";

export interface Spot {
  id: string;                    // uuid, server-assigned
  slug: string;                  // URL-safe unique handle
  name: string;                  // raw case; UI uppercases
  city: string;
  address: string;
  type: SpotType;
  features: readonly string[];
  image: string;                 // resolved URL (external or signed-URL)
  communityNote: string;
  crowdLevel: number;            // 0-100
  crowdLevelLabel: string;
  country: string;               // canonical, after COUNTRY_NAME_OVERRIDES
  citySlug: string;              // lowercased, hyphenated
  location: { lat: number; lon: number };   // PostGIS-exposed
  createdBy: string | null;      // profile id, null for curated
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}
```

```ts
// src/types/sport-events.ts
export type SportDiscipline =
  | "Skateboard" | "BMX" | "Inline" | "Scooter" | "Rollerblade"
  | "Wakeboard" | "Snowboard" | "Ski";

export type SportEventTier =
  | "world-tour" | "championship" | "festival" | "federation";

export interface SportEvent {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  url: string;
  image: string;
  description: string;
  sports: readonly SportDiscipline[];
  startDate: string;             // ISO 8601 date
  endDate: string | null;
  city: string;
  country: string;
  countryCode: string | null;
  venue: string | null;
  location: { lat: number; lon: number } | null;   // nullable: TBD events
  tier: SportEventTier;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

// Read-time view (NOT stored): adds derived status and dateRangeLabel.
export interface SportEventWithStatus extends SportEvent {
  status: "live" | "upcoming" | "completed";
  dateRangeLabel: string;
}
```

```ts
// src/types/saved-spot.ts
export interface SavedSpot {
  userId: string;                // uuid
  spotId: string;                // uuid
  createdAt: string;             // ISO 8601, server-set
}

export interface SavedSpotWithDetails extends SavedSpot {
  spot: Spot;                    // full row, joined server-side
}
```

```ts
// src/lib/types.ts — query / facet types
export interface SpotFacets {
  countries: readonly { name: string; region: string; count: number }[];
  types: readonly { name: SpotType; count: number }[];
  regions: readonly { name: string; countryCount: number; spotCount: number }[];
}

export interface SportEventFacets {
  countries: readonly { name: string; count: number }[];
  tiers: readonly { name: SportEventTier; count: number }[];
  disciplines: readonly { name: SportDiscipline; count: number }[];
}

export interface SpotQuery {
  q?: string;                    // full-text query
  type?: SpotType;
  country?: string;              // set after region drill-down
  city?: string;                 // city slug
  ids?: readonly string[];
  near?: { lat: number; lon: number; radiusMeters: number };
  savedBy?: string;              // userId; requires auth
  cursor?: string;               // slug of last item
  limit?: number;                // default 50, max 200
}

export interface SportEventQuery {
  q?: string;
  country?: string;
  tier?: SportEventTier;
  discipline?: SportDiscipline;
  featured?: boolean;
  from?: string;                 // ISO date; startDate >= from
  to?: string;                   // ISO date; endDate <= to
  cursor?: string;
  limit?: number;
}

export interface Region {
  name: string;                  // "Americas" | "Europe" | "Asia" | "Oceania" | "Africa"
  countries: readonly string[];  // sorted; derived from country_regions + DISTINCT spots
}
```

### 8.13.3 Database schema

**Three core tables + one lookup + one auth mirror:**

```
spots           (id uuid pk, slug text unique, name, city, citySlug, address,
                type enum, features text[], imageUrl, imagePath?,
                communityNote, crowdLevel int, crowdLevelLabel,
                country, location:geometry(Point, 4326) NOT NULL,
                createdBy? uuid fk profiles, createdAt, updatedAt)

sport_events    (id uuid pk, slug text unique, name, shortName?, url, image,
                description, sports sport_discipline[], startDate, endDate?,
                city, country, countryCode?, venue?,
                location:geometry(Point, 4326)?, tier, featured,
                createdAt, updatedAt)

saved_spots     (userId uuid fk profiles, spotId uuid fk spots, createdAt,
                PRIMARY KEY (userId, spotId))

country_regions (country text pk, region text, iso2?, updatedAt)
                -- the only lookup table

profiles        (id uuid pk fk auth.users, displayName, email unique,
                initials, createdAt)
                -- mirror of auth.users for app-side fields
```

**Indexes — minimum for v1:**

- `spots`: `slug` unique; btree on `type`, `country`, `citySlug`; GIST on `location`; GIN on the concatenated `to_tsvector`; composite `(country, type, slug)`.
- `sport_events`: `slug` unique; btree on `country`, `tier`, `startDate`; GIST on `location`; GIN on the concatenated `to_tsvector`.
- `saved_spots`: PK `(userId, spotId)`; `(userId, createdAt DESC)`; `(spotId)`.
- `country_regions`: PK on `country`; btree on `region`.

**Migrations order:** extensions (postgis) → enums → tables → indexes → RLS → seed.

**Facets — live `GROUP BY` against the rows:**

- `listCountries()` → `SELECT country, region, COUNT(*) FROM spots JOIN country_regions USING (country) GROUP BY country, region`.
- `listCountriesForRegion(region)` → same with `WHERE region = $1`.
- `listRegions()` → `SELECT region, COUNT(DISTINCT country), COUNT(*) FROM spots JOIN country_regions USING (country) GROUP BY region`.
- `listTypes()` → `SELECT type, COUNT(*) FROM spots GROUP BY type`.

Designed for 10k–100k spots. Read replicas and partitioning out of scope for v1.

### 8.13.4 Repository interfaces

```ts
// SpotRepository
export interface SpotRepository {
  list(query?: SpotQuery): Promise<{ items: readonly Spot[]; nextCursor: string | null }>;
  findById(id: string): Promise<Spot | null>;
  findBySlug(slug: string): Promise<Spot | null>;
  findNearby(params: { lat: number; lon: number; radiusMeters: number }): Promise<readonly Spot[]>;
  listCountries(): Promise<readonly { name: string; region: string; count: number }[]>;
  listCountriesForRegion(region: string): Promise<readonly { name: string; count: number }[]>;
  listTypes(): Promise<readonly { name: SpotType; count: number }[]>;
  listRegions(): Promise<readonly { name: string; countryCount: number; spotCount: number }[]>;
  create(input: NewSpot): Promise<Spot>;
  update(id: string, patch: SpotPatch): Promise<Spot>;
  delete(id: string): Promise<void>;
}

// SportEventRepository (no create/update/delete — admin-curated only)
export interface SportEventRepository {
  list(query?: SportEventQuery): Promise<{ items: readonly SportEvent[]; nextCursor: string | null }>;
  findById(id: string): Promise<SportEvent | null>;
  findFeatured(): Promise<SportEvent | null>;
  listCountries(): Promise<readonly { name: string; count: number }[]>;
  listTiers(): Promise<readonly { name: SportEventTier; count: number }[]>;
  listDisciplines(): Promise<readonly { name: SportDiscipline; count: number }[]>;
}

// SavedSpotsRepository
export interface SavedSpotsRepository {
  list(userId: string, opts?: { cursor?: string; limit?: number }): Promise<{
    items: readonly SavedSpotWithDetails[];
    nextCursor: string | null;
  }>;
  isSaved(userId: string, spotId: string): Promise<boolean>;
  save(userId: string, spotId: string): Promise<void>;
  unsave(userId: string, spotId: string): Promise<void>;
  countForSpot(spotId: string): Promise<number>;
}
```

Two implementations each: `Json*Repository` (today) and `Drizzle*Repository` (E.5/E.6). The Json impl is the fallback path; the Drizzle impl is the production path.

### 8.13.5 End-to-end filter flow (region → countries → spots-by-country)

1. **`/explore` initial load:** server calls `listRegions()` → renders 5 region tiles.
2. **User clicks "Europe":** router pushes `/explore?region=europe`. Server calls:
   - `listCountriesForRegion("Europe")` → renders country chips (only European countries with ≥ 1 spot).
   - `list({})` → renders the spotlight grid.
3. **User clicks "France":** router updates to `/explore?region=europe&country=france`. Server calls `list({ country: "France" })`.
4. **User types "bowl":** router updates to `/explore?region=europe&country=france&q=bowl`. Server calls `list({ country: "France", q: "bowl" })`.
5. **User clicks "Bowl" type chip:** adds `type=bowl`. Server calls `list({ country: "France", type: "Bowl", q: "bowl" })`.

All RSC; client navigates with `router.push`, no client-side fetching.

### 8.13.6 Mapping back to other stages

| Stage | What this section changes |
|---|---|
| A.1 | Type unification (`core.ts` deleted) — done. Does NOT yet strip presentation fields. |
| A.1b | Strips `weather`, `coordinates: {x,y}`, `region`, `distance`, `isSaved` from `Spot`; adds `slug`, `citySlug`, `location`, `createdBy`, `createdAt`, `updatedAt`. The UI `Region`/`Country`/`ExploreCategory` in `src/data.ts` stay frozen. |
| A.2 | Zod schemas match the new types (validate the A.1b target shape). |
| A.3 | `SpotRepository` / `EventRepository` / `SavedSpotsRepository` interfaces include the facet + query methods. |
| A.6 | Zustand stores hold the map filter (`useMapFilterStore`). |
| E.2 | Drizzle schema, GIST + GIN + btree indexes. |
| E.3 | Migrations: extensions → enums → tables → indexes → `country_regions` seed → RLS. |
| E.5 | `DrizzleSpotRepository` and `DrizzleSportEventRepository` implement the facet methods. |
| E.6 | `DrizzleSavedSpotsRepository` + `toggleSavedAction` + `useSavedSpots` rewrite. |
| C.3 | Contract test runs the same query list against `Json` and `Drizzle` impls. |

---

## 9. Migration order & dependencies

```
Stage A.1 (single Spot type, core.ts deleted)   [done]
   │
   ▼
Stage A.1b (boundary derivation — strip + add fields)   [not started, BLOCKS A.2]
   │
   ▼
Stage A.2 (Zod, validates the A.1b shape)
   │
   ▼
Stage A.3 (SpotRepository + factory) ◄──┐
   ├──► A.4 (EventRepository)          │
   ├──► A.5 (Server Action)            │
   └──► A.6 (Zustand stores)            │ can parallel
         │                              │
         └──► A.7 (useSavedSpots userId) ┘
                │
                ▼
              A.8 (outcome)

Stage B (composition cleanup) — after A
Stage C (testing) — any time after A

Stage E.0 (prerequisites checklist) — verify A.1b/A.2/A.3 + cacheComponents + initialSpots boundary + Region reconciliation
   │
   ▼
Stage E.1  (deps + local PostGIS via docker-compose)

Stage E.1  (deps + local PostGIS via docker-compose)
   │
   ▼
Stage E.2  (Drizzle schema)
   │
   ├──► E.3  (migrations + seeds)
   │
   ├──► E.4  (Supabase project + env vars + env.ts)
   │
   ├──► E.5  (DrizzleSpotRepository + DrizzleSportEventRepository)
   │
   ├──► E.6  (SavedSpotsRepository + Server Actions + useSavedSpots rewrite)
   │
   ├──► E.7  (Supabase Auth, server+browser clients, middleware, useUser rewrite)
   │
   ├──► E.8  (Supabase Storage bucket + upload)
   │
   ├──► E.9  (DB client: retry, health check, fallback, observability)
   │
   ├──► E.10 (RLS policies SQL migration)
   │
   └──► E.11 (deploy + CI)
```

A.1 is done. **A.1b is next and BLOCKS A.2** (Zod schemas validate the A.1b target shape). After A.1b, A.2 → A.3 is a tight sequence. After A.3, A.4/A.5/A.6 can parallel. A.6 must preserve the `initialSpots` server-feed boundary for E.6. B and C run as their own PRs.

E.0 is a verification checklist, not new code. E.1 → E.2 is a tight sequence. After E.2, E.3/E.4/E.5 can parallel; E.6 needs A.5; E.7 needs E.5; E.9 needs E.4 + E.5. E.10 and E.11 ship last.

---

## 10. Breaking changes list

- **A.2:** `core.ts` already deleted in Pass 3. The `CoreSpot` alias in `loader.ts` is gone.
- **A.1b:** `Spot` loses `weather`, `coordinates: {x,y}`, `region`, `distance`, `isSaved`; gains `slug`, `citySlug`, `location {lat,lon}`, `createdBy`, `createdAt`, `updatedAt`. Every `spot.weather` / `spot.coordinates` / `spot.region` / `spot.distance` / `spot.isSaved` read in components is replaced by the boundary call in the consumer-derivation table (§4 A.1b). UI `Region`/`Country`/`ExploreCategory` in `src/data.ts` are untouched.
- **A.3:** `getSpots()` / `getSpotById()` deleted in favor of `getSpotRepository().list()` / `.findById()`. (Actual exports today are `getSpots` at `src/lib/spots/loader.ts:256` and `getSpotById` at `:260` — the old SPEC's `getSpot()` never existed.) Real call sites: `app/layout.tsx:71`, `app/page.tsx:6`, `app/explore/page.tsx:6`, `app/sport-events/page.tsx:13`, `app/spots/[id]/page.tsx:7,17,38`. The return type changes from `readonly Spot[]` (with `weather`) to `readonly Spot[]` (without, per A.1b).
- **A.4:** `getSportEvents()` / `getFeaturedSportEvent()` deleted in favor of `getSportEventsRepository().list()` / `.findFeatured()`.
- **A.5:** `addSpot` removed from `AppStateProvider`. `PostTab` calls `createSpotAction(formData)` instead.
- **A.6:** `AppStateProvider` and `AppProviders` deleted. `useAppState()` deleted. ~13 call sites (Header, MobileDrawer, MobileDrawerTrigger, AppShell, ExploreTab, MapTab, SavedTab, PostTab, SpotDetailsFullPage, SearchOverlay, RegionFilter, `map/MapPageClient`, …) rewritten to per-store selectors (`useSpotsStore`, `useUIStore`, `useMapFilterStore`). The `initialSpots` server-feed boundary is preserved (new boundary component takes the prop). The `useSavedSpots` hook stays.
- **A.7:** `useSavedSpots()` → `useSavedSpots(userId)`. All callers pass `useUser().id`. The localStorage key becomes `openspot_saved_ids_v2:${userId}`.
- **B.1:** `DesktopNav`, `MobileNav` deleted. `MobileDrawer` loses its nav section. `Header.tsx` and `AppShell.tsx` use `<NavList variant="desktop" | "mobile-tab" | "mobile-drawer" />`.
- **B.2:** `MobileDrawer` becomes much thinner; the `DRAWER_ID` and `DRAWER_TITLE_ID` constants either move to the new shell or become props.
- **B.3:** `Eyebrow` / `SurfaceCard` / `PrimaryButton` / `TabPanel` are opt-in — new code uses them, old code migrates file-by-file.
- **B.4:** `MapTab` is replaced by `MapCanvas` + `MapSidebar` + `MapInfoPopup` + `MapLegend`.
- **B.5:** `PostTab` (default export) becomes `PostForm` (named). `app/post/page.tsx` updates the import.
- **B.6:** `noUncheckedIndexedAccess: true` is a strictness upgrade; expect ~10 small TS fixes.
- **C.2:** none — tests are additive.
- **E.4:** `process.env.*` reads in `weather/env.ts` move to `src/lib/env.ts`. All other env reads funnel through the same module.
- **E.5:** `getSpotRepository()` may now return the Drizzle implementation. Any test that relied on the JSON in-memory shape needs updating.
- **E.6:** `useSavedSpots` reads from a server-fed `SavedSpot[]`. The localStorage v2 key is cleared after a successful sign-in migration.
- **E.7:** `useUser()` reads from a server-fed `UserContext`. The static `DEV_USER` is gone in production; in dev, a seeded `dev@openspot.local` profile is used.
- **E.8:** `Spot.image` (UI) is now either a URL or a signed-URL-resolved path. `SpotDetailsContent` and `SpotCard` resolve via `getSpotImageUrl` if `imagePath` is set; `image` (the URL) stays for the external case.
- **E.9:** `app/error.tsx` renders a "Data may be stale" banner when the error is in the `db-fallback` namespace. The `X-Data-Source` response header is set on every page that uses the repo.
- **E.10:** Direct DB writes from outside the API surface (psql, dashboard) require either the `service_role` key or a RLS bypass.

---

## 11. Risks & open questions

1. **`custom-spot-${Date.now()}` IDs.** `PostTab` currently manufactures IDs client-side. With the DB, the server assigns the id. The Server Action returns the created spot with the assigned id. The v2 localStorage key may contain old `custom-spot-…` ids that don't exist in the DB; the migration in E.6 drops them gracefully.
2. **Weather inlining on `Spot`.** The repository returns a `Spot` without `weather`; the consumer does `getCachedSpotWeather(spot.id)`. The `weather-cached.ts` module already exists; the change is mechanical.
3. **`generateStaticParams` for `/spots/[id]`.** With a DB, this can either stay (build-time query — fine for small datasets) or move to `dynamic = 'force-dynamic'` (necessary for large datasets). Decide based on the expected scale. For Stage A, keep as-is. Decide in E.11.
4. **`useUser` is a static stub today.** Resolved at E.7 — the hook reads from a server-fed `UserContext`. Consumer code (Header, MobileDrawer) doesn't change.
5. **`verifyDepsBeforeRun: false`.** Currently pnpm won't warn about missing deps. With Stage A adding `zod` and Stage E adding `drizzle-orm`, `pg` / `postgres`, `drizzle-kit`, `@supabase/supabase-js`, `@supabase/ssr`, this becomes a real risk. Flip it on after the dep set stabilizes in E.1.
6. **`images.unoptimized: true`.** Fine today. When the Add Spot form supports file uploads (Supabase Storage in E.8), `next/image` optimization matters more. Flip to `false` in E.8.
7. **No `prettier` / no formatter.** The codebase is consistent today, but Stage A will touch ~15 files; a formatter would normalize the result. Consider adding `prettier` (no config — use defaults) in Stage C alongside the test setup.
8. **PostGIS in Supabase:** the free tier supports PostGIS; the Pro tier is required for production scale. Confirm the project's tier before E.11.
9. **pgBouncer transaction mode:** the `SUPABASE_DATABASE_URL` uses transaction-mode pooling. The `postgres-js` driver is pool-friendly; `node-postgres` is not. Use `postgres-js` for the app client, `node-postgres` (or `psql`) for migrations.
10. **Service-role key in CI:** `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the browser bundle. Add an ESLint rule (`no-restricted-imports` against `@/lib/supabase/server` from any `*.tsx` file with `"use client"`) and a build-time check.
11. **RLS gotcha:** Supabase's `auth.uid()` is `null` in service-role contexts; service-role queries bypass RLS. The seed scripts use the service role explicitly; the app code never sees it.
12. **Multi-tab sign-in race:** the v2 → DB migration on first sign-in can race. Use a per-tab UUID lock; second tab sees the first tab's success via a `storage` event.
13. **Offline write-through:** localStorage writes during a network outage queue up; on reconnect, replay them in order. Add a `pendingOps` array in localStorage for replay; surface a permanent error if a save fails forever (don't retry indefinitely).
14. **No React Query:** deliberate. If a future feature needs client-side caching (typeahead search, bbox-driven map, offline mutation replay), introduce React Query at that point for that feature, not globally.
15. **`cacheComponents: true` async contract.** `next.config.mjs` runs with this flag. Stage E's `createServerClient`, `middleware.ts`, `signOutAction`, and `toggleSavedAction` must `await` `cookies()` / `headers()`. If a future Next upgrade changes the awaited form, E.7 + E.9 break silently. Pin the Next major in `package.json` and add a smoke test that asserts `await cookies()` is used (ESLint `no-restricted-syntax` against the sync call form).
16. **Server-feed boundary regression.** A.6 deletes `AppProviders` but must preserve its `initialSpots` server-feed. If a refactor accidentally moves spot seeding to a client fetch, E.6's `savedSpots` prop has no home and `useSavedSpots(userId)` becomes client-side fetching (violates the "RSC reads + Server Actions writes" rule). Add a contract test that `app/layout.tsx` passes `initialSpots` to the boundary component.

---

## 12. What we shipped in this refactor

Done, not planned. For reviewers who want the deltas only.

- **Pass 1 (behavioral):**
  - Fixed the `useSavedSpots` data-loss bug — the first-render empty Set was deleting localStorage. Added a `hydratedRef` guard so the write effect skips until after the migration effect runs.
  - Added `src/lib/user.ts` + `src/hooks/useUser.ts` (returns a static dev user). `Header.tsx` and `MobileDrawer.tsx` consume it. Sets the swap point for Supabase.
  - Added `src/lib/system-info.ts` (`APP_VERSION`, `BUILD_TZ`). `MobileDrawer.tsx` consumes it.
  - Wired ESLint: spread `eslint-config-next` (was installed but unused), added `eslint-plugin-jsx-a11y` and `@next/eslint-plugin-next` as direct devDeps, removed the unused `@typescript-eslint/parser` and `@eslint/eslintrc`.
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

- **Pass 3 (Stage A prep):**
  - Deleted `src/types/core.ts`; `core.ts` is gone and so is the `CoreSpot` alias.
  - `useSavedSpots` no longer deletes localStorage on first render (already in Pass 1; Pass 3 just confirms the cleanup).
  - `ROUTES.*` and `isActivePath()` used in every component; 4 hardcoded `/spots/${id}` literals replaced.
  - Weather env reads centralized in `src/lib/weather/env.ts`.
  - `log` helper in `src/lib/log.ts`; `console.*` calls in weather fetchers, error boundaries, and the global error all routed through it.
  - The 50ms focus timer in `MobileDrawer` removed (Overlay's `useFocusTrap` already handles it).
  - Dead code purged: `getActiveTabFromPath`, `getCountriesRegion`, `getSportDisciplines`, `useToast.push`, `useSavedSpots.lastError`.

- **Pass 4 (Stage A.1–A.7, when complete):** types unified, Zod added, repository interface in place, Server Action for create, three Zustand stores replace `AppStateProvider`, `useSavedSpots` userId-scoped.
- **Pass 5 (Stage B, when complete):** composition cleanup, `MapTab`/`PostTab` split, primitives in place.
- **Pass 6 (Stage C, when complete):** vitest setup, contract test, hook tests, store tests.
- **Pass 7 (Stage E, when complete):** DB-backed, PostGIS-powered, Supabase-hosted, with Auth, Storage, and full error handling.

- **Verified (post-Pass 3):** `pnpm lint`, `pnpm typecheck`, `pnpm dev` (all routes 200, no client errors).
