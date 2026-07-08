-- Backfill the new FK / temporal columns added in 0006 from the legacy
-- columns, populate the join tables, create the sport_events_with_status
-- view, then lock the new columns down with NOT NULL / DEFAULT.
--
-- This file is hand-written and NOT tracked by the drizzle journal
-- (apply-sql.ts still runs and records it in schema_migrations). It must
-- run AFTER 0006_add_backfill_target_columns.sql so the target columns
-- exist. It is safe to re-run: every UPDATE is idempotent (re-derives
-- from the legacy columns), and every ALTER ... SET NOT NULL is a no-op
-- if the column is already NOT NULL.

-- ─── spots: type_slug, country_code ─────────────────────────────────────

UPDATE "spots" AS s
SET "type_slug" = lower(s."type"::text)
WHERE s."type_slug" IS NULL;
--> statement-breakpoint

UPDATE "spots" AS s
SET "country_code" = c."iso2"
FROM "countries" AS c
WHERE c."name" = s."country"
  AND s."country_code" IS NULL;
--> statement-breakpoint

ALTER TABLE "spots" ALTER COLUMN "type_slug" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "spots" ALTER COLUMN "country_code" SET NOT NULL;
--> statement-breakpoint

-- ─── sport_events: tier_slug, country_code_fk, start_at, end_at, featured_v2, created_by ───

UPDATE "sport_events" AS se
SET "tier_slug" = se."tier"::text
WHERE se."tier_slug" IS NULL;
--> statement-breakpoint

UPDATE "sport_events" AS se
SET "country_code_fk" = upper(se."country_code")
WHERE se."country_code" IS NOT NULL
  AND se."country_code_fk" IS NULL;
--> statement-breakpoint

UPDATE "sport_events" AS se
SET "country_code_fk" = c."iso2"
FROM "countries" AS c
WHERE c."name" = se."country"
  AND se."country_code_fk" IS NULL;
--> statement-breakpoint

UPDATE "sport_events" AS se
SET "start_at" = (se."start_date" || ' 00:00:00+00')::timestamptz
WHERE se."start_at" IS NULL
  AND se."start_date" IS NOT NULL;
--> statement-breakpoint

UPDATE "sport_events" AS se
SET "end_at" = (se."end_date" || ' 00:00:00+00')::timestamptz
WHERE se."end_at" IS NULL
  AND se."end_date" IS NOT NULL;
--> statement-breakpoint

UPDATE "sport_events" AS se
SET "featured_v2" = (se."featured" = 'true')
WHERE se."featured_v2" IS NULL;
--> statement-breakpoint

ALTER TABLE "sport_events" ALTER COLUMN "tier_slug" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "sport_events" ALTER COLUMN "country_code_fk" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "sport_events" ALTER COLUMN "start_at" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "sport_events" ALTER COLUMN "featured_v2" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "sport_events" ALTER COLUMN "featured_v2" SET DEFAULT false;
--> statement-breakpoint

-- ─── Join tables: backfill from the legacy text[] / enum[] columns ──────

-- spot_sports: enum values are title-cased; slugs are lowercased.
INSERT INTO "spot_sports" ("spot_id", "discipline_slug")
SELECT s."id", lower(d."sport"::text)
FROM "spots" AS s,
     unnest(s."sports"::text[]) AS d("sport")
WHERE NOT EXISTS (
  SELECT 1 FROM "spot_sports" ss
  WHERE ss."spot_id" = s."id" AND ss."discipline_slug" = lower(d."sport"::text)
);
--> statement-breakpoint

-- spot_feature_links: legacy features are title-cased free text; normalize
-- to slugs and only insert where a matching spot_features row exists (any
-- legacy feature without a seeded slug is silently dropped — the legacy
-- text[] column is the source of truth until the Phase 4 cutover).
INSERT INTO "spot_feature_links" ("spot_id", "feature_slug")
SELECT s."id", lower(replace(f."feature", ' ', '-')) AS slug
FROM "spots" AS s,
     unnest(s."features") AS f("feature")
WHERE lower(replace(f."feature", ' ', '-')) IN (SELECT "slug" FROM "spot_features")
  AND NOT EXISTS (
    SELECT 1 FROM "spot_feature_links" sfl
    WHERE sfl."spot_id" = s."id"
      AND sfl."feature_slug" = lower(replace(f."feature", ' ', '-'))
  );
--> statement-breakpoint

-- event_sports: enum values map to slugs via lower().
INSERT INTO "event_sports" ("event_id", "discipline_slug")
SELECT se."id", lower(d."sport"::text)
FROM "sport_events" AS se,
     unnest(se."sports"::sport_discipline[]) AS d("sport")
WHERE NOT EXISTS (
  SELECT 1 FROM "event_sports" es
  WHERE es."event_id" = se."id" AND es."discipline_slug" = lower(d."sport"::text)
);
--> statement-breakpoint

-- ─── sport_events_with_status view ─────────────────────────────────────

-- Exposes the target SportEvent shape (sports aggregated from event_sports,
-- featured aliased from the temp featured_v2 column, plus a computed
-- status). Phase 4 will drop the legacy columns and update the view to
-- reference the renamed `featured` column directly.
CREATE OR REPLACE VIEW "sport_events_with_status" AS
SELECT
  se."id",
  se."slug",
  se."name",
  se."short_name",
  se."url",
  se."image",
  se."description",
  COALESCE(
    (SELECT array_agg(es."discipline_slug" ORDER BY es."discipline_slug")
     FROM "event_sports" es WHERE es."event_id" = se."id"),
    '{}'::text[]
  ) AS "sports",
  se."tier_slug",
  se."country_code_fk" AS "country_code",
  se."city",
  se."venue",
  se."location",
  se."start_at",
  se."end_at",
  se."featured_v2" AS "featured",
  se."created_by",
  se."created_at",
  se."updated_at",
  CASE
    WHEN se."start_at" IS NULL THEN 'unknown'
    WHEN now() < se."start_at" THEN 'upcoming'
    WHEN se."end_at" IS NULL AND se."start_at" <= now() THEN 'live'
    WHEN now() <= se."end_at" THEN 'live'
    ELSE 'completed'
  END AS "status"
FROM "sport_events" se;
