-- Drop the unused `crowd_level` column from `spots`.
--
-- This column was carried over from an earlier schema but has no
-- consumer: it is not in `src/db/schema.ts`, not in the Zod
-- `NewSpotSchema` / `SpotSchema` / `SpotPatchSchema`, not in the
-- Drizzle repository, and not in any UI surface. The
-- `src/db/seed.ts` raw-SQL spot insert was the only thing that
-- referenced it (and was already broken — the column/value count
-- was off, see the "Full root fix" commit).
--
-- Idempotent so it is safe to re-run.

ALTER TABLE "spots" DROP COLUMN IF EXISTS "crowd_level";
