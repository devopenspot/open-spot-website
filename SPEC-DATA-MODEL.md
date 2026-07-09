---
spec: Data Model Redesign
status: Phase 1 in progress
owner: TBD
target release: TBD
last updated: 2026-07-08
---

# SPEC — Data Model Redesign

This spec redesigns the relational data model of Open Spot so that:

1. Geography is a first-class dimension (countries + regions) instead of a
   flimsy `country_regions` text lookup and a hardcoded `src/data.ts`
   `REGIONS_DATA` constant.
2. Taxonomies (spot type, sport discipline, event tier, spot features) live in
   **lookup tables** joined through many-to-many tables, so adding a value is
   an `INSERT` and not a Postgres `ALTER TYPE` migration.
3. Event dates are real `timestamptz` columns (no more `text` `startDate`), and
   `featured` is a real `boolean` (no more `text`).
4. Location is a unified PostGIS `geometry(Point, 4326)` column shared by
   spots **and** events (today the TS interfaces differ even though the SQL
   columns are the same type).
5. `created_by` is added to `sport_events` to match `spots`; both keep hard
   deletes and no audit log (matches `SPEC.md` §2 non-goals).

It does **not** introduce a weather persistence table (weather stays cache-only,
as today), a gallery/audit-log schema, or a normalized `cities` table (city
remains denormalized on the spot/event).

> **Scope reminder.** The public UI and the Admin Dashboard are not changed
> by Phase 1. The new tables are seeded and present, but no repository,
> schema, or UI code reads them yet. Phase 1 is purely additive.
> Phase 2 is the backfill + cutover that rewires the existing `spots` /
> `sport_events` columns to the new shape.

---

## 0. Glossary

| Term | Meaning |
| --- | --- |
| **Lookup table** | A small, read-mostly table whose rows are the values of a taxonomy (e.g. every row in `spot_types` is one valid spot type). Replaces a Postgres enum. |
| **Additive phase** | A migration that only **adds** tables/columns. Safe to deploy; the app keeps reading the old columns. |
| **Cutover** | A migration that drops old columns/enums/tables after the app has been rewired to the new shape. |
| **Backfill** | The migration that copies data from old columns into the new shape before the cutover. |
| **JSON mode** | The default runtime mode (`SPOTS_DATA_SOURCE=json`) where reads come from `src/data/*.json`. The new lookup tables exist only in DB mode; the JSON repositories map the denormalized JSON into the new typed domain. |

---

## 1. Goals

1. Replace the four domain enums (`spot_type`, `sport_discipline`,
   `sport_event_tier`, plus the free `features text[]`) with lookup tables +
   join tables, so the schema is extensible without a migration per value.
2. Introduce a real `regions` + `countries` dimension that replaces
   `country_regions` and the hardcoded `src/data.ts` `REGIONS_DATA`.
3. Convert `sport_events.start_date` / `end_date` (`text`) → `start_at` /
   `end_at` (`timestamptz`) so events are range-queryable and timezone-aware,
   and compute `status` (`upcoming` / `live` / `completed`) via a SQL view
   instead of TypeScript.
4. Convert `sport_events.featured` (`text`) → `boolean`.
5. Unify the location shape across spots and events (one PostGIS
   `geometry(Point, 4326)` column, one TS `SpotLocation` shape).
6. Add `created_by` to `sport_events` to match the ownership signal on
   `spots`.
7. Keep the migration safe: additive first, backfill, then a single
   cutover that drops the old columns / enums / fake `country_regions`.

## 2. Non-goals

- Persisting weather (kept cache-only via Next `"use cache"`).
- Image galleries (kept single-image per the Admin Dashboard spec §2).
- `cities` / `admin1` as full normalized tables (city + state stay
  denormalized text on the spot/event).
- Soft delete, audit log, restore (kept per the Admin Dashboard spec §2).
- Any change to the public UI or the Admin Dashboard in Phase 1.
- Changing the JSON mode shape of `src/data/spots.json` /
  `src/data/sport-events.json` (the JSON repositories will map to the new
  typed domain in a later phase, not in this spec).

## 3. New schema (target shape)

### 3.1 Geography dimension

**`regions`** — top-level browse facet.
- `id` uuid PK · `slug` text unique not null · `name` text not null ·
  `description` text not null default `""` · `image_url` text ·
  `sort_order` int not null default `0` ·
  `created_at`/`updated_at` timestamptz default now
- Seeded from today's `REGIONS_DATA` (Americas / Europe / Asia) in
  `src/data.ts`.

**`countries`** — ISO-keyed, region-grouped.
- `iso2` text PK (e.g. `FR`) · `name` text not null unique · `iso3` text ·
  `region_id` uuid not null FK → `regions.id` (restrict) ·
  `created_at`/`updated_at` timestamptz default now
- Index: `region_id`.
- Replaces the fake `country_regions` (country PK → loose `region` text).
  The native-name overrides in `COUNTRY_NAME_OVERRIDES` move into the
  `geocode/project.ts` projection (not a DB row).

City/State stay denormalized on the spot/event row. The spot/event row
holds a `country_code` FK to `countries.iso2`.

### 3.2 Taxonomies (lookup + many-to-many)

Lookup tables (all use `slug` text PK + `name` text not null +
`sort_order` int not null default `0`):

- `spot_types` — values: `plaza`, `diy`, `stair`, `bowl`, `park`, `ledges`,
  `pools` (mirrors today's `spot_type` enum).
- `sport_disciplines` — values: `skateboard`, `bmx`, `inline`, `scooter`,
  `rollerblade`, `wakeboard`, `snowboard`, `ski` (mirrors today's
  `sport_discipline` enum).
- `event_tiers` — values: `world-tour`, `championship`, `festival`,
  `federation` (mirrors today's `sport_event_tier` enum).
- `spot_features` — free, but constrained. Seeded with a common set
  (`ledge`, `rail`, `stairs`, `manual-pad`, `flat-bar`, `pyramid`,
  `quarter-pipe`, `mini-ramp`, `bowl`, `pool`, `gap`, `hubba`, `down-rail`,
  `up-rail`, `wallride`, `bank`, `pole-jam`, `smooth-concrete`); admins
  can add more later.

Join tables (composite PK, cascade on spot/event delete, restrict on
taxonomy delete):

- `spot_sports` (spot_id FK→spots.id, discipline_slug FK→sport_disciplines.slug)
- `spot_feature_links` (spot_id FK→spots.id, feature_slug FK→spot_features.slug)
- `event_sports` (event_id FK→sport_events.id, discipline_slug FK→sport_disciplines.slug)

Index on the taxonomy side of each join table for facet aggregation.

### 3.3 Core domain (target shape, after cutover)

`spots` (cleaned; the Phase 1 schema keeps the old columns untouched and
**adds** the new ones):

- **New** `type_slug` text FK → `spot_types.slug` not null
  *(replaces the `type spot_type` enum column after the cutover)*
- **New** `country_code` text FK → `countries.iso2` not null
  *(replaces the loose `country text` column after the cutover)*
- Kept: `id`, `slug` (unique), `name`, `city`, `city_slug`, `address`,
  `features` (text[], dropped at cutover), `sports` (text[], dropped at
  cutover), `image_url`, `image_path`, `community_note`, `crowd_level`,
  `crowd_level_label`, `location` (PostGIS `geometry(Point, 4326)`),
  `created_by`, `created_at`, `updated_at`.

`sport_events` (cleaned; the Phase 1 schema adds the new columns):

- **New** `tier_slug` text FK → `event_tiers.slug` not null
  *(replaces the `tier sport_event_tier` enum column after the cutover)*
- **New** `country_code` text FK → `countries.iso2` not null
  *(replaces the loose `country text` column after the cutover)*
- **New** `start_at` timestamptz not null
  *(replaces `start_date text` after the cutover)*
- **New** `end_at` timestamptz
  *(replaces `end_date text` after the cutover)*
- **New** `featured` boolean not null default false
  *(replaces `featured text` after the cutover)*
- **New** `created_by` uuid FK → `profiles.id`
  *(new ownership signal; events had none)*
- Kept: `id`, `slug` (unique), `name`, `short_name`, `url`, `image`,
  `description`, `sports` (enum array, dropped at cutover), `city`,
  `venue`, `location` (PostGIS), `created_at`, `updated_at`.

`sport_events_with_status` (SQL view, defined in the backfill migration):

- `id`, `slug`, …, `start_at`, `end_at`,
  `status` text generated from `now() < start_at` → `upcoming` /
  `now() between start_at and end_at` → `live` / `now() > end_at` →
  `completed`.

`saved_spots` — unchanged.

`profiles` — unchanged; add `updated_at` for consistency (additive).

### 3.4 Weather

No table. Weather stays on the existing `src/lib/weather/*` path (live
OpenWeather + Next `"use cache"` keyed by `weather:spot:<id>`). This
matches today's features exactly.

## 4. Roles & access

No change. RLS for the new tables mirrors the existing patterns from
migration `0002_rls_policies.sql`:

- **Public read** on `regions`, `countries`, `spot_types`,
  `sport_disciplines`, `event_tiers`, `spot_features`.
- **Public read** on the new `spot_sports`, `spot_feature_links`,
  `event_sports` join tables (they are public via their FKs).
- Writes to lookup tables are admin-only (out of scope for Phase 1 — the
  Phase 1 RLS migration keeps lookups public-read, no-write, and leaves
  a follow-up to add a write policy).
- `spots` / `sport_events` RLS is unchanged in Phase 1.

## 5. Phased implementation

| Phase | Scope | Exit criteria | Status |
| --- | --- | --- | --- |
| 1 | **Additive.** New `regions`, `countries`, `spot_types`, `sport_disciplines`, `event_tiers`, `spot_features`, `spot_sports`, `spot_feature_links`, `event_sports` tables. Seeded. No existing column changed. | `pnpm typecheck && pnpm lint` green; `pnpm db:generate` produces a single additive migration; seed is idempotent. | **done** |
| 2 | **Backfill.** New nullable / default-backed columns on `spots` (`type_slug`, `country_code`) and `sport_events` (`tier_slug`, `country_code`, `start_at`, `end_at`, `featured`, `created_by`). Backfill from old columns (enum→slug, country name→iso2, `start_date text`→`start_at timestamptz`, `featured text`→bool, feature array→join rows, sport array→join rows). Add the `sport_events_with_status` view. RLS unchanged. | `pnpm typecheck && pnpm lint` green; a fresh DB seeded via `pnpm db:apply && pnpm db:seed` exposes both old and new columns populated. | **done** |
| 3 | **Repository cutover.** Repositories (`DrizzleSpotRepository`, `DrizzleEventRepository`, `DrizzleSavedSpotsRepository`, JSON variants) read the new shape; `NewSpotSchema` / `SpotPatchSchema` / `NewSportEventSchema` / `SportEventPatchSchema` switch to the new field names; types (`SpotLocation`, `SportEventLocation`) unify. | `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green; manual smoke test against the public UI. | **done (compat layer — D15)** |
| 4 | **Column drop + enum drop.** Migration drops the old `spots.type` enum, `spots.features`/`sports` text[], `spots.country` text, `sport_events.tier` enum, `sport_events.sports` enum[], `sport_events.start_date`/`end_date`/`featured` text, `sport_events.country` text, and the `country_regions` table + its enums. | `pnpm db:apply` runs cleanly on a fresh DB; `git grep country_regions` returns zero hits; `pnpm test` green. | **done** |
| 5 | **`src/data.ts` cleanup.** `REGIONS_DATA` / `COUNTRY_TO_REGION` / `COUNTRY_NAME_OVERRIDES` / `TERRAIN_OPTIONS` become DB-backed reads in DB mode; JSON mode keeps the current shape and maps to the new typed domain. Update AGENTS.md. | `pnpm typecheck && pnpm lint && pnpm test` green. | not started |

### 5.1 CI order

`.github/workflows/ci.yml` order is unchanged: `install --frozen-lockfile` →
`typecheck` → `lint` → `test` → `pnpm db:apply` (last only if
`supabase/migrations/**` changed). Phase 1 will introduce a new migration,
so CI's `db:apply` step will run it.

## 6. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| The new additive migration breaks the existing app because it shares a name with an old enum | Low | High | New tables are pure additions; the new FK columns are **not** added in Phase 1 (added in Phase 2 with backfill). The old enums and text[] stay untouched. |
| Country name backfill (Phase 2) loses rows whose `country` text doesn't match an `iso2` country | Medium | Low | Keep the old `country` text column until Phase 4 so unmapped rows are visible; surface a `db:seed --check` step that warns about unmapped countries. |
| `start_date` text → `start_at` timestamptz backfill (Phase 2) misparses an ambiguous date | Medium | Medium | Today's values are all `YYYY-MM-DD`; the backfill parses as `T00:00:00Z`. Add a `db:seed --validate-dates` step that flags any value that doesn't match the expected format before the migration runs. |
| The `sport_events_with_status` view (Phase 2) is computed per-query and adds cost | Low | Low | The view is simple (`CASE` over `now()`); no joins, no aggregates. The existing `sport_events` listing is already cheap. |
| `featured` text → boolean backfill treats anything non-null as true | Low | Low | Today's `featured` is the string `"true"` or `NULL`; the backfill uses `WHERE featured = 'true'` semantics. |

## 7. Decisions log

| # | Decision | Rationale | Alternatives considered |
| --- | --- | --- | --- |
| D1 | Taxonomies = lookup tables + many-to-many | Extensible without a migration; matches the existing facet pattern (`SpotFacetType`, `SportEventFacetDiscipline`) as `GROUP BY` joins | Keep Postgres enums |
| D2 | Geography = `regions` + `countries` only; city/state denormalized | Matches the current UI (city/country on the URL is enough); avoids a huge cities seed | Full hierarchy incl. `cities` / `admin1` |
| D3 | Weather = cache-only (no `weather_snapshots` table) | Matches today's features exactly; no cron / no map-weather layer in this spec | Persist snapshots |
| D4 | Images = single image (no galleries) | Matches SPEC §2 non-goal | Gallery tables now |
| D5 | Ownership = `created_by` on spots + events; hard deletes; no audit log | Matches SPEC §2 non-goals | Soft delete + audit log |
| D6 | Event `status` = SQL view, not a stored column | Always up to date; no cron to keep it in sync | Stored column refreshed by a cron |
| D7 | Phase 1 is purely additive (no new FK columns on existing tables) | Safest possible first deploy; the app keeps reading the old shape | Single big-bang migration |
| D8 | Shared PostGIS `geometryPoint` for spots **and** events | Already the case; just unify the TS interface (`SpotLocation` ≡ `SportEventLocation` shape) | Keep the hand-rolled EWKB parser per table |
| D9 | `profiles.updated_at` added (additive) for consistency | Symmetry with other tables; no app-level cost | Skip the column |
| D10 | `src/data.ts` country/region constants stay until Phase 5 | JSON mode still needs them as a fallback; moving them too early would break JSON mode in one step | Move them in Phase 1 |
| D11 | Generated migration renamed to `0005_lookup_tables_and_dimensions.sql` and the stale `sports` re-emission removed | drizzle-kit's meta journal was out of sync (only tracked `0000`), so `db:generate` re-emitted `spots.sports` (already added by `0004_spot_sports.sql`). The migration was hand-trimmed to remove the duplicate add, and the file + snapshot + journal were aligned to a stable `0005` name. The pre-existing snapshot/journal desync is a known repo condition and will be re-baselined as part of Phase 4 (column drop) cleanup. | Let the duplicate add stand; rename to keep drizzle's auto-name |
| D12 | `sport_events_with_status` is created in the hand-written 0007 as raw SQL and is **not** declared in the Drizzle schema | Avoids drizzle-kit view management (it would emit `CREATE VIEW` and fight with future regenerates). The view will be added to the Drizzle schema in Phase 3 once repositories need to query it with type safety. | Declare `pgView` in `schema.ts` and let drizzle generate it |
| D13 | `featured` and `country_code` on `sport_events` are added under **temp names** (`featured_v2`, `country_code_fk`) to avoid name collisions with the legacy text columns | Both legacy text columns must be preserved for the backfill (`featured = 'true'` → boolean; `country_code` text holds iso2 codes). A same-name `ALTER TYPE` would lose data and require a risky `USING` clause. Phase 4 drops the legacy text columns and renames the temp names to the final ones (`featured_v2` → `featured`, `country_code_fk` → `country_code`). The Drizzle schema keeps the temp names in Phase 2/3; the final rename is a Phase 4 schema + migration change. | Single `ALTER TABLE ... ALTER COLUMN ... TYPE ... USING (...)` per column |
| D14 | `country_code` on `spots` uses the **final** name directly (no temp), and `spots.type_slug` also uses the final name | No name collision on `spots` (no legacy `country_code` or `type_slug` columns), so the temp-name workaround is unnecessary there. | Use temp names everywhere for symmetry |
| D15 | Phase 3 ships a **compat layer**: the Drizzle + JSON repositories return the current TS `Spot` / `SportEvent` shape (`startDate`/`endDate` text, `location.{city,country,countryCode,venue,latitude,longitude}`, `featured: boolean`, `tier` slug, `sports` as `SportDiscipline[]`, `features` as `string[]`), but the source of truth is the new DB shape (joins to `spot_types`/`sport_disciplines`/`spot_features`/`countries`, the `start_at`/`end_at` timestamptz columns aliased to `YYYY-MM-DD` strings, `country_code_fk` joined to `countries.name` for the country display). The full field rename + location unification (drop the derived old fields, rename `startDate`→`startAt`, flatten `event.location.*` to top-level) is deferred to a follow-up "consumer cutover" phase. The Drizzle write path **dual-writes** legacy and new columns (the legacy NOT NULL columns must stay populated until Phase 4 drops them). | The full cutover would rewrite ~15+ component/form files (`EventFormFields`, `AdminNewEventForm`, `AdminEditEventForm`, `EventTable`, `loader`, `status`, etc.) and the `sport-events.json` / `src/data.ts` shape in one pass, which would break `pnpm build` and the manual smoke test (I can't run a browser locally). The compat layer makes the DB the single source of truth now, keeps tests + build green, and turns the consumer cutover into a mechanical rename pass. | Full cutover in one pass |
| D16 | The `sport_events_with_status` view is **not** added to the Drizzle schema | Adding `pgView` to `schema.ts` would make drizzle-kit emit `CREATE VIEW` in a future `db:generate`, which would fail to re-apply (the view is owned by the hand-written 0007 as `CREATE OR REPLACE VIEW`). The Drizzle event repository selects from `sport_events` directly with the needed joins + correlated subqueries, which is more flexible than the view for the repo's query shape. The view remains a DB-level convenience for raw SQL consumers. | Add `pgView` to schema.ts and let drizzle manage it |
| D17 | `sports` and `features` are aggregated into arrays via correlated subqueries in the repository's joined select, not via the view | Drizzle's `sql<string[]>\`array_agg(...)\`` correlated subquery keeps the read in a single query and lets the repo control the sort order. Same result, simpler migration story. | Read the view for `sports` |
| D18 | `featured` text→boolean is migrated by adding a temp column `featured_v2`, backfilling, then in Phase 4 the legacy text `featured` is DROPPED first and `featured_v2` is RENAMEd to `featured` (preserves data; the boolean `USING` cast would be wrong because the legacy text is `'true'`/`'false'` and a bare `USING featured::boolean` maps any non-empty string to `true`) | A single `ALTER TABLE ... ALTER COLUMN ... TYPE boolean USING (featured = 'true')` would also work but requires knowing the exact `USING` clause; the temp-name approach is uniform with the other renames and keeps the data-migration story consistent. | In-place `ALTER COLUMN TYPE boolean USING (featured = 'true')` |
| D19 | Phase 4 is hand-written, not drizzle-generated | Drizzle's auto-diff produces destructive `DROP COLUMN` + `ADD COLUMN` for the `country_code_fk`→`country_code` and `featured_v2`→`featured` renames (since the JS field names differ and drizzle doesn't detect the rename), and a wrong `ALTER COLUMN ... SET DATA TYPE boolean` on the legacy text `featured` (which would corrupt `'false'` rows). The hand-written 0008 does safe `ALTER TABLE ... RENAME COLUMN` (preserves data, preserves indexes' column references), drops the legacy columns in the correct order, replaces the view to reference the renamed columns, and drops the enums + `country_regions`. The Drizzle snapshot for 0008 is the re-baseline (D11 resolution): it's the *post-Phase-4* schema state, so the next `db:generate` is a no-op (`No schema changes, nothing to migrate`). | Trust drizzle's auto-generated diff |
| D20 | `git grep country_regions` returns zero hits in the **active** source tree (`src/`, `AGENTS.md`); the historical SQL migrations (`0000` creates the table, `0002` adds RLS, `0008` drops it) and `SPEC-DATA-MODEL.md` legitimately reference the name as part of the schema's documented lifecycle | The table is documented in the migration history and the spec; rewriting history would be misleading. The Phase 4 intent — "no live code uses the table" — is met. | Rewriting historical migrations to scrub the name |

## 8. Open questions for follow-up specs

1. **Consumer cutover (D15 follow-up).** Rename `SportEvent.startDate`/`endDate` → `startAt`/`endAt`, flatten `event.location.{city,country,countryCode,venue,latitude,longitude}` to top-level `city`/`country`/`countryCode`/`venue`/`location:{lat,lon}`, and stop deriving the old `startDate`/`endDate`/`location.*` fields in the Drizzle + JSON repositories. Touches `EventFormFields`, `AdminNewEventForm`, `AdminEditEventForm`, `EventTable`, `src/lib/sport-events/{status,loader}.ts`, `src/components/sport-events/*`, and `src/data/sport-events.json`. Pure rename + flatten; no schema change.
2. Map weather "layer" — defer until weather persistence is a real product
   ask.
3. Image galleries for spots and events — defer per SPEC §2.
4. Admin UI for managing lookup tables (add/remove spot types, features,
   countries) — out of scope here; current values come from the seed.
5. City dedup — a `(country_code, lower(city_slug))` unique index could
   prevent duplicate city pages; deferred.
6. "Promote to admin" / `is_admin` on `profiles` — out of scope; admin is
   an env allow-list per the Admin Dashboard spec §3.

## 9. File checklist (target)

### 9.1 New (this spec)

```
supabase/migrations/0005_regions_countries.sql     # Phase 1
supabase/migrations/0006_taxonomies.sql            # Phase 1
supabase/migrations/0007_join_tables.sql           # Phase 1
SPEC-DATA-MODEL.md                                 # this file
```

(Generated by `pnpm db:generate`; filenames may differ — drizzle-kit picks
its own numbering.)

### 9.2 Edited (this spec, all phases)

**Phase 1 (additive):**
```
src/db/schema.ts        # + regions, countries, spot_types, sport_disciplines, event_tiers, spot_features, spot_sports, spot_feature_links, event_sports, profiles.updated_at
src/db/seed.ts          # + seedRegions, seedCountries, seedSpotTypes, seedSportDisciplines, seedEventTiers, seedSpotFeatures
```

**Phase 2 (backfill):**
```
src/db/schema.ts        # + spots.typeSlug, spots.countryCode, sport_events.tierSlug, sport_events.countryCodeFk, sport_events.startAt, sport_events.endAt, sport_events.featuredV2, sport_events.createdBy (+ indexes)
supabase/migrations/0006_add_backfill_target_columns.sql
supabase/migrations/0007_backfill_and_view.sql
```

**Phase 3 (compat-layer repository cutover — D15):**
```
src/db/schema.ts                               # + Drizzle relations()
src/lib/repositories/spot-query.ts             # NEW: shared joined select + row mapper
src/lib/repositories/drizzle-spot-repository.ts    # rewrite: FK joins, sports/features subqueries, dual-write to spot_sports/spot_feature_links
src/lib/repositories/drizzle-event-repository.ts   # rewrite: tier_slug/country_code_fk joins, start_at/end_at, featured_v2, event_sports subquery, dual-write
src/lib/repositories/drizzle-saved-spots-repository.ts # use shared spot mapper
src/db/seed.ts                                 # fix "Smooth concrete" -> "Smooth Concrete"
```

**Phase 4 (column drop + enum drop + rename + re-baseline — D11, D18–D20):**
```
src/db/schema.ts                                   # remove spotTypeEnum/sportDisciplineEnum/sportEventTierEnum, countryRegions table, all legacy columns; rename countryCodeFk->countryCode, featuredV2->featured; update relations()
src/lib/repositories/drizzle-spot-repository.ts    # stop dual-writing legacy columns; reload via findById() after insert/update
src/lib/repositories/drizzle-event-repository.ts   # stop dual-writing legacy columns; references to countryCode (renamed) and featured (renamed)
src/db/seed.ts                                     # remove seedCountryRegions; rewrite seedSpots/seedSportEvents for new columns + spot_sports/spot_feature_links/event_sports
supabase/migrations/0008_drop_legacy_and_rename.sql  # NEW: DROP legacy text columns, RENAME temp columns, replace view, DROP country_regions, DROP enums
supabase/migrations/meta/_journal.json              # add 0008 entry; re-baseline complete (D11 resolved)
supabase/migrations/meta/0008_snapshot.json         # NEW: post-Phase-4 schema snapshot (replaces the stale 0006 snapshot's diff)
AGENTS.md                                          # update RLS line: country_regions -> regions/countries/spot_types/sport_disciplines/event_tiers/spot_features
```

### 9.3 Deferred to later phases

- `src/lib/repositories/json-spot-repository.ts` /
  `json-event-repository.ts` — no changes needed in the compat layer; the
  JSON file keeps its current shape and the JSON repos keep producing the
  current TS `Spot` / `SportEvent` domain. (A future phase can switch JSON
  mode to read from the new lookup tables / write to the new shape, but it's
  not required for the DB cutover.)
- `src/lib/schemas/spot.ts` / `event.ts` — field renames (Phase 3.5
  consumer cutover).
- `src/lib/types.ts` / `src/types/sport-events.ts` — unify location shape;
  rename `startDate`/`endDate` → `startAt`/`endAt`; `featured: boolean` is
  already boolean (Phase 3.5 consumer cutover).
- `src/data.ts` — `REGIONS_DATA` / `COUNTRY_TO_REGION` /
  `COUNTRY_NAME_OVERRIDES` / `TERRAIN_OPTIONS` move to DB-backed reads
  (Phase 5).
- `src/lib/geocode/project.ts` / `classify.ts` — use the new lookup tables
  (Phase 5).
- `sport_events.created_by` — currently always `null` on insert (no
  admin-user wiring). A future change should set it to the admin's
  `user.id` in `createEventAction` and thread it through the
  `NewSportEvent` type.
