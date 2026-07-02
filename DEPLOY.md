# Deploy

> Promotes the Open Spot app from a local `pnpm dev` to a live Vercel deploy
> backed by Supabase (Postgres + PostGIS + Auth + Storage).
>
> The CI workflow (`.github/workflows/ci.yml`) already runs `typecheck + lint +
> test + (when migrations change) pnpm db:apply` on every push to `main`.
> The operator steps below are the one-time Supabase / Vercel setup + the
> "I changed a migration" path.

## Pre-requisites

- A Supabase project on the Pro plan (Free tier supports PostGIS; Pro is
  required for production scale per `SPEC.md` §11 risk #8).
- A Vercel project connected to this repo.
- `pnpm` 11+ locally; Node 22+ (the CI pins Node 22).

## Step 1 — One-time Supabase setup

### 1.1 Enable the PostGIS extension

If your project is fresh, run in the Supabase SQL editor:

```sql
create extension if not exists postgis;
```

The migration `0000_0001_initial_schema.sql` assumes the extension is
present. Subsequent migrations are idempotent.

### 1.2 Create the `spot-images` storage bucket

**Dashboard route** (recommended for the first time):

1. Supabase dashboard → Storage → **New bucket**.
2. Name: `spot-images`.
3. **Public bucket**: leave OFF — the bucket is private. All reads go
   through 1-hour signed URLs.
4. File size limit: 5 MB (matches the client-side check in
   `src/components/post/PostForm.tsx`).
5. Allowed MIME types: `image/png, image/jpeg, image/webp`.

The RLS policies for the bucket already exist in
`supabase/migrations/0002_rls_policies.sql` and will be applied by
`pnpm db:deploy` in step 2.3. They scope reads/writes by `auth.uid()` —
each user's uploads live under `spots/{their-uuid}/…`.

**CLI alternative** (once `supabase` is on the PATH):

```bash
supabase storage create spot-images --public=false
```

### 1.3 Create the first admin user

1. Supabase dashboard → Authentication → **Add user** → **Create new user**.
2. Email + password. This user is what you'll sign in as on the live site.
3. After first sign-in, the `/auth/callback` route upserts a `profiles`
   row automatically.

## Step 2 — Local env + migration promotion

### 2.1 Fill in `.env.local`

Copy `.env.example` to `.env.local` and set the Supabase section:

```bash
cp .env.example .env.local
# then edit .env.local with:
#   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
#   SUPABASE_SECRET_KEY=<service-role>            # server-only
#   SUPABASE_DIRECT_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
#   APP_URL=https://<your-prod-domain>
#   SPOTS_DATA_SOURCE=db
```

The two Supabase connection URLs are at:
**Project → Settings → Database → Connection string → URI** — toggle
**Transaction** vs **Session** mode. Use **Session** (port 5432) for
`SUPABASE_DIRECT_URL`; the **Transaction** pooler (port 6543) is reserved
for the runtime Drizzle client when the load requires it.

### 2.2 Verify the wiring

```bash
pnpm db:health   # ok=true, latencyMs < 2s
pnpm db:seed     # idempotent — 24/11/5
pnpm test        # 58/58
pnpm build       # 31/31 routes
```

### 2.3 Promote migrations to production

The custom `db:apply` runner is more robust than `drizzle-kit migrate`
for our SQL-only migrations (it splits on drizzle's
`--> statement-breakpoint` and tracks applied IDs in `schema_migrations`).

```bash
pnpm db:deploy   # alias for `pnpm db:apply` — reads SUPABASE_DIRECT_URL
```

Expected output:

```
✓ 0000_0001_initial_schema.sql (already applied)
→ applying 0001_postgis_indexes_and_search.sql
✓ 0001_postgis_indexes_and_search.sql (applied)
→ applying 0002_rls_policies.sql
✓ 0002_rls_policies.sql (applied)
```

After the first run, every subsequent `pnpm db:deploy` should report
"already applied" for all files. If a new migration lands in
`supabase/migrations/`, `pnpm db:deploy` applies it.

> **Note:** the CI workflow runs `pnpm db:apply` (the same runner) against
> the staging Supabase project on every push to `main` that touches
> `supabase/migrations/**`. So CI is the safety net — if you forget to
> run `pnpm db:deploy`, CI catches it.

## Step 3 — Vercel env

In **Project → Settings → Environment Variables**, add the following.
Mark each one with the scope that applies (Production / Preview /
Development — usually all three unless noted).

| Variable | Required | Scope | Notes |
|---|---|---|---|
| `APP_URL` | yes | all | e.g. `https://openspot.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | all | browser-visible |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | all | browser-visible |
| `SUPABASE_SECRET_KEY` | yes | all | **server-only** — never `NEXT_PUBLIC_` |
| `SUPABASE_DIRECT_URL` | yes | all | session-mode Postgres, port 5432 |
| `SUPABASE_STORAGE_BUCKET_SPOTS` | no | all | defaults to `spot-images` |
| `SPOTS_DATA_SOURCE` | yes | all | `db` in production, `json` is fine for preview if you don't want the DB on every PR |
| `URL_WEATHER` | yes | all | OpenWeather base |
| `URL_WEATHER_IMG` | yes | all | OpenWeather icon base |
| `API_KEY_WEATHER` | yes | all | OpenWeather key |
| `REVALIDATE_SECRET` | yes | all | any non-empty string |
| `NOMINATIM_URL` | no | all | defaults to `https://nominatim.openstreetmap.org` |
| `NOMINATIM_USER_AGENT` | no | all | descriptive UA (Nominatim requirement) |

Preview deployments can use a **second Supabase project** for safety:
just point `SUPABASE_DIRECT_URL` + the auth + bucket vars at a staging
project via a [Vercel Environment Group](https://vercel.com/docs/environment-variables/environment-groups).

## Step 4 — Deploy

Push to `main`. Vercel builds with `pnpm build`. If the build is green
and the migrations are in place, the site is live.

Smoke-test on the preview URL:

```bash
curl -sI https://<your-domain>/                    # 200
curl -sI https://<your-domain>/explore             # 200
curl -s  https://<your-domain>/api/health | jq .   # ok=true
```

Then sign in end-to-end:

1. Visit `https://<your-domain>/login`.
2. Enter the email from step 1.3.
3. Open the magic link from the inbox.
4. The `/auth/callback` route exchanges the code for a session cookie and
   upserts a `profiles` row.

## Local development

```bash
# 1. Start the local Postgres (PostGIS in docker)
docker compose up -d infra-db

# 2. Install deps + apply migrations + seed
pnpm install
pnpm db:apply
pnpm db:seed

# 3. Dev server
pnpm dev    # http://localhost:3000
```

For a no-DB local run, leave `SPOTS_DATA_SOURCE=json` in `.env.local`
(the default). The app reads `src/data/spots.json` and the in-process
saved-spots JSON; no migrations or seed required.

## Adding a new migration

1. Write the SQL into `supabase/migrations/NNNN_short_name.sql` —
   drizzle's `--> statement-breakpoint` separator between statements is
   required.
2. Test locally: `pnpm db:apply` (idempotent — only the new file runs).
3. Push to a branch — CI applies it to the staging project automatically.
4. Merge to `main` and run `pnpm db:deploy` against production.
5. Update `SPEC_STATUS.md` if the migration changes a stage's status.

## Rollback

- **App-only rollback** (UI bug): Vercel → Deployments → click the
  previous green deployment → **Promote to Production**. Database is
  untouched.
- **Migration rollback**: write a down migration in
  `supabase/migrations/NNNN_short_name.down.sql` and apply it via `psql
  "$SUPABASE_DIRECT_URL" -f …`. The `schema_migrations` table only
  tracks forward migrations; mark the down migration's ID as applied
  manually to keep idempotency honest:
  `psql … -c "insert into schema_migrations (id) values ('NNNN_short_name')"`.
- **Full DB restore**: Supabase dashboard → **Settings → Database →
  Backups** → restore to a point in time. This rolls back the entire
  project; coordinate with the rest of the team.

## Observability

- `GET /api/health` returns `{ ok, db: { ok, latencyMs }, version }`.
  Wire this to an external uptime check (Vercel, BetterUptime, etc.).
- DB query failures are logged via `src/lib/log.ts` with the
  `db.query_failed` event name + `{ requestId, sql, durationMs,
  errorCode, errorMessage }`. The `X-Data-Source: fallback` response
  header is tracked in `getLastRepositoryContext()` but is not yet
  surfaced to the wire (Next 16's `next/headers` doesn't allow
  setting response headers from a page). Follow-up: a `middleware.ts`
  matcher that copies the value across.
