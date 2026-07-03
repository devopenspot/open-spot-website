# open-spot-website

Next.js 16 + React 19 + Drizzle + Supabase + Tailwind v4. See SPEC.md for
the product spec, DESIGN.md for the color/typography tokens, and
.env.example for the full env surface.

## Commands

- `pnpm` (not npm/yarn). Node 22, pnpm 11 (CI-pinned).
- Dev / build: `pnpm dev`, `pnpm build`, `pnpm start`.
- Verification order (matches CI): `pnpm typecheck` → `pnpm lint` → `pnpm test` → `pnpm db:apply`.
- `pnpm test` is one-shot; `pnpm test:watch` for watch.
- DB: `pnpm db:generate` (drizzle-kit diff), `pnpm db:push` (local), `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:health`, `pnpm db:apply` / `pnpm db:deploy` (both run `src/db/apply-sql.ts`).
- `.agents/` is gitignored — skill files there are local-only.

## Architecture

- **Data source is a runtime switch.** `SPOTS_DATA_SOURCE=json` (default) reads `src/data/spots.json`; `=db` reads via Drizzle. `src/lib/repositories/index.ts` is the factory; it runs a DB health check and silently falls back to JSON on failure. Every server action and server page goes through the same `get*RepositoryAsync` accessor.
- **Two repo implementations per resource** (`Spot`, `SportEvent`, `SavedSpots`) under `src/lib/repositories/`: `json-*.ts` and `drizzle-*.ts`. The interface files (`*-repository.ts`) are the source of truth.
- **Auth lives only in `src/app/api/auth/*`.** No server actions for auth (SPEC §A.1). Session refresh is in `src/proxy.ts` (Next 16 proxy). Google OAuth only via `@supabase/ssr`.
- **Weather uses Next 16 cache components** (`"use cache"` + `cacheTag` + `cacheLife`); see `src/lib/weather/weather-cached.ts`. Bust one spot with `POST /api/weather/revalidate?spotId=<id>` and header `x-revalidate-secret: <REVALIDATE_SECRET>`.
- **Image upload:** `uploadSpotImage` writes to the bucket named by `SUPABASE_STORAGE_BUCKET_SPOTS` (default `spot-images`); the repo boundary calls `withImageUrls` to swap `imagePath` for a 1h signed URL.
- **Migrations live in `supabase/migrations/`, not `drizzle/`.** `drizzle.config.ts` writes there. New schema → `pnpm db:generate`, then commit the generated SQL.
- **Hotspots (high fan-in, edit with care):** `cn` (22), `error` (9), `getSpotRepositoryAsync` (8), `useUser` (8), `withImageUrls` (7), `createSupabaseServerClient` (7). Use `trace_path(..., direction="inbound")` before changing any of them.

## Pitfalls

- **`getCurrentUser` from `@/lib/user` is a dev placeholder** (`{ id: 'dev' }`), not the authenticated user. The real one is `getServerUserFromCookies` in `@/lib/auth`; the protected-page guard is `requireUserOrRedirect` in `@/lib/auth/server`. `src/app/actions/spots.ts:80` and `src/app/actions/saved-spots.ts:9,26` currently import the wrong one — do not copy that pattern.
- **Two accepted env names for the same value** (back-compat): `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`; `SUPABASE_DIRECT_URL` or `DB_CONNETION_STRING` (typo, intentional). See `src/lib/env.ts`.
- **Map grid bbox is static** in `src/lib/spots/geo.ts` — computed once from `src/data/spots.json` and reused for every spot, so Drizzle-created spots project to the wrong cell. Treat as known until the bbox is recomputed per `filteredSpots`.
- **`DrizzleSpotRepository.list` ignores `query.cursor`** — both branches order by `asc(spots.slug)` and the cursor never advances. `findById` / `findBySlug` are correct; do not rely on `list` cursor pagination.
- **ESLint strips 27 React rules** in `eslint.config.mjs` (e.g. `react/prop-types`, `react/no-deprecated`). They were removed on purpose; do not re-enable without team sign-off.
- **`MapTab` pan math is fragile** (`(50 - coords.x) * 2 * zoomLevel`) — works for the current viewport metrics but will break if the canvas dimensions change. Prefer measured-viewport math.

## Knowledge graph (MCP)

`codebase-memory-mcp` is wired globally; project key
`Users-gabrielalfonso-Development-Personal-Projects-open-spot-website`.
Workflow lives in `~/.config/opencode/AGENTS.md`. Re-run
`index_repository` (mode `moderate`) after any PR that touches
`src/lib/**`, `src/db/**`, `src/app/actions/**`, or adds a new route.

## Testing

- Vitest + happy-dom, `@testing-library/react` + `user-event`. Tests: `src/**/*.{test,spec}.{ts,tsx}`. Coverage is currently one file (`src/components/spot/SpotCard.test.tsx`); hook and repo layers are uncovered.
- `server-only` is aliased to `test/server-only.ts` in `vitest.config.ts` so server modules can be imported in tests without pulling in the Next runtime.
