-- RLS: per-table policies for the four domain tables and the storage bucket.
-- See https://supabase.com/docs/guides/auth/row-level-security
--
-- Pattern: every policy uses the explicit `TO` clause (not the deprecated
-- `auth.role()`). UPDATE policies declare both USING and WITH CHECK so a
-- user cannot reassign a row's ownership.

-- ============================================================
-- spots
-- ============================================================
ALTER TABLE "public"."spots" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- Public read (anon + authenticated).
CREATE POLICY "spots_select_public"
  ON "public"."spots"
  FOR SELECT
  TO anon, authenticated
  USING (true);
--> statement-breakpoint

-- Insert: must be the current user; created_by is set server-side.
CREATE POLICY "spots_insert_self"
  ON "public"."spots"
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);
--> statement-breakpoint

-- Update: only the creator can edit their own row, and they can't transfer
-- ownership (WITH CHECK matches the row's created_by).
CREATE POLICY "spots_update_owner"
  ON "public"."spots"
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);
--> statement-breakpoint

-- Delete: only the creator.
CREATE POLICY "spots_delete_owner"
  ON "public"."spots"
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = created_by);
--> statement-breakpoint

-- ============================================================
-- sport_events (admin-curated; reads are public, writes are service-role only)
-- ============================================================
ALTER TABLE "public"."sport_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

CREATE POLICY "sport_events_select_public"
  ON "public"."sport_events"
  FOR SELECT
  TO anon, authenticated
  USING (true);
--> statement-breakpoint
-- No INSERT/UPDATE/DELETE policies: writes happen via the service role
-- (admin dashboard, seed scripts). The `service_role` bypasses RLS, so
-- no policy is needed for those operations.

-- ============================================================
-- saved_spots
-- ============================================================
ALTER TABLE "public"."saved_spots" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

CREATE POLICY "saved_spots_select_owner"
  ON "public"."saved_spots"
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
--> statement-breakpoint

CREATE POLICY "saved_spots_insert_self"
  ON "public"."saved_spots"
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
--> statement-breakpoint

-- No UPDATE allowed (saves are an append/remove relation; we delete + re-insert).
-- DELETE: only the owner.
CREATE POLICY "saved_spots_delete_owner"
  ON "public"."saved_spots"
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
--> statement-breakpoint

-- ============================================================
-- profiles
-- ============================================================
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
  WITH CHECK ((select auth.uid()) = id);
--> statement-breakpoint

CREATE POLICY "profiles_update_owner"
  ON "public"."profiles"
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);
--> statement-breakpoint

-- ============================================================
-- country_regions (lookup table; everyone reads, only service_role writes)
-- ============================================================
ALTER TABLE "public"."country_regions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

CREATE POLICY "country_regions_select_public"
  ON "public"."country_regions"
  FOR SELECT
  TO anon, authenticated
  USING (true);
--> statement-breakpoint

-- ============================================================
-- Storage: spot-images bucket
-- ============================================================
-- The bucket itself is created out-of-band (Dashboard / supabase storage
-- CLI / REST API). The policies below assume the bucket 'spot-images' is
-- PRIVATE. Reads happen via signed URLs issued server-side.
--
-- The policies scope access by the first folder segment of the object path:
--   spots/{userId}/{uuid}   — uploads land in a folder named with the userId
-- Storage exposes (storage.foldername(name))[1] = first segment.

CREATE POLICY "spot_images_select_owner"
  ON "storage"."objects"
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'spot-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );
--> statement-breakpoint

-- Storage upsert needs INSERT + SELECT + UPDATE. See supabase skill #6.
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
--> statement-breakpoint