# AGENTS.md

Operating notes for AI coding agents working in this repo. Keep the file
short — every line should be something an agent would otherwise miss.

## Stack & layout

- Next.js 16 App Router (RSC + cacheComponents) on the `app/` directory, React 19, Tailwind v4.
- pnpm workspace (root only; no sibling packages — `pnpm-workspace.yaml` exists but `apps/` is absent).
- Data layer: two interchangeable repository backends behind `src/lib/repositories/`
  - `JsonSpotRepository` / `JsonEventRepository` / `JsonSavedSpotsRepository` read from `src/data/*.json`.
  - `Drizzle*Repository` read from Postgres (PostGIS for spot geometry). Selected via `SPOTS_DATA_SOURCE` (`json` | `db`) in `src/lib/env.ts`.
  - Async factory `getSpotRepositoryAsync()` does a runtime health check (`checkDbHealth` is wrapped in `"use cache"`) and falls back to JSON when the DB is missing or unhealthy — never throws.
- Auth: Supabase (`@supabase/ssr`); session refresh happens in `src/proxy.ts` via `supabase.auth.getClaims()` (no per-request user fetch).
- Storage: Supabase Storage bucket `spot-images` (env-overridable). `withImageUrls` in `src/lib/supabase/storage.ts` mints 1h signed URLs.
- Weather: OpenWeather current + forecast, cached per-spot with Next.js `"use cache"` + `cacheTag` (`weather:spot:<id>`). Bust with `POST /api/weather/revalidate?spotId=…` (header `x-revalidate-secret: $REVALIDATE_SECRET`).
- External geocoder: Nominatim (env: `NOMINATIM_URL`, `NOMINATIM_USER_AGENT`).

## Commands (run from repo root)

| Task | Command |
| --- | --- |
| Dev server | `pnpm dev` |
| Lint | `pnpm lint` (eslint over `src/`) |
| Typecheck | `pnpm typecheck` (`tsc --noEmit`) |
| Unit tests | `pnpm test` (vitest run) / `pnpm test:watch` |
| Build | `pnpm build` |
| DB schema → migration | `pnpm db:generate` (drizzle-kit) |
| Push schema to DB | `pnpm db:push` |
| Apply migrations (CI/runtime) | `pnpm db:apply` or `pnpm db:deploy` — both run `src/db/apply-sql.ts`, which splits on `--> statement-breakpoint` and records applied IDs in a `schema_migrations` table |
| Seed local DB | `pnpm db:seed` (writes from `src/data/*.json` into the `spots` / `sport_events` / `country_regions` tables) |
| DB health probe | `pnpm db:health` (exit 0/1) |
| Drizzle studio | `pnpm db:studio` |

CI order (`.github/workflows/ci.yml`): `typecheck` → `lint` → `test` → `pnpm db:apply` (only if `supabase/migrations/**` changed). Postgres URL is read as `DB_CONNETION_STRING` (intentional typo) with `SUPABASE_DIRECT_URL` as the preferred name — both still honored in `getDatabaseUrl()`.

## Repo-specific conventions

- Path alias `@/*` → `./src/*` (set in `tsconfig.json` and `vitest.config.ts`).
- `@/lib/env` validates env at import time with Zod; do **not** `process.env` directly in app code — add a field to `EnvSchema` in `src/lib/env.ts` and default/optional-declare it there.
- `src/proxy.ts` is the Next 16 `proxy.ts` (NOT `middleware.ts`) — refreshes the Supabase session cookie. It is intentionally a no-op when `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is missing, so the app runs in dev without Supabase.
- Dev placeholder user: `DEV_USER_ID = "dev"` (`src/lib/user.ts`). When Supabase is unconfigured, the cookie reader, sign-out, and saved-spots flows all collapse onto this dev user — do not gate dev-only UI behind "is signed in" without re-checking it through `useUser().id !== DEV_USER_ID`.
- Logging: use the singleton `log` from `@/lib/log` (it is a no-op when `NODE_ENV === "test"`). Never call `console.*` directly in app code.
- All server actions and `proxy.ts` must call `requireUser` / `requireUserOrRedirect` from `src/lib/auth/server.ts`. Throwing from `requireUser` is intentional — do not try/catch around it in pages.
- `vitest.config.ts` aliases `server-only` → `./test/server-only.ts` (the file is empty) so tests can import server modules without the bundler guard firing.
- The Map page is wired but commented out of `NAV_ITEMS` (`src/lib/nav.ts`). To re-enable, uncomment the `map` entry — the route, repository support, and components all exist.
- Auth: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable, `sb_publishable_…`) and `SUPABASE_SECRET_KEY` (server-only, `sb_secret_…`). Legacy `anon` / `service_role` keys are no longer read.
- The `repository` factory logs a warning on first call that captures *why* JSON was used (`db_not_configured` / `db_unhealthy`) — read those before assuming the DB is wired.
- "use cache" is enabled in `next.config.mjs` (`cacheComponents: true`). New server-side data loaders that should hit the cache should follow the pattern in `src/lib/weather/weather-cached.ts` (declare `"use cache"`, set `cacheTag` + `cacheLife`).
- Styling: monochrome design system in `src/app/globals.css` (`@theme` block). Tailwind tokens are `surface*`, `on-surface`, `primary`, `secondary`, `error`, `outline*`, etc. No color in UI states — see `DESIGN.md` for the full spec.
- Accessibility: `eslint-plugin-jsx-a11y` is enabled; `pnpm lint` will fail on a11y regressions.
- Type safety: `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters` are all on. Watch out for array index access returning `T | undefined`.

## Data source switching (dev shortcut)

For local dev with JSON only (no Postgres), set in `.env.local`:
```
SPOTS_DATA_SOURCE=json
```
The app then reads `src/data/spots.json` and `src/data/sport-events.json` directly. Set `SPOTS_DATA_SOURCE=db` to exercise the Drizzle path; the app will fall back to JSON automatically if `checkDbHealth()` fails.

## Environment files

- `.env.example` is the canonical source of truth — copy it to `.env.local` (git-ignored) for secrets.
- CLI scripts under `src/db/` import `./load-env` first, which reads `.env.local` (overrides) then `.env`. The Next.js runtime reads env via `next dev` / `next build` directly, not via `load-env`.

## Testing

- 3 vitest specs exist: `src/lib/auth.test.ts`, `src/components/spot/SpotCard.test.tsx`, `src/app/api/auth/signout/route.test.ts`. Add new tests in the same `__tests__`-by-convention co-located form: `*.test.ts` / `*.test.tsx` next to the file under test. `vitest.setup.ts` pulls in `@testing-library/jest-dom/vitest`.
- Tests use `happy-dom` and `useSyncExternalStore` server snapshot fallback — no real Supabase/Postgres needed for the unit suite.
- Server actions and route handlers are tested through `vi.mock("@/lib/auth/server", …)` (see `route.test.ts` for the pattern).

## Useful entrypoints (skim these before guessing)

- `src/app/layout.tsx` — root layout; loads initial spots + weather + user on the server.
- `src/lib/repositories/index.ts` — async factory + JSON fallback logic.
- `src/lib/auth/server.ts` — `requireUser`, `requireUserOrRedirect`, `signInWithGoogle`, `signOut`, `originFromRequest`.
- `src/lib/env.ts` — single source of env truth, plus `getDatabaseUrl()` resolution order.
- `src/db/apply-sql.ts` — how migrations are applied at runtime (note: it splits on drizzle's `statement-breakpoint` marker because the live DB rejects multi-statement strings).
- `src/proxy.ts` — session refresh.
- `src/lib/weather/weather-cached.ts` + `weather-bundle.ts` — caching pattern to mimic for new server-side data loaders.
