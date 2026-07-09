-- 0001_preset_images.sql
--
-- Phase 2 of the Single Source of Truth (DB-Only) Refactor (SPEC.md §14).
-- Adds the `preset_images` table: a curated, admin-ownable list of
-- image URLs that the admin `ImageSourceField` offers when creating or
-- editing a spot, and that the Drizzle spot repo uses as the
-- deterministic fallback when a spot has no image.
--
-- RLS mirrors the other dimension tables: public read, owner-only
-- write. Preset images are not user-scoped (the `created_by` column is
-- nullable; the spec's owner-only write gate checks the caller is
-- authenticated and sets `created_by = auth.uid()` on insert, then
-- permits update/delete only when that matches the row's `created_by`).
--
-- Every statement is separated by the statement-breakpoint marker
-- (see src/db/apply-sql.ts).

-- ─── preset_images ──────────────────────────────────────────────────
CREATE TABLE "preset_images" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "url" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "preset_images_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint

CREATE INDEX "preset_images_sort_order_idx" ON "preset_images" USING btree ("sort_order");
--> statement-breakpoint

-- ─── RLS ────────────────────────────────────────────────────────────
ALTER TABLE "public"."preset_images" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- Public read. The admin radiogroup is a client component that
-- fetches the list from `useSpotsStore`, hydrated at the root layout.
CREATE POLICY "preset_images_select_public"
  ON "public"."preset_images"
  FOR SELECT
  TO anon, authenticated
  USING (true);
--> statement-breakpoint

-- Owner-only writes. Mirrors the `spots` write policies.
CREATE POLICY "preset_images_insert_owner"
  ON "public"."preset_images"
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = "created_by");
--> statement-breakpoint

CREATE POLICY "preset_images_update_owner"
  ON "public"."preset_images"
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = "created_by")
  WITH CHECK ((select auth.uid()) = "created_by");
--> statement-breakpoint

CREATE POLICY "preset_images_delete_owner"
  ON "public"."preset_images"
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = "created_by");
