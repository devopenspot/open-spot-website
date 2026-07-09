# Deploying to Vercel

The runtime is fully dynamic and reads exclusively from Postgres via Drizzle. The build is DB-free, so the only thing that has to be reachable at request time is the `SUPABASE_DIRECT_URL` Postgres endpoint.

## 1. Vercel env vars

Set the following in **Project Settings → Environment Variables** for the **Production** environment (and **Preview** if you want preview deploys to talk to the same Supabase project).

| Var | Required | Source | Notes |
| --- | --- | --- | --- |
| `SUPABASE_DIRECT_URL` | yes | Supabase dashboard → Settings → Database → Connection string → **Direct connection** | Port 5432 (NOT the 6543 pooler). Same value you set in `.env.local` — dev and prod share the Supabase project. |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase dashboard → Settings → API | Public project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | Supabase dashboard → Settings → API → **Publishable key** | Browser-safe `sb_publishable_…` key. Replaces the legacy `anon` JWT. |
| `SUPABASE_SECRET_KEY` | yes (admin) | Supabase dashboard → Settings → API → **Secret key** | Server-only `sb_secret_…` key. Used by `getAdminClient()` for `public.profiles` upserts. NEVER prefix with `NEXT_PUBLIC_`. |
| `APP_URL` | yes | You choose | The deployed origin (e.g. `https://openspot.vercel.app`). Used by `metadataBase`, `sitemap.ts`, `robots.ts`. |
| `API_KEY_WEATHER` | yes (weather) | OpenWeather dashboard | Required for the live weather banner on the spot details page. |
| `NOMINATIM_USER_AGENT` | recommended | You choose | Descriptive UA with a contact channel, per the [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/). |
| `ADMIN_EMAILS` | recommended | You choose | CSV of admin Google-auth emails. Without this, the dev placeholder user is the only admin. |
| `SUPABASE_STORAGE_BUCKET_SPOTS` | optional | — | Defaults to `spot-images`. Set only if you renamed the bucket. |

Legacy / optional:

- `DB_CONNETION_STRING` — legacy typo, kept for CI back-compat. Not needed on Vercel.
- `DATABASE_URL` — optional escape hatch. Not needed on Vercel.
- `SUPABASE_DATABASE_URL` — pgBouncer pooler (port 6543). Not read by the runtime today; documented only.
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — legacy names. Replaced by `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SECRET_KEY`. Not read by the runtime.

> Do **not** set `REVALIDATE_SECRET` — the weather revalidate route was removed when we moved to fully dynamic rendering.

## 2. Supabase Storage bucket

The `spot-images` bucket is **not** provisioned by this repo. Create it once in the Supabase dashboard:

1. Supabase dashboard → **Storage** → **New bucket** → name `spot-images`, set to **Public bucket** (the bucket is read by the public spot page without an authenticated request).
2. Add a policy on the `storage.objects` table that allows public read of objects in the bucket. Suggested policies (see `supabase/migrations/0000_initial_data_model.sql` for the canonical SQL used in this repo):

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
3. On the first request, the Vercel function connects to `SUPABASE_DIRECT_URL` and serves the page. The function's egress must be able to reach the Supabase direct endpoint (port 5432).
4. Smoke-test `/`, `/explore`, `/map`, `/saved`, `/sport-events`, `/spots/<id>`, `/admin`, `/sitemap.xml`.

## 4. Local dev vs Vercel

Both environments set the same env vars to the same values:

- `.env.local` is gitignored. Set `SUPABASE_DIRECT_URL` and the four Supabase keys there.
- Vercel env vars mirror `.env.local`.
- `pnpm db:seed`, `pnpm db:apply`, `pnpm db:health` read the same `SUPABASE_DIRECT_URL` (via `getDatabaseUrl()` in `src/lib/env.ts`). Run them from the dev console only — they are not part of the build or deploy pipeline.

## 5. If you need to reset

- **Re-seed**: `pnpm db:seed` (idempotent upserts of regions, countries, spot types, sport disciplines, event tiers, spot features, preset images, 11 base spots, 5 base events).
- **Re-apply migrations**: `pnpm db:apply` (splits `supabase/migrations/*.sql` on `--> statement-breakpoint` and applies in a single transaction per file, recording in `schema_migrations`).
- **Health check**: `pnpm db:health` (uses the cached `checkDbHealth`; reports latency, source, and any error).
