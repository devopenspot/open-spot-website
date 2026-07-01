# Open Spot — Stage A Prep Plan

> Status: **active**. The DB / Supabase / PostGIS / Drizzle integration has not started yet. This document captures the UI-safe cleanup that should land **before** Stage A.1 to make that migration mechanical and to shrink the first PR's diff.

Out of scope here: SPEC §3 (Stage B composition), §4 (Stage C testing), §5 (Stage D backend). This plan only does prep — no UI / UX / design changes.

---

## 0. Confirmed decisions

- **Scope:** All 6 PRs below (dead code + nav helper + env centralization + focus timer + logger + saved-spots error).
- **Dead exports:** Delete `getActiveTabFromPath`, `getCountriesRegion`, `getSportDisciplines`, `useToast`'s `push`, and `useSavedSpots`'s `lastError` plumbing.
- **Routing:** Use `ROUTES.*` everywhere it applies; the 4 hardcoded `/spots/${id}` literals become `ROUTES.spot(id)`.

---

## 1. Project state (audit summary)

`pnpm typecheck` and `pnpm lint` are green. The structural blockers for Stage A are concentrated in four areas:

1. The dual `Spot` type (`@/types/core` `CoreSpot` vs `@/lib/types` `Spot`).
2. Free data-loader functions (`getSpots`, `getSpotById`, `getSportEvents`, `getFeaturedSportEvent`) instead of a `Repository` interface.
3. `AppStateProvider` doing three jobs (domain data, persistent saved spots, ephemeral UI state, plus map filter state).
4. Dead or duplicated utilities that will need to be touched during Stage A anyway.

Items that look like debt but **are not**:
- `'use client'` on most components — Next 16 app-router convention; the page is server, the components are client.
- Module-level singletons in `useSavedSpots` (`memoryCache`, `listeners`) — fine for now; A.8 moves them under a user scope.
- `next.config.mjs` `cacheComponents: true` + `images.unoptimized: true` — the latter flips to `false` in Stage D when Supabase Storage lands.

Items deferred (flagged for SPEC stages, not this prep):
- Zod install, `SpotRepository` interface, `AppStateProvider` split → Stage A.1 / A.2 / A.3 / A.7.
- `<Eyebrow>`/`<SurfaceCard>` primitives → Stage B.3.
- `noUncheckedIndexedAccess: true` → Stage B.6.
- Vitest, prettier, `verify-deps-before-run: true` → Stage C.
- `MapPageClient` two-way URL sync refactor → tied to A.7's filter-state split.

---

## 2. PR 1 — Delete dead code

**Risk:** zero. Pure deletions after a caller search.

| File | Change |
| --- | --- |
| `src/types/core.ts` | **Delete file** |
| `src/lib/spots/loader.ts:5` | Remove `import type { Spot as CoreSpot } from "@/types/core"` |
| `src/lib/spots/loader.ts:6` | Keep only `Spot`, `SpotForecast`, `SpotType` from `@/lib/types` |
| `src/lib/spots/geo.ts:1` | Remove `import type { Spot as CoreSpot } from "@/types/core"` |
| `src/lib/spots/geo.ts:10` | Change `bboxOf(entries: CoreSpot[])` to `bboxOf(entries: ReadonlyArray<{ lat: string \| number; lon: string \| number }>)` |
| `src/lib/nav.ts:76-81` | Delete `getActiveTabFromPath` (zero call sites) |
| `src/lib/spots.ts:15-25` | Delete `getCountriesRegion` (zero call sites; `COUNTRY_TO_REGION` in `data.ts:132-140` is the canonical map) |
| `src/lib/sport-events.ts:5-7` | Delete `getSportDisciplines` (zero call sites; `SPORT_DISCIPLINES` in `types/sport-events.ts:11-20` is the source) |
| `src/hooks/useToast.ts:45-47` | Drop `push` from the hook's return value (no consumer uses it) |

**Verification:** `pnpm typecheck && pnpm lint`. A `rg` confirms zero callers before each delete.

---

## 3. PR 2 — Use the nav helper and `ROUTES.*` everywhere

**Risk:** zero. Mechanical replacements; no rendered output changes.

| File | Change |
| --- | --- |
| `src/components/layout/DesktopNav.tsx:5, 67-70` | Import `isActivePath`; replace the inline `item.path === '/' ? ... : ...` ternary |
| `src/components/layout/MobileNav.tsx:5, 62-65` | Same |
| `src/components/layout/MobileDrawer.tsx:12, 102-106` | Same |
| `src/components/explore/ExploreTab.tsx:8, 38` | `router.push(\`/spots/${spot.id}\`)` → `router.push(ROUTES.spot(spot.id))` |
| `src/components/map/MapTab.tsx:55` | Same |
| `src/components/saved/SavedTab.tsx:13` | Same |
| `src/components/layout/AppShell.tsx:37` | Same |

**Skip:**
- `src/app/sitemap.ts:22` — server-side, builds an absolute URL with `BASE_URL`. `ROUTES.spot(id)` returns a path only; the sitemap composes it with the base.
- `src/lib/nav.ts:68` — this *is* the canonical template literal that `ROUTES.spot` uses internally.

**Verification:** `pnpm typecheck && pnpm lint && pnpm dev` and smoke the 4 client routes (`/`, `/map`, `/saved`, `/post`).

---

## 4. PR 3 — Centralize weather env reads

**Risk:** zero. No runtime behavior change.

| File | Change |
| --- | --- |
| `src/lib/weather/env.ts` (new) | Read `URL_WEATHER`, `URL_WEATHER_IMG`, `API_KEY_WEATHER` from `process.env` once. Export the three constants. |
| `src/lib/weather/weather-current.ts:1-5` | Replace the inline `process.env` reads with `import { URL_WEATHER, URL_WEATHER_IMG, API_KEY_WEATHER } from "./env"` |
| `src/lib/weather/weather-forecast.ts:1-5` | Same |

**Verification:** `pnpm typecheck && pnpm lint`.

---

## 5. PR 4 — Drop the redundant focus timer in `MobileDrawer`

**Risk:** zero. `Overlay`'s `useFocusTrap` already focuses the first focusable child on mount.

| File | Change |
| --- | --- |
| `src/components/layout/MobileDrawer.tsx:34-43` | Delete the `useEffect` that focuses `#close-hamburger-btn` after 50ms |
| `src/components/layout/MobileDrawer.tsx:3` | Drop `useEffect` from the React import if no longer needed in this file |

**Verification:** Manual — open the drawer, confirm focus lands on the close button. `pnpm typecheck && pnpm lint`.

---

## 6. PR 5 — Add a `log` helper and route errors through it

**Risk:** zero. No behavior change; just a single seam for future observability.

| File | Change |
| --- | --- |
| `src/lib/log.ts` (new) | Export `log.error`, `log.warn`, `log.info` as thin wrappers over `console.*`. No-op when `process.env.NODE_ENV === 'test'`. |
| `src/lib/weather/weather-current.ts:18, 27, 34` | `console.error` → `log.error` |
| `src/lib/weather/weather-forecast.ts:30, 39` | Same |
| `src/app/error.tsx:14` | Same |
| `src/app/global-error.tsx:14` | Same |

**Verification:** `pnpm typecheck && pnpm lint`.

---

## 7. PR 6 — Surface the saved-spots storage error (light UX change)

**Risk:** low. A user-visible toast is added for storage failures (Safari private mode, quota exceeded). Without this PR's surfacing, the failure is silent. If you'd rather keep it silent, fold this PR's deletions into PR 1 and skip the toast.

| File | Change |
| --- | --- |
| `src/hooks/useSavedSpots.ts:1` | Add `import { showToast } from "./useToast"` |
| `src/hooks/useSavedSpots.ts:106, 121-137, 145-156, 165-167` | Remove `lastError` / `lastErrorRef` / `setLastError` plumbing. Replace silent `writeStorage` failures in the two effects and the `toggle` callback with `showToast(message, 'error')` where the error string is meaningful. |

**Verification:** `pnpm typecheck && pnpm lint`. Manual: trigger a localStorage write failure (DevTools → Application → Storage → Block) and confirm the toast appears.

---

## 8. Cumulative impact

- **Files touched:** 23 (5 deletes, 2 new, 16 edits)
- **Net line count:** ≈ −120 lines (mostly dead code)
- **Stage A.1's first PR diff:** shrinks by ~150 lines (the `core.ts` + `CoreSpot` + dead-code cleanup lands here instead of mixing into the type-unification PR)
- **Per-PR verification:** `pnpm typecheck && pnpm lint`. PR 2 and PR 4 add a manual smoke test.
- **No UI, no UX, no design changes** in PRs 1–5. PR 6 adds one toast (debatable; can be skipped if you want strict no-UX-change discipline).

---

## 9. Execution order

1. PR 1 — Delete dead code
2. PR 2 — Use the nav helper and `ROUTES.*` everywhere
3. PR 3 — Centralize weather env reads
4. PR 4 — Drop the redundant focus timer in `MobileDrawer`
5. PR 5 — Add a `log` helper and route errors through it
6. PR 6 — Surface the saved-spots storage error

Each PR is small, isolated, and re-runnable. None of them touch SPEC §3 (Stage B), §4 (Stage C), or §5 (Stage D) work.

---

## 10. Stage A starting point (after this plan lands)

When Stage A.1 begins, the diff starts clean:
- One `Spot` type in `@/lib/types`.
- No `CoreSpot` alias anywhere.
- `ROUTES.spot(id)` and `isActivePath` are the canonical nav utilities.
- A `log` seam exists for future observability.
- The dead-code surface is gone.

Stage A.1's actual work then becomes the schema + Zod addition + the single-type domain, with no incidental cleanup mixed in.
