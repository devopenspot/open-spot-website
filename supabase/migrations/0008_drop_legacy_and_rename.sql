-- 0008: Phase 4 — drop legacy columns, rename temp columns to final names,
-- replace the view, drop the country_regions table and the three enums.
--
-- This file is hand-written and NOT tracked by the drizzle journal. It
-- must run AFTER 0007_backfill_and_view.sql so the backfilled data is
-- in place. Every statement is idempotent in effect (renames + drops are
-- no-ops on a DB that already ran this file, except the DROP statements
-- which would error — apply-sql.ts records the file in schema_migrations
-- and skips it on re-runs).

-- ─── Free the names that the renames will claim ───────────────────────
-- The temp-named columns (`country_code_fk`, `featured_v2`) share names
-- with the legacy text columns (`country_code`, `featured`). Drop the
-- legacy text columns first so the renames don't collide.

ALTER TABLE "sport_events" DROP COLUMN "country_code";
--> statement-breakpoint
ALTER TABLE "sport_events" DROP COLUMN "featured";
--> statement-breakpoint

-- ─── Rename the temp columns to their final names (preserves data) ───

ALTER TABLE "sport_events" RENAME COLUMN "country_code_fk" TO "country_code";
--> statement-breakpoint
ALTER TABLE "sport_events" RENAME COLUMN "featured_v2" TO "featured";
--> statement-breakpoint

-- Rename the index that referenced the old column name. The index
-- definition follows the column automatically, but the index *name*
-- still says "country_code_fk".

ALTER INDEX "sport_events_country_code_fk_idx" RENAME TO "sport_events_country_code_idx";
--> statement-breakpoint

-- ─── Drop the remaining legacy sport_events columns ─────────────────

ALTER TABLE "sport_events" DROP COLUMN "start_date";
--> statement-breakpoint
ALTER TABLE "sport_events" DROP COLUMN "end_date";
--> statement-breakpoint
ALTER TABLE "sport_events" DROP COLUMN "country";
--> statement-breakpoint
ALTER TABLE "sport_events" DROP COLUMN "tier";
--> statement-breakpoint
ALTER TABLE "sport_events" DROP COLUMN "sports";
--> statement-breakpoint

-- ─── Drop legacy spots columns ──────────────────────────────────────

ALTER TABLE "spots" DROP COLUMN "type";
--> statement-breakpoint
ALTER TABLE "spots" DROP COLUMN "features";
--> statement-breakpoint
ALTER TABLE "spots" DROP COLUMN "sports";
--> statement-breakpoint
ALTER TABLE "spots" DROP COLUMN "country";
--> statement-breakpoint

-- ─── Replace the view to reference the renamed columns ─────────────

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
  se."country_code",
  se."city",
  se."venue",
  se."location",
  se."start_at",
  se."end_at",
  se."featured",
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
--> statement-breakpoint

-- ─── Drop the country_regions table (fake lookup, replaced by regions+countries) ─

DROP TABLE "country_regions";
--> statement-breakpoint

-- ─── Drop the three Postgres enums (replaced by lookup tables) ─────

DROP TYPE "spot_type";
--> statement-breakpoint
DROP TYPE "sport_discipline";
--> statement-breakpoint
DROP TYPE "sport_event_tier";
