# Deploying to Vercel

The runtime is fully dynamic and reads exclusively from Postgres via Drizzle. The build is DB-free, so the only thing that has to be reachable at request time is the `SUPABASE_DATABASE_URL` Postgres endpoint (the pgBouncer Transaction pooler). Migrations are run manually from a local machine via `pnpm db:apply`; there is no CI pipeline.

## 1. Vercel env vars

Set the following in **Project Settings → Environment Variables** for the **Production** environment (and **Preview** if you want preview deploys to talk to the same Supabase project).

| Var | Required | Source | Notes |
| --- | --- | --- | --- |
| `SUPABASE_DATABASE_URL` | yes | Supabase dashboard → Settings → Database → Connection string → **Transaction pooler** (port 6543, **Mode: Transaction**) | The pgBouncer Transaction pooler. IPv4-only, designed for serverless, and DNS-resolves from the Vercel function network. Same value you set in `.env.local` — dev and prod share the Supabase project. **Pick the Transaction mode pooler, not the Session mode pooler.** They share the same host (`aws-0-<region>.pooler.supabase.com`) and port (`6543`) but behave very differently — see the callout below. |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase dashboard → Settings → API | Public project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | Supabase dashboard → Settings → API → **Publishable key** | Browser-safe `sb_publishable_…` key. Replaces the legacy `anon` JWT. |
| `SUPABASE_SECRET_KEY` | yes (admin) | Supabase dashboard → Settings → API → **Secret key** | Server-only `sb_secret_…` key. Used by `getAdminClient()` for `public.profiles` upserts. NEVER prefix with `NEXT_PUBLIC_`. |
| `APP_URL` | yes | You choose | The deployed origin (e.g. `https://openspot.vercel.app`). Used by `metadataBase`, `sitemap.ts`, `robots.ts`. |
| `API_KEY_WEATHER` | yes (weather) | OpenWeather dashboard | Required for the live weather banner on the spot details page. |
| `NOMINATIM_USER_AGENT` | recommended | You choose | Descriptive UA with a contact channel, per the [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/). |
| `ADMIN_EMAILS` | recommended | You choose | CSV of admin Google-auth emails. Without this, the dev placeholder user is the only admin. |
| `SUPABASE_STORAGE_BUCKET_SPOTS` | optional | — | Defaults to `spot-images`. Set only if you renamed the bucket. |

### Why the pooler (and not the direct endpoint)?

The direct hostname `db.<project>.supabase.co` (port 5432) is intended for trusted environments with IP allow-listing (your laptop, a long-lived server). The Vercel function network cannot resolve that hostname (`getaddrinfo ENOTFOUND db.<project>.supabase.co`). The pooler hostname `aws-0-<region>.pooler.supabase.com` (port 6543) is on different infrastructure — IPv4-only, designed for serverless, and DNS-resolves from Vercel. Same Postgres, same RLS, same schema — just a different endpoint. The `postgres-js` client config (`prepare: false`, `ssl: "require"`, `max: 5`, `idle_timeout: 30`) is already pooler-compatible.

### Pick Transaction mode, not Session mode

The Supabase dashboard exposes two pooler modes at the same host and port:

- **Transaction** — pgBouncer releases the server connection back to the pool after each SQL transaction. Many client connections can share a small server pool. This is the only mode that works for serverless.
- **Session** — pgBouncer holds the server connection for the entire client session. Default `pool_size: 15` on Supabase Pro. A single long-lived `postgres-js` client occupies one server connection for the lifetime of the Vercel function instance. With multiple concurrent function instances, the pool saturates and pgBouncer returns:

  ```
  (EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15
  ```

  This error looks like a connection limit issue but it's really the wrong pooler mode.

In the dashboard, open **Settings** → **Database** → **Connection string** and select **Mode: Transaction**. The connection string has the same host and port as Session — only the mode is different. If your `SUPABASE_DATABASE_URL` doesn't have `?pgbouncer=true` appended, that's a hint it may be on Session mode (Supabase appends this for Transaction).

## 2. Supabase Storage bucket

The `spot-images` bucket is **not** provisioned by this repo. Create it once in the Supabase dashboard:

1. Supabase dashboard → **Storage** → **New bucket** → name `spot-images`, set to **Public bucket** (the bucket is read by the public spot page without an authenticated request).
2. Add a policy on the `storage.objects` table that allows public read of objects in the bucket. Suggested policies (see `supabase/migrations/0000_fresh.sql` for the canonical SQL used in this repo):

   ```sql
   create policy "spot-images public read"
     on storage.objects
     for select
     to public
     using (bucket_id = 'spot-images');

   create policy "spot-images owner write"
     on storage.objects
     for insert
     to authenticated
     with check (
       bucket_id = 'spot-images'
       and (storage.foldername(name))[1] = auth.uid()::text
     );
   ```

   The repo's migrations already include these policies if you ran `pnpm db:apply`. Verify with `select * from pg_policies where schemaname = 'storage' and tablename = 'objects';`.

## 3. First deploy

1. Push to the branch Vercel watches (default: `main`).
2. Vercel runs `pnpm build`. The build is DB-free — no env vars are needed for the build to succeed.
3. On the first request, the Vercel function connects to `SUPABASE_DATABASE_URL` (the pooler) and serves the page. The function's egress must be able to reach the Supabase pooler endpoint (port 6543, hostname `aws-0-<region>.pooler.supabase.com`).
4. Smoke-test `/`, `/explore`, `/map`, `/saved`, `/sport-events`, `/spots/<id>`, `/admin`, `/sitemap.xml`.

## 4. Local dev vs Vercel

Both environments set the same env vars to the same values:

- `.env.local` is gitignored. Set `SUPABASE_DATABASE_URL` and the four Supabase keys there.
- Vercel env vars mirror `.env.local`.
- `pnpm db:seed`, `pnpm db:apply`, `pnpm db:health` read the same `SUPABASE_DATABASE_URL` (via `getDatabaseUrl()` in `src/lib/env.ts`). Run them from the dev console only — they are not part of the build or deploy pipeline.
- For local migrations that benefit from the direct endpoint (DDL via `drizzle-kit`), set `SUPABASE_DIRECT_URL` in `.env.local` — `drizzle.config.ts` reads it directly. The direct endpoint is local-only; the Vercel function network cannot resolve its hostname.

## 5. Migrations

Migrations are authored with `pnpm db:generate` and applied with `pnpm db:apply`, both run from a local machine. There is no automated deploy step.

- **Author SQL**: edit `src/db/schema.ts`, then `pnpm db:generate` to write the next `supabase/migrations/<id>_<name>.sql` file. Commit the file.
- **Apply SQL**: from a local machine with `SUPABASE_DIRECT_URL` (or `SUPABASE_DATABASE_URL`) set, run `pnpm db:apply`. The script splits each file on `--> statement-breakpoint` and applies in a single transaction per file, recording in `schema_migrations`.

## 6. If you need to reset

- **Re-seed**: `pnpm db:seed` (idempotent upserts of regions, countries, spot types, sport disciplines, event tiers, spot features, preset images, 11 base spots, 5 base events).
- **Re-apply migrations**: `pnpm db:apply` (splits `supabase/migrations/*.sql` on `--> statement-breakpoint` and applies in a single transaction per file, recording in `schema_migrations`).
- **Health check**: `pnpm db:health` (uses the cached `checkDbHealth`; reports latency, source, and any error).
