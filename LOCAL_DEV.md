# Local Development Guide

> Everything a new developer needs to clone, run, understand, and change this
> project on their machine.
>
> **If you only have 5 minutes**, jump to [Quick start](#quick-start) and
> [Run it](#run-it) — that gets the app live on `http://localhost:3000` in
> one mode (`SPOTS_DATA_SOURCE=json`, no DB). Everything else is depth.
>
> For the **roadmap + frozen design contracts**, see [`SPEC.md`](./SPEC.md)
> and [`DESIGN.md`](./DESIGN.md). For **production deployment** see
> [`DEPLOY.md`](./DEPLOY.md). For the **resumable status snapshot** see
> [`SPEC_STATUS.md`](./SPEC_STATUS.md).

---

## Table of contents

1. [What this app is](#what-this-app-is)
2. [Stack at a glance](#stack-at-a-glance)
3. [Prerequisites](#prerequisites)
4. [Quick start](#quick-start)
5. [Run it](#run-it)
6. [Project structure tour](#project-structure-tour)
7. [Architecture in 5 minutes](#architecture-in-5-minutes)
8. [Data model](#data-model)
9. [The data-source switch (json ↔ db)](#the-data-source-switch-json--db)
10. [Commands cheat sheet](#commands-cheat-sheet)
11. [Testing](#testing)
12. [Adding a migration](#adding-a-migration)
13. [Common dev tasks](#common-dev-tasks)
14. [Troubleshooting](#troubleshooting)
15. [Where to look next](#where-to-look-next)

---

## What this app is

Open Spot is a high-contrast, monochrome web directory for skateboarders
and riders — discover plazas, DIYs, bowls, ledges, and pools, save the
ones that matter, post new ones. Think: a curated map of rideable obstacles
with sport-events, weather, and a server-authoritative favorites system.

The code is a single Next.js 16 app (App Router) that can run in two modes:

- **JSON mode** (default) — read-only, no database. All spots and events
  come from `src/data/*.json`. Best for: static deploys, demos, working
  on UI without spinning up Postgres.
- **DB mode** — read + write through Drizzle ORM + Supabase Postgres +
  PostGIS. Multi-user, cross-device, RLS-protected, with Supabase Storage
  for user-contributed spot images. Best for: the real product path.

The two modes share a single `SpotRepository` / `EventRepository` /
`SavedSpotsRepository` interface, so swapping `SPOTS_DATA_SOURCE=json` for
`SPOTS_DATA_SOURCE=db` is a one-env-var change.

---

## Stack at a glance

| Layer | Tech | Notes |
|---|---|---|
| Framework | **Next.js 16.2** (App Router, Turbopack) | `cacheComponents: true` — `cookies()` / `headers()` are async |
| Language | **TypeScript 5.8** strict, `noUncheckedIndexedAccess: true` | |
| UI | **React 19** + **Tailwind CSS v4** | The UI catalog (`ExploreCategory`, `LegendaryTerrain`, `Region`) is **frozen** — see `src/data.ts` |
| Icons | **lucide-react** | |
| Animation | **motion** (Framer Motion successor) | |
| Client state | **Zustand 5** | `useUIStore`, `useSpotsStore`, `useMapFilterStore` |
| Server data | **Drizzle ORM 0.45** + **postgres-js 3.4** | Pool 10, 8 s connect timeout |
| DB | **PostgreSQL 16 + PostGIS 3.4** (Supabase in prod, local docker in dev) | |
| Auth | **Supabase Auth** (`@supabase/ssr`) | Dev fallback is the static `DEV_USER` |
| Storage | **Supabase Storage** (private bucket `spot-images`) | 1-hr signed URLs at the read boundary |
| Validation | **Zod 4** | At every JSON loader + Server Action boundary |
| Caching | **Next 16 `cacheLife` / `cacheTag`** (`src/lib/weather/weather-cached.ts`) | Not the legacy `unstable_cache` |
| Tests | **Vitest 4** + **@testing-library/react 16** + **happy-dom 20** | |
| Lint | **ESLint 10** + `eslint-config-next` + `typescript-eslint` + `eslint-plugin-jsx-a11y` | |
| Migrations | **Plain SQL** in `supabase/migrations/` (drizzle-generated + hand-edited) | Custom runner `pnpm db:apply` handles `--> statement-breakpoint` |
| Path alias | `@/*` → `./src/*` | `import { cn } from "@/lib/cn"` |

---

## Prerequisites

Install these on your machine before you start:

| Tool | Min version | Why | Install |
|---|---|---|---|
| **Node.js** | **22 LTS** (20.19 also works) | Next 16 + `rolldown` (bundled with Vitest 4 / Vite 8) imports `styleText` from `node:util`, which was added in Node 20.12 / 21.2 | [nodejs.org](https://nodejs.org/) or `nvm install 22` |
| **pnpm** | **11+** | Lockfile-managed; the `pnpm` shebang uses whatever `node` is in `PATH` | `corepack enable && corepack prepare pnpm@latest --activate` |
| **Docker Desktop** (or Docker Engine) | recent | Local Postgres + PostGIS for DB mode | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Supabase account** (only for DB mode) | free tier is fine for dev | Project with PostGIS extension enabled | [supabase.com](https://supabase.com/) |
| **A `nvm`-style version manager** (recommended) | nvm / fnm / volta | Lets you switch Node versions per project | `brew install fnm` then `fnm install 22` |

> **If you have Node 20.10**, the build will crash with
> `SyntaxError: The requested module 'node:util' does not provide an
> export named 'styleText'`. Switch to 20.19+ or 22 first. The
> [Troubleshooting](#troubleshooting) section has the quick fix.

### Recommended: editor setup

- **VS Code** with the `dbaeumer.vscode-eslint`, `bradlc.vscode-tailwindcss`,
  and `ms-playwright.playwright` extensions.
- The repo's `.agents/` folder has curated, role-specific skills
  (frontend-design, supabase-postgres-best-practices, etc.) that an
  agent editor (e.g. opencode, Cursor) can pick up.

---

## Quick start

The fastest path from a fresh clone to a running app.

```bash
# 1. Clone
git clone <repo-url> open-spot-website
cd open-spot-website

# 2. Install deps (uses pnpm — see the lockfile)
corepack enable
pnpm install

# 3. Copy the env template and fill in the values you need
cp .env.example .env.local
#   Edit .env.local — for the fastest start, you can leave the Supabase
#   section blank and keep SPOTS_DATA_SOURCE=json (the default).

# 4. Run the dev server
pnpm dev
#   → http://localhost:3000
```

That's it. The app is now running on a static read of `src/data/spots.json`
plus an in-process saved-spots JSON store. No database required.

If you want the **DB mode** (real Postgres + Supabase Auth), follow
[DB mode setup](#db-mode-setup-with-supabase--docker) below.

---

## Run it

After `pnpm dev`, open:

- **`http://localhost:3000`** — the directory home (default tab)
- **`/explore`** — region → country → spot drill-down
- **`/map`** — the CSS-grid "map" with absolute-positioned pins
- **`/saved`** — your favorited spots (localStorage today; Supabase in DB mode)
- **`/post`** — register a new obstacle (form)
- **`/sport-events`** — featured event + list
- **`/login`** — magic-link sign-in (DB mode only)
- **`/account`** — profile + sign-out (DB mode only)
- **`/api/health`** — `{ ok, db, version }` for the DB branch

**Useful flags**:

- `pnpm dev` — Turbopack dev server with HMR
- `pnpm build` — production build (also runs TypeScript + ESLint)
- `pnpm start` — serve the production build
- `pnpm lint` — ESLint over `src/`
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm test` — Vitest one-shot
- `pnpm test:watch` — Vitest watch mode

---

## Project structure tour

```
.
├── .agents/skills/           # role-specific skills for agent editors
├── .env.example              # template — copy to .env.local
├── .github/workflows/ci.yml  # typecheck + lint + test + db:apply (CI)
├── .next/                    # Next.js build output (gitignored)
├── DEPLOY.md                 # production deploy runbook
├── DESIGN.md                 # frozen UI/design contract
├── LOCAL_DEV.md              # this file
├── SPEC.md                   # the agreed-upon engineering roadmap
├── SPEC_STATUS.md            # resumable status snapshot
├── drizzle.config.ts         # drizzle-kit config
├── eslint.config.mjs         # ESLint flat config
├── next.config.mjs           # cacheComponents: true, images.unoptimized
├── package.json              # scripts + deps
├── pnpm-lock.yaml
├── pnpm-workspace.yaml       # pnpm workspace config
├── postcss.config.mjs        # tailwindcss/postcss
├── supabase/
│   └── migrations/           # 3 SQL files: schema, postgis indexes, RLS
├── test/
│   └── server-only.ts        # vitest alias stub for `server-only`
├── tsconfig.json             # path alias @/*, strict + noUncheckedIndexedAccess
├── vitest.config.ts
└── src/
    ├── app/                  # Next.js App Router (routes)
    │   ├── layout.tsx        # sync RootLayout + async RootDataProviders in <Suspense>
    │   ├── page.tsx          # /
    │   ├── explore/          # /explore
    │   ├── map/              # /map
    │   ├── saved/            # /saved
    │   ├── post/             # /post
    │   ├── sport-events/     # /sport-events
    │   ├── spots/[id]/       # /spots/[id]
    │   ├── login/            # /login (magic link)
    │   ├── account/          # /account (sign-out)
    │   ├── auth/callback/    # /auth/callback (exchanges code for session)
    │   ├── actions/          # Server Actions (spots, saved-spots, auth)
    │   ├── api/              # route handlers (health, weather/revalidate)
    │   ├── sitemap.ts
    │   ├── robots.ts
    │   ├── not-found.tsx
    │   └── error.tsx
    ├── components/           # UI components (layout, map, post, saved, …)
    │   ├── layout/           # Header, MobileDrawer, NavList, SpotsProvider, …
    │   ├── map/              # MapCanvas, MapSidebar, MapInfoPopup, MapLegend
    │   ├── post/             # PostForm, PostSuccessScreen
    │   ├── saved/            # SavedTab
    │   ├── search/           # SearchOverlay, RegionFilter
    │   ├── spot/             # SpotCard, SpotDetailsContent, SpotDetailsFullPage
    │   ├── sport-events/     # SportEventCard, …
    │   ├── ui/               # Eyebrow, SurfaceCard, PrimaryButton, TabPanel
    │   ├── explore/          # ExploreTab, category cards
    │   └── feedback/         # toasts
    ├── hooks/                # useSavedSpots, useUser, useToast, useNavList
    ├── stores/               # Zustand: ui-store, spots-store, map-filter-store
    ├── data.ts               # FROZEN UI catalog (Region, ExploreCategory, …)
    ├── data/
    │   ├── spots.json        # 12 KB Nominatim-shaped seed
    │   └── sport-events.json # 3.6 KB
    ├── db/                   # CLI scripts: apply-sql, seed, health-cli, schema
    ├── lib/
    │   ├── env.ts            # Zod-validated env reader (the only one)
    │   ├── log.ts            # log.warn / log.error
    │   ├── cn.ts             # className helper
    │   ├── constants.ts      # CROWD_LEVEL, MAP_VIEWPORT_OFFSET_PX, etc.
    │   ├── nav.ts            # ROUTES.* + isActivePath()
    │   ├── user.ts           # DEV_USER (used when Supabase is unconfigured)
    │   ├── auth.ts           # getServerUserFromCookies, ensureProfileRow
    │   ├── types.ts          # Spot, SportEvent, SavedSpot (single source)
    │   ├── repositories/     # SpotRepository / EventRepository / SavedSpotsRepository
    │   │                     # — Json* and Drizzle* implementations + index.ts factory
    │   ├── schemas/          # Zod schemas: spot, event
    │   ├── db/               # postgres-js client + checkDbHealth
    │   ├── supabase/         # server / browser clients, storage (uploadSpotImage, withImageUrls)
    │   ├── spots/            # geo.ts (haversine, projectToGrid, formatDistanceMiles)
    │   ├── weather/          # weather-cached, weather-bundle, mappers
    │   ├── sport-events/     # status.ts (deriveStatus), loader
    │   ├── user-context.tsx  # UserProvider (server-feed boundary)
    │   └── saved-spots-context.tsx # SavedSpotsProvider (server-feed boundary)
    └── types/                # additional type-only files
```

### Where do I edit…?

| You want to… | Open |
|---|---|
| Change a route's metadata, layout, or page | `src/app/.../page.tsx` |
| Add a Server Action | `src/app/actions/*.ts` |
| Change a query / domain write | `src/lib/repositories/drizzle-*.ts` (DB) **or** `json-*.ts` (JSON fallback) |
| Add a new spot / event field | `src/lib/types.ts` → `src/lib/schemas/spot.ts` (or `event.ts`) → both repos → `src/db/schema.ts` + a migration |
| Add a new tab / nav entry | `src/data.ts` (UI catalog) + `src/lib/nav.ts` (`ROUTES`) + `src/components/layout/NavList.tsx` |
| Change the saved-spots behavior | `src/hooks/useSavedSpots.ts` + `src/lib/repositories/{json,drizzle}-saved-spots-repository.ts` |
| Change weather rendering | `src/lib/weather/` (the boundary) + `src/components/spot/SpotCard.tsx` / `SpotDetailsContent.tsx` |
| Add a UI primitive | `src/components/ui/` (use the existing pattern: Eyebrow, SurfaceCard, PrimaryButton, TabPanel) |
| Change the DB schema | `src/db/schema.ts` + a new file in `supabase/migrations/` |
| Add a `pnpm` script | `package.json` |
| Change the env reader | `src/lib/env.ts` (the single typed entry point) |

---

## Architecture in 5 minutes

The mental model from `SPEC.md` §1, condensed:

```
┌──────────────┐      reads      ┌─────────────────────┐
│ Server       │ ──────────────► │ Repository (interface)
│ components   │                 │  • list / findById / findBySlug /
│ (RSC)        │                 │  • findNearby / listCountries /
│              │                 │  • listRegions / listTypes /
│              │                 │  • create / update / delete
└──────┬───────┘                 └──────────┬──────────┘
       │                                    │
       │ writes (Server Actions)            │
       │                                    ▼
       │              ┌───────────────────────────────┐
       └────────────► │  Json*Repository  (in-process)  │
                      │  Drizzle*Repository (Postgres)  │
                      └───────────────────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │ Postgres + PostGIS   │
                        │ (Supabase)           │
                        └──────────────────────┘

┌──────────────┐   selectors   ┌────────────────────────┐
│ Client       │ ◄─────────── │ Zustand stores          │
│ components   │              │  • useUIStore           │
│ (use client) │              │  • useSpotsStore        │
│              │              │  • useMapFilterStore    │
└──────┬───────┘              └────────────────────────┘
       │
       │ server-fed on mount
       ▼
┌──────────────────────────┐
│ SpotsProvider (server)   │ ─── initialSpots from RSC
│ WeatherContext           │ ─── initialWeather from RSC
│ SavedSpotsProvider       │ ─── initialSavedSpots from RSC
│ UserProvider             │ ─── initialUser from RSC
└──────────────────────────┘
```

**The contract** (read it in `SPEC.md` §1):

1. **Every read goes through a Repository.** No component calls the DB
   directly; no component reads `spots.json` directly. The factory in
   `src/lib/repositories/index.ts` returns the right impl based on
   `SPOTS_DATA_SOURCE` + a health check + a graceful JSON fallback.
2. **Every write goes through a Server Action.** No client-side `fetch` of
   a route handler for domain writes. The action validates with Zod,
   calls the repository, and `revalidateTag` as needed.
3. **Every UI slice is in a Zustand store.** The replacement for the
   old `AppStateProvider`. `useSavedSpots` is the one exception — it's
   a `useSyncExternalStore` hook that does the right thing for
   localStorage / server-fed lists.
4. **`Spot.image` is always a resolved URL.** Either the external
   `imageUrl` (curated) or a 1-hr signed URL from Supabase Storage
   (user-contributed). The boundary is `withImageUrls` in
   `src/lib/supabase/storage.ts`.

**The async-everything contract (`cacheComponents: true`):**

Under `cacheComponents: true`, every `cookies()` / `headers()` /
`draftMode()` from `next/headers` is **async**. The root layout deals
with this by being a sync `RootLayout` that renders an `<Suspense>`
around an async `RootDataProviders` server component — so the
not-found prerender doesn't trip on the data access.

---

## Data model

The frozen entity shapes live in `src/lib/types.ts`. The Zod schemas
in `src/lib/schemas/spot.ts` (and `event.ts`) are the runtime contract;
both repos return the same `Spot` / `SportEvent` shape so the UI is
unaware of which backend served the data.

**`Spot`** (matches SPEC §8.13.2):

```ts
{
  id: string;                    // uuid (server-assigned) or "custom-spot-<ts>" (Json)
  slug: string;                  // URL-safe unique handle
  name: string;                  // raw case; UI uppercases
  city: string;
  citySlug: string;              // lowercased, hyphenated
  address: string;
  type: "Plaza" | "DIY" | "Stair" | "Bowl" | "Park" | "Ledges" | "Pools";
  features: readonly string[];
  image: string;                 // resolved URL (external or signed)
  communityNote: string;
  crowdLevel: number;            // 0-100
  crowdLevelLabel: string;
  country: string;               // canonical, after COUNTRY_NAME_OVERRIDES
  location: { lat: number; lon: number };
  createdBy: string | null;      // profile id; null for curated
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}
```

**Presentation fields are NOT on `Spot`** — they derive at the boundary:

| Field | Where it comes from |
|---|---|
| `weather` | `getCachedSpotWeather(spot.id)` (Next 16 `cacheLife`/`cacheTag`) |
| `coordinates {x,y}` | `projectToGrid(spot.location)` in `src/lib/spots/geo.ts` |
| `region` | `COUNTRY_TO_REGION[spot.country]` from `src/data.ts` |
| `distance` | `haversineMiles(user, spot.location)` in `src/lib/spots/geo.ts` |
| `isSaved` | `useSavedSpots().isSaved(spot.id)` |

**The `imagePath` ↔ `image` boundary:**

- `Spot.image` is always a usable URL (external or signed).
- The DB column `spots.imagePath` is the storage path (e.g.
  `spots/<uuid>/<uuidv4>`) — only set for user-contributed uploads.
- The boundary function `withImageUrls(entries)` resolves every
  `imagePath` to a 1-hr signed URL via Supabase's `createSignedUrls`
  (batch + per-request `cache` memoization).

**`SportEvent`** and **`SavedSpot`** are in the same file; full schema
in `SPEC.md` §8.13.2.

---

## The data-source switch (json ↔ db)

The whole switch is one env var:

```bash
# In .env.local
SPOTS_DATA_SOURCE=json   # default; no DB
SPOTS_DATA_SOURCE=db     # Drizzle + Supabase
```

`src/lib/repositories/index.ts` has three async factories
(`getSpotRepositoryAsync`, `getEventRepositoryAsync`,
`getSavedSpotsRepositoryAsync`) that:

1. Return the **JSON** impl if `SPOTS_DATA_SOURCE=json` (no health check).
2. Return the **JSON** impl if the DB env vars are missing
   (`SUPABASE_URL` + `DB_CONNETION_STRING` / `SUPABASE_DIRECT_URL`).
3. Run `checkDbHealth()` (a 2 s `SELECT 1`).
4. If healthy → return the **Drizzle** impl.
5. If unhealthy → log via `log.error("repositories.db_unhealthy_falling_back_to_json")`,
   return the **JSON** impl for this request.

`getLastRepositoryContext()` exposes which path was taken for
observability (`{ forceSource?: "json"|"db", reason?: "db_not_configured" | "db_unhealthy" }`).

The **sync** factories (`getSpotRepository`, etc.) are kept for tests
and the legacy A.3 surface; they always return the Json impl.

### DB mode setup (with Supabase + docker)

Two paths to a working `SPOTS_DATA_SOURCE=db`:

**Path A — local docker only (no Supabase project):**

1. Add a `docker-compose.yml` at the repo root (not present by default —
   the spec describes it but the local docker path uses `DATABASE_URL`
   directly):

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

2. `docker compose up -d infra-db` (or `pnpm db:up` if you add the script).
3. `.env.local`:
   ```
   DATABASE_URL=postgresql://dev:dev@localhost:5432/app
   SPOTS_DATA_SOURCE=db
   ```
4. `pnpm db:apply && pnpm db:seed`.
5. `pnpm dev`.

**Path B — live Supabase project (the production parity path):**

1. Create a Supabase project; wait for provisioning.
2. In the SQL editor: `create extension if not exists postgis;`
3. Create a private Storage bucket named `spot-images` (5 MB, image/*).
4. In **Project Settings → API**, copy the **Project URL** and the
   **service_role** key. In **Project Settings → Database**, copy the
   **Session-mode** connection URI (port 5432).
5. `.env.local`:
   ```
   APP_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
   SUPABASE_SECRET_KEY=<service-role>
   SUPABASE_DIRECT_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
   SPOTS_DATA_SOURCE=db
   ```
6. `pnpm db:apply && pnpm db:seed && pnpm dev`.

The seed is idempotent — re-running `pnpm db:seed` is safe.

---

## Commands cheat sheet

| Command | What it does | When to use it |
|---|---|---|
| `pnpm dev` | Start the Turbopack dev server on `:3000` | Default dev loop |
| `pnpm build` | Type-check, lint, and production build (Turbopack) | Pre-deploy check |
| `pnpm start` | Serve the production build | After `pnpm build` |
| `pnpm lint` | ESLint over `src/` | Pre-commit, pre-PR |
| `pnpm typecheck` | `tsc --noEmit` | Pre-commit, pre-PR |
| `pnpm test` | Vitest one-shot | Pre-PR, debugging |
| `pnpm test:watch` | Vitest watch | While writing tests |
| `pnpm db:health` | `SELECT 1` against the active DB | Smoke-test DB connectivity |
| `pnpm db:apply` | Apply pending `supabase/migrations/*.sql` (custom runner) | After a new migration lands |
| `pnpm db:deploy` | Alias for `db:apply` against prod (`SUPABASE_DIRECT_URL`) | Promote migrations to prod (see `DEPLOY.md`) |
| `pnpm db:generate` | `drizzle-kit generate` (regenerate the initial migration from `src/db/schema.ts`) | If you change the schema in a non-trivial way |
| `pnpm db:push` | `drizzle-kit push` (dev only) | Local dev fast iteration against the docker DB |
| `pnpm db:migrate` | `drizzle-kit migrate` (drizzle journal; doesn't run our SQL-only migrations) | Not used in this repo — prefer `db:apply` / `db:deploy` |
| `pnpm db:studio` | `drizzle-kit studio` (DB GUI on `:4983`) | Inspect rows while debugging |
| `pnpm db:seed` | Idempotent seed: 24 country/regions, 11 spots, 5 events | Fresh DB |

---

## Testing

The test suite is **58 tests** in **10 files**, all green in ~4.5 s on
this machine. The runner is **Vitest 4** with **happy-dom** for the
DOM env.

| File | What it covers |
|---|---|
| `src/lib/spots/geo.test.ts` | `haversineMiles` (LAX→JFK ≈ 2475 mi), `formatDistanceMiles`, `projectToGrid` clamping |
| `src/lib/sport-events/status.test.ts` | `deriveStatus` (upcoming / live / completed) — 5 tests |
| `src/lib/weather/mappers.test.ts` | `mapIconName` (all OpenWeather codes), `mapCurrentWeather`, `mapForecast` |
| `src/stores/ui-store.test.ts` | `useUIStore` transitions (2 tests) |
| `src/stores/map-filter-store.test.ts` | `useMapFilterStore` region/country setters (3 tests) |
| `src/stores/spots-store.test.ts` | `useSpotsStore` (2 tests) |
| `src/lib/repositories/__tests__/spot-repository-contract.test.ts` | Reusable `spotRepositoryContract(getRepo)` factory + Json impl (11 tests) — Drizzle impl runs the same contract when wired |
| `src/lib/supabase/__tests__/storage.test.ts` | `withImageUrls` (no-op, signed-URL replace, dedup, error) + `getSpotImageUrls` (empty) — 5 tests |
| `src/hooks/useSavedSpots.test.tsx` | Includes the Pass 1 data-loss regression (9 tests) |
| `src/components/spot/SpotCard.test.tsx` | `aria-pressed` + `onToggleSave` + open-button (3 tests) |

### Adding a new test

1. Co-locate: `foo.ts` → `foo.test.ts` next to it. The vitest config
   picks up `src/**/*.{test,spec}.{ts,tsx}`.
2. If your test imports a server-only module (anything with
   `import "server-only"`), the vitest alias already maps
   `server-only` → `test/server-only.ts` (a no-op stub).
3. Mock `@/lib/supabase/server` with `vi.mock("@/lib/supabase/server", ...)`
   to get a `createSupabaseServerClient()` that returns whatever shape
   your test needs — see `src/lib/supabase/__tests__/storage.test.ts`
   for the pattern.
4. The Drizzle repos aren't unit-tested (they need a live DB). The
   contract test in `src/lib/repositories/__tests__/spot-repository-contract.test.ts`
   is reusable: `spotRepositoryContract(() => new DrizzleSpotRepository(db))`
   once you have a test DB fixture.

---

## Adding a migration

1. Create a new SQL file in `supabase/migrations/`. The filename pattern
   is `NNNN_short_name.sql` (e.g. `0003_add_event_tier_index.sql`).
   Drizzle's `--> statement-breakpoint` separator is required between
   statements (the runner splits on it before sending to the DB).

2. **Locally**:

   ```bash
   pnpm db:apply    # applies only the new file (idempotent — tracks via schema_migrations)
   pnpm db:seed     # optional — re-seeds if your change affects seed data
   ```

3. **CI**: the `.github/workflows/ci.yml` runs `pnpm db:apply` against
   the staging project whenever `supabase/migrations/**` changes.

4. **Production**: `pnpm db:deploy` (alias for `db:apply`).

5. Update `SPEC_STATUS.md` if the migration changes a stage's status.

If the migration needs a **drizzle schema change** (e.g. new column):

1. Edit `src/db/schema.ts` (the single source of truth).
2. Run `pnpm db:generate` to regenerate `0000_0001_initial_schema.sql`
   (will overwrite — only do this if you intend to wipe the migration
   history; otherwise add a new file).
3. **Better path** for additive changes: hand-write the new migration
   file; do not regenerate `0000_0001_initial_schema.sql`. This keeps
   the migration history stable.

---

## Common dev tasks

### "I want to add a new spot type"

`SpotType` is `"Plaza" | "DIY" | "Stair" | "Bowl" | "Park" | "Ledges" | "Pools"`.

1. Add the variant to `SpotTypeSchema` in `src/lib/schemas/spot.ts`.
2. Add the same variant to the `spot_type` PG enum in
   `supabase/migrations/0000_0001_initial_schema.sql` (or a new
   migration if you want to preserve history).
3. Add the variant to `spotTypeEnum` in `src/db/schema.ts`.
4. If the new type has its own UI affordance (icon, label), add it
   to `getTerrainOptions()` in `src/lib/spots.ts` and consider a
   catalog entry in `src/data.ts` (`LEGENDARY_TERRAIN`).
5. `pnpm db:apply && pnpm db:seed && pnpm test`.

### "I want to add a new field to Spot"

1. Add the field to `src/lib/types.ts` (entity) and to `SpotSchema` /
   `NewSpotSchema` / `SpotPatchSchema` in `src/lib/schemas/spot.ts`.
2. Update `src/db/schema.ts` + add a migration.
3. Update **both** `JsonSpotRepository.buildSpot` (or `create`) and
   `DrizzleSpotRepository.toRawSpot` (or `create`) to populate it.
4. Update consumers: `src/components/spot/SpotCard.tsx`,
   `src/components/spot/SpotDetailsContent.tsx`, etc.
5. `pnpm test` should still pass (add tests for the new field in the
   contract).

### "I want to change the saved-spots behavior"

1. The hook: `src/hooks/useSavedSpots.ts` (server-fed + async toggle
   + rollback).
2. The interface: `src/lib/repositories/saved-spots-repository.ts`.
3. The implementations: `json-saved-spots-repository.ts` (in-memory)
   and `drizzle-saved-spots-repository.ts` (DB).
4. The Server Actions: `src/app/actions/saved-spots.ts`
   (`toggleSavedAction`, `listSavedSpotsAction`).
5. The tests: `src/hooks/useSavedSpots.test.tsx` mocks the Server Action
   with `vi.mock("@/app/actions/saved-spots", ...)`.

### "I want to add a new Server Action"

1. Create or extend a file in `src/app/actions/`. Mark it
   `"use server"` at the top.
2. Validate inputs with the existing Zod schemas (or a new one in
   `src/lib/schemas/`).
3. Call `getSpotRepositoryAsync()` (or the event / saved-spots variant)
   for the write.
4. `revalidateTag("spots", "max")` (or the relevant tag) so RSC
   consumers pick up the change.
5. For file uploads, accept `FormData` and call
   `uploadSpotImage(file, futureId)` first, then `repo.create({ id: futureId, imagePath, ... })`.
6. Test the action with the contract test pattern (mock the repo).

---

## Troubleshooting

### "The build crashes with `SyntaxError: ... does not provide an export named 'styleText'`"

`rolldown` (bundled with Vitest 4 / Vite 8 / Next 16) imports `styleText`
from `node:util`, which was added in Node 20.12 / 21.2. Your system
`node` is too old.

**Quick fix**: use a newer Node on this machine.

```bash
# If you have nvm
nvm install 22
nvm use 22
pnpm dev   # works

# Or use the .nvm/ versions already on this box
PATH=~/.nvm/versions/node/v20.19.0/bin:$PATH pnpm dev
```

**Permanent fix**: add a `.nvmrc` with `22` (or `20.19.0`) and an
`engines.node` field to `package.json`. Not done in this repo to keep
the install footprint minimal — file an issue if you want it.

### "The build crashes with `Uncached data was accessed outside of <Suspense>` on `/_not-found`"

This was the Phase 1 fix in `src/app/layout.tsx`: the root layout
splits into a sync `RootLayout` and an async `RootDataProviders`
inside `<Suspense fallback={null}>`. If you accidentally inline a new
`await cookies()` / `await headers()` at the top of `RootLayout`,
you'll reintroduce this. Keep all `await`-of-`next/headers` calls
inside the `RootDataProviders` child.

### "My dev server can't connect to the DB"

```bash
pnpm db:health   # tells you exactly what's wrong
```

- **`ok=false, error=...timeout...`** — docker is not running, or
  `DATABASE_URL` is wrong. Check `docker compose ps` and `.env.local`.
- **`ok=false, error=...password...`** — wrong password in
  `DATABASE_URL` or `SUPABASE_DIRECT_URL`. Reset the Supabase DB
  password from the dashboard.
- **`db_not_configured`** — `SUPABASE_URL` or `DB_CONNETION_STRING`
  is missing. Both must be set for `SPOTS_DATA_SOURCE=db`.
- **`ok=true` but the app still shows the JSON fallback** —
  `getLastRepositoryContext().reason` will be set. Check the server
  logs for the `repositories.db_unhealthy_falling_back_to_json` event.

### "My tests fail with `Failed to resolve import 'server-only'`"

The vitest alias in `vitest.config.ts` maps `server-only` →
`test/server-only.ts` (a stub). If the alias is missing (or
`test/server-only.ts` got deleted), re-add it:

```ts
// vitest.config.ts
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
    "server-only": path.resolve(__dirname, "./test/server-only.ts"),
  },
},
```

### "My dev server is on the wrong port"

`PORT=3001 pnpm dev` (or edit `next.config.mjs`). The CI / health-check
expect 3000.

### "I see `Node.js 20 and below are deprecated` warnings"

Same root cause as the `styleText` error above — switch to Node 22
or 20.19+. The warning is from `@supabase/supabase-js` and is non-blocking.

### "My `pnpm build` is slow"

Turbopack's first run is slow (it compiles every route). Subsequent
runs use the `.next/cache`. If you need a quick build, run
`pnpm typecheck && pnpm lint && pnpm test` first to catch errors
without paying the full build cost.

### "The seed is showing wrong counts"

`pnpm db:seed` is idempotent. If the counts differ from the
expected `24 / 11 / 5`, your `spots.json` or `sport-events.json`
has been edited, or a prior seed left orphan rows. Wipe and reseed:

```sql
truncate spots, sport_events, country_regions, saved_spots, profiles cascade;
```

Then `pnpm db:seed`.

---

## Where to look next

| You want to… | Read |
|---|---|
| Understand the full engineering roadmap | [`SPEC.md`](./SPEC.md) |
| Resume work (read first when picking up the project) | [`SPEC_STATUS.md`](./SPEC_STATUS.md) |
| Understand the frozen UI / design contract | [`DESIGN.md`](./DESIGN.md) |
| Deploy to Vercel + Supabase | [`DEPLOY.md`](./DEPLOY.md) |
| Pull in role-specific skills (agent editors) | [`.agents/skills/`](./.agents/skills/) |
| See what the production build emits | `pnpm build && cat .next/build-manifest.json` |
| Find every call site of a function | `rg <symbol> src/` (the `ripgrep` config in `.agents/`) |
| Look up a domain concept | `SPEC.md` §3 (Favorites), §4 (Stage A), §8.13 (Data model) |
