# Technical Debt Refactor — Nearby Spots, Filter by Region/Country, Marker UI

## Context
Decisions confirmed with user:
- Filter source: URL query string only (delete persisted zustand store)
- User position: in-memory only (remove sessionStorage persist)
- Nearby in URL: `?nearby=1` flag only (no coords in URL)
- No-weather marker fallback: empty square

## A. Filter → URL-only source of truth ✅
- [x] Delete `src/stores/map-filter-store.ts` and remove all imports
- [x] Rewrite `src/hooks/useMapFilter.ts`:
  - Read `region`/`country` from `useSearchParams()`
  - Slug derived from `src/data.ts` (no duplicated slug maps)
  - Expose `setRegion`/`setCountry`/`clearAll` that call `router.replace(..., { scroll: false })`
  - Free-text search stays `useState` in `SearchOverlay`
- [x] Flatten `src/app/map/MapPageClient.tsx`:
  - Reduce to `<Suspense><MapTab/></Suspense>` (Suspense boundary required under `cacheComponents: true`)
  - Keep `page.tsx` metadata
- [x] `RegionFilter.tsx`: replace `closeSearch() + router.push("/map")` (L57-64) with a normal `setCountry()` call (URL write flows through `useMapFilter`)

## B. Remove persisted user position ✅
- [x] `src/stores/user-location-store.ts`:
  - Drop `persist`/`createJSONStorage`/`partialize`/`skipHydration`
  - In-memory Zustand only
  - Keep `radiusMiles` in-state (defaults each load)
  - Keep public `set/clear` API shape for compatibility
- [x] `src/hooks/useUserLocation.ts`:
  - Drop the stale-from-storage recheck
  - Remove `STALE_GRANT_MS` (re-prompt each session is fine; no cached value to be stale against)
- [x] `src/hooks/useUserLocation.test.ts`:
  - Remove "persists granted location to sessionStorage" test (L251-264)
  - Update resetStore to not touch sessionStorage
- [x] Simplify `src/stores/HydrationGate.tsx` (only rehydrates `useUIStore` now)
- [x] `src/components/explore/NearbyCtaButton.tsx`: navigate to `/map?nearby=1` (flag only, no coords)

## C. Consolidate nearby rendering ✅
- [x] `src/components/map/MapTab.tsx`:
  - Keep single radius filter producing `sidebarSpots`
  - Gate it on the new `?nearby=1` URL flag instead of in-memory `status === "granted"`
  - Pass already-filtered `sidebarSpots` to `MapSidebar`
- [x] `src/components/map/MapSidebar.tsx`:
  - Delete duplicate `withinRadius`/`visibleSpots` re-filter (L25-51)
  - Become a pure list renderer of the `spots` prop
  - Keep radius chips UI (driven by props, not internal filtering)
- [x] Single `nearYou` derived boolean in `MapTab` driven by URL flag + granted location
- [x] Drive `flyToUserLocation`/`fitRadius` effects from the URL flag so back-button and deep links replay correctly

## D. Marker UI — weather-only glyph, correct backgrounds ✅
- [x] `src/components/map/LeafletCanvas.tsx`:
  - `buildPinHTML` now renders `weatherIconGlyph` instead of `SPOT_TYPE_GLYPHS[spot.type]`
  - Deleted `SPOT_TYPE_GLYPHS` map and `leaflet-pin__glyph` span
  - When weather is `null`: empty bordered square (confirmed fallback)
  - `pinSize`/anchor unchanged
- [x] `src/app/globals.css`:
  - `.leaflet-pin__weather { color: inherit; }` so it inherits the square's per-state color
  - Removed the hardcoded `color: var(--color-on-primary)` that broke default-state contrast
- [x] `src/components/map/MapLegend.tsx`:
  - "Default" swatch now shows a sample weather glyph
  - Updated legend to reflect weather-icon-driven pins

## E. Tests ✅
- [x] New `src/hooks/useMapFilter.test.ts` (14 tests):
  - URL → filter and filter → URL round-trip
  - Mock `useSearchParams`/`useRouter`/`usePathname`
  - Cover `setRegion`/`setCountry`/`clearAll`
  - Cover invalid slug → null
  - Cover preservation of unrelated query params
- [x] `src/hooks/useUserLocation.test.ts`:
  - Removed persistence test
  - Updated resetStore
  - Removed `grantedAt`-related tests (no longer in the store)
  - 9 tests pass
- [x] `src/components/map/MapSidebar.test.tsx`:
  - Updated to reflect that MapSidebar is now a pure list renderer (no longer re-filters by radius)
  - 5 tests pass
- [x] `src/components/explore/NearbyCtaButton.test.tsx`:
  - Updated to expect `/map?nearby=1` navigation
  - Removed `sessionStorage.clear()` reset
  - 6 tests pass
- [x] No `LeafletCanvas.test.tsx` exists in repo — skipped (nothing to update)

## F. Verification ✅
- [x] `pnpm typecheck` — passes
- [x] `pnpm lint` — passes
- [x] `pnpm test` — 99 / 99 tests pass (12 test files)
- [ ] Manual smoke: open `/map?region=europe&country=france`, toggle filters, back-button, shareable link, `?nearby=1`, empty-weather pins (left to user)

## Notes
- Skills applied: next-best-practices (Suspense + useSearchParams), vercel-react-best-practices (rerender-derived-state, client-localstorage-schema), codebase-memory-mcp (found disconnected `findNearby` repo method + duplicate slug maps)
- DESIGN.md compliance: monochrome, 0px corners, no shadows — fixes the `leaflet-pin__weather` color so glyphs render with correct contrast on every pin state
- `src/stores/index.ts` updated to drop the `useMapFilterStore` re-export