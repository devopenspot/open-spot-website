-- 0000_initial_data_model.sql
--
-- Single consolidated migration: the entire Open Spot data model in
-- one file. Replaces the historical 0000–0008 sequence. Run via
-- `pnpm db:apply` against a fresh database (Supabase Dashboard reset
-- or `DROP SCHEMA public CASCADE; CREATE SCHEMA public; ...`). The
-- `src/db/seed.ts` script is the single source of truth for the
-- dimension and content data; this file is pure schema.
--
-- Every statement is separated by the statement-breakpoint marker
-- (see src/db/apply-sql.ts).

-- ─── Extensions ──────────────────────────────────────────────────────
-- PostGIS is pre-installed on Supabase in the `extensions` schema;
-- this is a safety no-op.

CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint

-- ─── regions ────────────────────────────────────────────────────────
CREATE TABLE "regions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "image_url" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "regions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint

CREATE INDEX "regions_sort_order_idx" ON "regions" USING btree ("sort_order");
--> statement-breakpoint

-- ─── countries ──────────────────────────────────────────────────────
CREATE TABLE "countries" (
  "iso2" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "iso3" text,
  "region_id" uuid NOT NULL REFERENCES "regions"("id") ON DELETE restrict ON UPDATE no action,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "countries_name_unique" UNIQUE("name")
);
--> statement-breakpoint

CREATE INDEX "countries_region_idx" ON "countries" USING btree ("region_id");
--> statement-breakpoint

-- ─── spot_types ─────────────────────────────────────────────────────
CREATE TABLE "spot_types" (
  "slug" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint

CREATE INDEX "spot_types_sort_order_idx" ON "spot_types" USING btree ("sort_order");
--> statement-breakpoint

-- ─── sport_disciplines ──────────────────────────────────────────────
CREATE TABLE "sport_disciplines" (
  "slug" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint

CREATE INDEX "sport_disciplines_sort_order_idx" ON "sport_disciplines" USING btree ("sort_order");
--> statement-breakpoint

-- ─── event_tiers ────────────────────────────────────────────────────
CREATE TABLE "event_tiers" (
  "slug" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint

CREATE INDEX "event_tiers_sort_order_idx" ON "event_tiers" USING btree ("sort_order");
--> statement-breakpoint

-- ─── spot_features ──────────────────────────────────────────────────
CREATE TABLE "spot_features" (
  "slug" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL
);
--> statement-breakpoint

-- ─── profiles ───────────────────────────────────────────────────────
CREATE TABLE "profiles" (
  "id" uuid PRIMARY KEY NOT NULL,
  "display_name" text NOT NULL,
  "email" text NOT NULL,
  "initials" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- ─── spots ──────────────────────────────────────────────────────────
CREATE TABLE "spots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "city" text NOT NULL,
  "city_slug" text NOT NULL,
  "address" text NOT NULL,
  "type_slug" text NOT NULL REFERENCES "spot_types"("slug") ON DELETE restrict ON UPDATE no action,
  "image_url" text NOT NULL,
  "image_path" text,
  "community_note" text DEFAULT '' NOT NULL,
  "crowd_level" integer DEFAULT 0 NOT NULL,
  "crowd_level_label" text DEFAULT '' NOT NULL,
  "country_code" text NOT NULL REFERENCES "countries"("iso2") ON DELETE restrict ON UPDATE no action,
  "location" geometry(Point, 4326) NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "spots_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint

CREATE INDEX "spots_type_slug_idx" ON "spots" USING btree ("type_slug");
--> statement-breakpoint
CREATE INDEX "spots_country_code_idx" ON "spots" USING btree ("country_code");
--> statement-breakpoint
CREATE INDEX "spots_city_slug_idx" ON "spots" USING btree ("city_slug");
--> statement-breakpoint

-- ─── sport_events ───────────────────────────────────────────────────
CREATE TABLE "sport_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "short_name" text,
  "url" text NOT NULL,
  "image" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "start_at" timestamp with time zone NOT NULL,
  "end_at" timestamp with time zone,
  "city" text NOT NULL,
  "country_code" text NOT NULL REFERENCES "countries"("iso2") ON DELETE restrict ON UPDATE no action,
  "venue" text,
  "location" geometry(Point, 4326),
  "tier_slug" text NOT NULL REFERENCES "event_tiers"("slug") ON DELETE restrict ON UPDATE no action,
  "featured" boolean DEFAULT false NOT NULL,
  "created_by" uuid REFERENCES "profiles"("id") ON DELETE set null ON UPDATE no action,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "sport_events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint

CREATE INDEX "sport_events_country_code_idx" ON "sport_events" USING btree ("country_code");
--> statement-breakpoint
CREATE INDEX "sport_events_tier_slug_idx" ON "sport_events" USING btree ("tier_slug");
--> statement-breakpoint
CREATE INDEX "sport_events_start_at_idx" ON "sport_events" USING btree ("start_at");
--> statement-breakpoint

-- ─── saved_spots ────────────────────────────────────────────────────
CREATE TABLE "saved_spots" (
  "user_id" uuid NOT NULL,
  "spot_id" uuid NOT NULL REFERENCES "spots"("id") ON DELETE cascade ON UPDATE no action,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "saved_spots_user_id_spot_id_pk" PRIMARY KEY("user_id","spot_id")
);
--> statement-breakpoint

CREATE INDEX "saved_spots_user_created_idx" ON "saved_spots" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX "saved_spots_spot_idx" ON "saved_spots" USING btree ("spot_id");
--> statement-breakpoint

-- ─── spot_sports (join) ─────────────────────────────────────────────
CREATE TABLE "spot_sports" (
  "spot_id" uuid NOT NULL REFERENCES "spots"("id") ON DELETE cascade ON UPDATE no action,
  "discipline_slug" text NOT NULL REFERENCES "sport_disciplines"("slug") ON DELETE restrict ON UPDATE no action,
  CONSTRAINT "spot_sports_spot_id_discipline_slug_pk" PRIMARY KEY("spot_id","discipline_slug")
);
--> statement-breakpoint

CREATE INDEX "spot_sports_discipline_idx" ON "spot_sports" USING btree ("discipline_slug");
--> statement-breakpoint

-- ─── spot_feature_links (join) ─────────────────────────────────────
CREATE TABLE "spot_feature_links" (
  "spot_id" uuid NOT NULL REFERENCES "spots"("id") ON DELETE cascade ON UPDATE no action,
  "feature_slug" text NOT NULL REFERENCES "spot_features"("slug") ON DELETE restrict ON UPDATE no action,
  CONSTRAINT "spot_feature_links_spot_id_feature_slug_pk" PRIMARY KEY("spot_id","feature_slug")
);
--> statement-breakpoint

CREATE INDEX "spot_feature_links_feature_idx" ON "spot_feature_links" USING btree ("feature_slug");
--> statement-breakpoint

-- ─── event_sports (join) ───────────────────────────────────────────
CREATE TABLE "event_sports" (
  "event_id" uuid NOT NULL REFERENCES "sport_events"("id") ON DELETE cascade ON UPDATE no action,
  "discipline_slug" text NOT NULL REFERENCES "sport_disciplines"("slug") ON DELETE restrict ON UPDATE no action,
  CONSTRAINT "event_sports_event_id_discipline_slug_pk" PRIMARY KEY("event_id","discipline_slug")
);
--> statement-breakpoint

CREATE INDEX "event_sports_discipline_idx" ON "event_sports" USING btree ("discipline_slug");
--> statement-breakpoint

-- ─── sport_events_with_status view ────────────────────────────────
-- Exposes the canonical SportEvent shape with a computed `status`
-- column. Hand-managed (not in the Drizzle schema; see D16).

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

-- ─── Row-Level Security ────────────────────────────────────────────
-- Pattern (from the proven 0002 set): every policy uses an explicit
-- `TO` clause. UPDATE policies declare both USING and WITH CHECK so
-- ownership cannot be transferred.

-- Dimension tables: public read, writes are service-role (admin/seed).
ALTER TABLE "public"."regions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "regions_select_public"
  ON "public"."regions"
  FOR SELECT
  TO anon, authenticated
  USING (true);
--> statement-breakpoint

ALTER TABLE "public"."countries" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "countries_select_public"
  ON "public"."countries"
  FOR SELECT
  TO anon, authenticated
  USING (true);
--> statement-breakpoint

ALTER TABLE "public"."spot_types" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "spot_types_select_public"
  ON "public"."spot_types"
  FOR SELECT
  TO anon, authenticated
  USING (true);
--> statement-breakpoint

ALTER TABLE "public"."sport_disciplines" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "sport_disciplines_select_public"
  ON "public"."sport_disciplines"
  FOR SELECT
  TO anon, authenticated
  USING (true);
--> statement-breakpoint

ALTER TABLE "public"."event_tiers" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "event_tiers_select_public"
  ON "public"."event_tiers"
  FOR SELECT
  TO anon, authenticated
  USING (true);
--> statement-breakpoint

ALTER TABLE "public"."spot_features" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "spot_features_select_public"
  ON "public"."spot_features"
  FOR SELECT
  TO anon, authenticated
  USING (true);
--> statement-breakpoint

-- spots: public read; writes by the creator only.
ALTER TABLE "public"."spots" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "spots_select_public"
  ON "public"."spots"
  FOR SELECT
  TO anon, authenticated
  USING (true);
--> statement-breakpoint
CREATE POLICY "spots_insert_self"
  ON "public"."spots"
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = "created_by");
--> statement-breakpoint
CREATE POLICY "spots_update_owner"
  ON "public"."spots"
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = "created_by")
  WITH CHECK ((select auth.uid()) = "created_by");
--> statement-breakpoint
CREATE POLICY "spots_delete_owner"
  ON "public"."spots"
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = "created_by");
--> statement-breakpoint

-- sport_events: public read; writes are service-role only (admin
-- dashboard, seed). The service_role bypasses RLS, so no write policy
-- is required.
ALTER TABLE "public"."sport_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "sport_events_select_public"
  ON "public"."sport_events"
  FOR SELECT
  TO anon, authenticated
  USING (true);
--> statement-breakpoint

-- saved_spots: owner-only access.
ALTER TABLE "public"."saved_spots" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "saved_spots_select_owner"
  ON "public"."saved_spots"
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = "user_id");
--> statement-breakpoint
CREATE POLICY "saved_spots_insert_self"
  ON "public"."saved_spots"
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = "user_id");
--> statement-breakpoint
CREATE POLICY "saved_spots_delete_owner"
  ON "public"."saved_spots"
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = "user_id");
--> statement-breakpoint

-- profiles: public read; owner can update their own row.
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "profiles_select_public"
  ON "public"."profiles"
  FOR SELECT
  TO anon, authenticated
  USING (true);
--> statement-breakpoint
CREATE POLICY "profiles_insert_self"
  ON "public"."profiles"
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = "id");
--> statement-breakpoint
CREATE POLICY "profiles_update_owner"
  ON "public"."profiles"
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = "id")
  WITH CHECK ((select auth.uid()) = "id");
--> statement-breakpoint

-- Storage bucket policies (spot-images) — bucket itself is created
-- out-of-band. Objects live at spots/{userId}/{uuid}; the policies
-- scope access by the first folder segment.
CREATE POLICY "spot_images_select_owner"
  ON "storage"."objects"
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'spot-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );
--> statement-breakpoint
CREATE POLICY "spot_images_insert_owner"
  ON "storage"."objects"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'spot-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );
--> statement-breakpoint
CREATE POLICY "spot_images_update_owner"
  ON "storage"."objects"
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'spot-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'spot-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );
--> statement-breakpoint
CREATE POLICY "spot_images_delete_owner"
  ON "storage"."objects"
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'spot-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );
