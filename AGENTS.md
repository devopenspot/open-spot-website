# AGENTS.md

Guidance for OpenCode sessions working in this repo. Focus on facts a coding agent
would otherwise miss. Repo-agnostic best practices live in skills under
`.agents/skills/` — load the matching skill (e.g. `next-best-practices`,
`drizzle`, `supabase`, `frontend-design`, `accessibility`) instead of restating
it here.

## Discovery — prefer the knowledge graph

`codebase-memory-mcp` is configured. Project name:
`Users-gabrielalfonso-Development-Personal-Projects-open-spot-website` (pass to
every `search_graph` / `trace_path` / `get_code_snippet` / `get_architecture` call).
Prefer it over `grep`/`glob` for finding functions, call sites, route handlers,
and architecture. Fall back to grep for string literals, SQL, env keys, and
non-code files (`.env*`, YAML, SQL, shell).

## Stack at a glance

- **Next.js 16 App Router** with `cacheComponents: true` (PPR /
  Cache Components). React 19 RC. Tailwind 4 (no tailwind.config — design
  tokens live in CSS via `globals.css`).
- **Server-only data**: Drizzle ORM + `postgres-js` against Supabase
  Postgres. The build is DB-free; the runtime reads through `getDatabaseUrl()`
  in `src/lib/env.ts`.
- **Auth + storage**: `@supabase/ssr`; proxy at `src/proxy.ts` refreshes the
  cookie JWT on every request via `supabase.auth.getClaims()`. Admin client
  (`sb_secret_…`) only used server-side for `public.profiles` upserts.
- **Deploy**: Vercel. There is no CI workflow in this repo.
- **Tests**: Vitest 4 + happy-dom. Single test entry: `pnpm test`.

## Commands

All commands are run with `pnpm`.

- `pnpm dev` — `next dev`
- `pnpm build` — `next build` (DB-free, no env required)
- `pnpm start` — `next start`
- `pnpm lint` — `eslint src` (custom config strips ~22 `react/*` rules;
  see `eslint.config.mjs` `REACT_RULES_TO_SKIP`)
- `pnpm typecheck` — `tsc --noEmit` (strict, `noUncheckedIndexedAccess`,
  `noUnusedLocals`, `noUnusedParameters` all on)
- `pnpm test` — `vitest run` (one-shot, NOT watch). `pnpm test:watch` for watch.
- `pnpm db:generate` / `db:push` / `db:migrate` / `db:studio` — `drizzle-kit`
- `pnpm db:seed` — `tsx src/db/seed.ts` (idempotent; re-run any time)
- `pnpm db:health` — `tsx src/db/health-cli.ts`
- `pnpm db:apply` / `db:deploy` — `tsx src/db/apply-sql.ts` (splits
  `supabase/migrations/*.sql` on `--> statement-breakpoint`; records in
  `schema_migrations`). Run from a local machine; not part of the build or
  deploy pipeline.

Pre-push local check: `pnpm typecheck && pnpm lint && pnpm test`.

## Environment variables

Single source of truth: `src/lib/env.ts` (Zod schema, `passthrough()`).
`.env*` is gitignored except `.env.example`. Local dev uses `.env.local`
(override) and `.env` (defaults); both are loaded by `src/db/load-env.ts`.
Never commit secrets.

**Postgres URL resolution order** (`getDatabaseUrl()`):

1. `SUPABASE_DATABASE_URL` — pgBouncer **Transaction** pooler, port 6543.
   The runtime default and the only thing reachable from Vercel
   (the Vercel function network cannot resolve `db.<project>.supabase.co`).
2. `SUPABASE_DIRECT_URL` — direct, port 5432. Local-only — used by
   `drizzle.config.ts` for DDL (the pooler is unsafe for migrations). Not
   reachable from Vercel, so do not set it there.

`drizzle-kit` (`drizzle.config.ts`) reads `SUPABASE_DIRECT_URL` directly —
it does not go through `getDatabaseUrl()`.

**Supabase keys**: the new publishable/secret keys replace the legacy
`anon` / `service_role` JWTs. The runtime reads:
- `NEXT_PUBLIC_SUPABASE_URL` — project URL. Used by the SSR client, the
  proxy, and `getAdminClient()` (Next inlines it for server code).
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (browser-safe, `sb_publishable_…`)
- `SUPABASE_SECRET_KEY` (server-only, `sb_secret_…`) — never prefix with
  `NEXT_PUBLIC_`

**The dev placeholder user** (`id === "dev"`) is first-class in
`saved_spots` — the column is `text`, not `uuid`. When Supabase is
unconfigured, the dev user is auto-admin (see `isAdminUser` in
`src/lib/admin.ts`).

This is a single-package repo (not a monorepo). `pnpm-workspace.yaml`
exists only to set the `allowBuilds` allowlist (`esbuild`, `sharp`,
`unrs-resolver`) — it is not a workspace manifest.

## Repo layout (high-signal only)

- `src/app/` — App Router pages and Server Actions.
  - `actions/` — Server Actions (`spots.ts`, `saved-spots.ts`,
    `admin-spots.ts`, `admin-events.ts`). Co-located `*.test.ts`.
  - `admin/` — admin pages and `AdminLayout` (gated by `requireAdmin`).
  - `api/` — Route Handlers (`auth/`, `geocode/`, `health/`).
- `src/proxy.ts` — Next.js proxy (NOT `middleware.ts`; Next 16 renamed it).
- `src/components/` — feature-grouped (`admin/`, `explore/`, `map/`,
  `spot/`, `layout/`, `ui/`, `search/`, `saved/`, `sport-events/`,
  `feedback/`, `post/`).
- `src/lib/`
  - `repositories/` — Drizzle repository implementations behind interfaces
    (`getSpotRepositoryAsync()`, `getSavedSpotsRepositoryAsync()`,
    `getPresetImagesRepositoryAsync()`, `getEventRepositoryAsync()`).
    These are the canonical data access path — don't import `db/client`
    from components/pages.
  - `db/client.ts` — Drizzle client (server-only).
  - `supabase/server.ts` — SSR client.
  - `auth.ts` / `auth/server.ts` — session, `getServerUserFromCookies`,
    `getAdminClient`.
  - `weather/` — OpenWeather current/forecast bundle (`getWeatherForAllSpots`).
  - `geocode/` — Nominatim wrapper (`/api/geocode`).
  - `schemas/` — Zod schemas for spot/event inputs.
- `src/db/` — Drizzle `schema.ts`, seed (`seed.ts` + `seed-data/`),
  one-shot scripts (`backfill-empty-spot-images.ts`).
- `src/hooks/`, `src/stores/` (Zustand), `src/types/`.
- `test/server-only.ts` — vitest stub for the `server-only` package
  (see Testing gotchas below).
- `supabase/migrations/` — Drizzle-kit-generated SQL. Apply with
  `pnpm db:apply`, not by pasting into the dashboard.

## Conventions

- **Path alias**: `@/*` → `./src/*` (see `tsconfig.json`).
- **Server Actions** are the default for mutations; reserve Route
  Handlers for things that need a different HTTP shape.
- **Repositories** are async factories (`getSpotRepositoryAsync()` etc.)
  in `src/lib/repositories`. Call them in Server Components and Server
  Actions, never in client components.
- **SpotsProvider** (`src/components/layout/SpotsProvider.tsx`) seeds
  initial server data into the client store. Pass server-fetched
  collections as `initial*` props; don't re-fetch them client-side.
- **Zustand stores** under `src/stores/`; persistence helpers in
  `persist-helpers.ts`. `HydrationGate.tsx` is the canonical
  SSR/CSR hydration gate.
- **No comments unless asked** (repo rule). Existing `//` comments
  document non-obvious invariants (env quirks, migration splits,
  pooler gotchas) — keep those when editing nearby code.
- **No client-side DB imports.** The Drizzle client and the admin
  Supabase client are server-only.
- **Never commit `.env*` files.** The repo `.gitignore` already excludes
  them.

## Testing gotchas

- `test/server-only.ts` is a vitest alias stub for the `server-only`
  package (which throws at import time when bundled for the client).
  Pulled in transitively by `repositories/`, `supabase/server`, and
  `src/proxy.ts`. Do **not** remove the alias in `vitest.config.ts` —
  server-only import tests will break.
- Environment: `happy-dom`, not jsdom.
- Setup file: `vitest.setup.ts` imports `@testing-library/jest-dom/vitest`
  for matchers.
- Test files live next to source: `src/**/*.{test,spec}.{ts,tsx}`.
  Co-located `*.test.ts` for `src/lib/auth.ts`, `src/lib/admin.ts`,
  `src/lib/repositories/*`, and `src/app/actions/*` is the established
  pattern.
- Tests must be runnable without a live DB — do not call real Drizzle
  repos from tests; instantiate in-memory fakes or stub the repo factory.

## Where to look when confused

- Deploy / Vercel env / pooler mode / bucket policies → `DEPLOY.md`.
- Brand, color, typography, spacing, component rules → `DESIGN.md`.
- Env-var schema and resolution order → `src/lib/env.ts`.
- DB schema → `src/db/schema.ts` + latest `supabase/migrations/*.sql`.
- Skills (load via the skill tool) → `.agents/skills/`. The most
  relevant here: `next-best-practices`, `next-cache-components`,
  `react-best-practices`, `drizzle`, `supabase`,
  `supabase-postgres-best-practices`, `frontend-design`,
  `composition-patterns`, `accessibility`, `seo`, `tailwind-css-patterns`,
  `typescript-advanced-types`.
