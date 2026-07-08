# TODO — Map Suspense / Leaflet fixes (LCP + safeMapCall + appendChild)

## Context
Three runtime issues observed on `/map`:

1. **LCP warning** — the first region card image on the Explore page is the LCP element but lacks `priority`.
2. **`[leaflet] safe call skipped: _leaflet_pos`** — `safeMapCall` fires the callback before the map's pane DOM positions are computed.
3. **`appendChild` undefined (GridLayer / Marker)** — `react-leaflet` panes are undefined during Suspense reconnection, caused by `<Suspense>` wrapping `<MapTab/>` (which contains `<MapContainer/>`).

Decisions confirmed:
- `safeMapCall` timing: `requestAnimationFrame` (robust, ~16ms).
- Hoist `useSearchParams()` above the `dynamic({ ssr: false })` boundary so the Leaflet map tree is never torn down by Suspense.

## A. Hoist `useSearchParams` above the Leaflet boundary ✅
- [x] `src/app/map/MapPageClient.tsx`: split into `MapPageClient` (`<Suspense fallback={<MapSkeleton/>}><MapPageInner/></Suspense>`) + `MapPageInner` (calls `useSearchParams()`, passes `searchParams` and `nearbyRequested` as props to `<MapTab>`)
- [x] `src/hooks/useMapFilter.ts`: changed signature to `useMapFilter(spots, searchParams: ReadonlyURLSearchParams, options?)`; removed internal `useSearchParams()`; kept `useRouter()` + `usePathname()`
- [x] `src/components/map/MapTab.tsx`: now accepts `searchParams: ReadonlyURLSearchParams` + `nearbyRequested: boolean` as props; `useSearchParams` import removed; `searchParams` passed to `useMapFilter`
- [x] `src/components/search/SearchOverlay.tsx`: calls `useSearchParams()` at top; passes to `useMapFilter(spots, searchParams, { targetPath: ROUTES.map })`

## B. Fix `safeMapCall` — requestAnimationFrame + loaded/size guard ✅
- [x] `src/components/map/LeafletCanvas.tsx`: inside `whenReady`, defer to `requestAnimationFrame`, guard on `map.getContainer()` present, `getSize().x/y > 0`, and `window` defined; then run `fn()` in try/catch

## C. Fix LCP image ✅
- [x] `src/components/explore/ExploreTab.tsx`: added `priority={idx === 0}` to the first region card's `<Image>` and switched the `.map` callback to `(region, idx) =>`

## D. Tests ✅
- [x] `src/hooks/useMapFilter.test.ts`: removed the `useSearchParams` mock (no longer called by the hook); imports `ReadonlyURLSearchParams` and `UseMapFilterOptions`; `render` helper now passes `mockSearchParams as unknown as ReadonlyURLSearchParams` plus the optional `options`; all 20 tests pass

## E. Verification ✅
- [x] `pnpm typecheck` — passes
- [x] `pnpm lint` — passes
- [x] `pnpm test` — 105/105 pass (12 test files)
- [x] `pnpm build` — succeeds; `/map` is `◐ Partial Prerender` (correct PPR behavior)
- [ ] Manual: open `/map?nearby=1` — no console errors; open `/map?region=europe&country=france` — map renders, no `appendChild` crash; check `/` Explore — no LCP warning (left to user)

## Notes
- Skills applied: next-best-practices (PPR / `useSearchParams` Suspense rules; hoist dynamic data above imperative DOM); vercel-react-best-practices (no conditional hooks; explicit dependency injection in `useMapFilter`); codebase-memory-mcp (confirmed `useSearchParams` is the only `next/navigation` hook that triggers Suspense under `cacheComponents`).
- `react-leaflet` is incompatible with React Suspense's `reconnectPassiveEffects` because it holds imperative DOM references — keeping its tree outside any Suspense boundary is the scalable answer, not patching `react-leaflet`.
