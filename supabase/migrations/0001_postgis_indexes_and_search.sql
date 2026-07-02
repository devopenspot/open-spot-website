-- PostGIS GIST index on the spot location column for fast ST_DWithin queries.
-- The base btree indexes are created in 0001; this migration adds the
-- geometry-specific GIST indexes for findNearby.
CREATE INDEX IF NOT EXISTS "spots_location_gist" ON "spots" USING gist ("location");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sport_events_location_gist" ON "sport_events" USING gist ("location");
