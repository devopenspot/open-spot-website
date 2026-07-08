ALTER TABLE "sport_events" ADD COLUMN "start_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sport_events" ADD COLUMN "end_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sport_events" ADD COLUMN "country_code_fk" text;--> statement-breakpoint
ALTER TABLE "sport_events" ADD COLUMN "tier_slug" text;--> statement-breakpoint
ALTER TABLE "sport_events" ADD COLUMN "featured_v2" boolean;--> statement-breakpoint
ALTER TABLE "sport_events" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "spots" ADD COLUMN "type_slug" text;--> statement-breakpoint
ALTER TABLE "spots" ADD COLUMN "country_code" text;--> statement-breakpoint
ALTER TABLE "sport_events" ADD CONSTRAINT "sport_events_country_code_fk_countries_iso2_fk" FOREIGN KEY ("country_code_fk") REFERENCES "public"."countries"("iso2") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_events" ADD CONSTRAINT "sport_events_tier_slug_event_tiers_slug_fk" FOREIGN KEY ("tier_slug") REFERENCES "public"."event_tiers"("slug") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sport_events" ADD CONSTRAINT "sport_events_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spots" ADD CONSTRAINT "spots_type_slug_spot_types_slug_fk" FOREIGN KEY ("type_slug") REFERENCES "public"."spot_types"("slug") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spots" ADD CONSTRAINT "spots_country_code_countries_iso2_fk" FOREIGN KEY ("country_code") REFERENCES "public"."countries"("iso2") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sport_events_country_code_fk_idx" ON "sport_events" USING btree ("country_code_fk");--> statement-breakpoint
CREATE INDEX "sport_events_tier_slug_idx" ON "sport_events" USING btree ("tier_slug");--> statement-breakpoint
CREATE INDEX "sport_events_start_at_idx" ON "sport_events" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "spots_type_slug_idx" ON "spots" USING btree ("type_slug");--> statement-breakpoint
CREATE INDEX "spots_country_code_idx" ON "spots" USING btree ("country_code");