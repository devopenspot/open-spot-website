CREATE TABLE "countries" (
	"iso2" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"iso3" text,
	"region_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "countries_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "event_sports" (
	"event_id" uuid NOT NULL,
	"discipline_slug" text NOT NULL,
	CONSTRAINT "event_sports_event_id_discipline_slug_pk" PRIMARY KEY("event_id","discipline_slug")
);
--> statement-breakpoint
CREATE TABLE "event_tiers" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "sport_disciplines" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spot_feature_links" (
	"spot_id" uuid NOT NULL,
	"feature_slug" text NOT NULL,
	CONSTRAINT "spot_feature_links_spot_id_feature_slug_pk" PRIMARY KEY("spot_id","feature_slug")
);
--> statement-breakpoint
CREATE TABLE "spot_features" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spot_sports" (
	"spot_id" uuid NOT NULL,
	"discipline_slug" text NOT NULL,
	CONSTRAINT "spot_sports_spot_id_discipline_slug_pk" PRIMARY KEY("spot_id","discipline_slug")
);
--> statement-breakpoint
CREATE TABLE "spot_types" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "countries" ADD CONSTRAINT "countries_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sports" ADD CONSTRAINT "event_sports_event_id_sport_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."sport_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sports" ADD CONSTRAINT "event_sports_discipline_slug_sport_disciplines_slug_fk" FOREIGN KEY ("discipline_slug") REFERENCES "public"."sport_disciplines"("slug") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spot_feature_links" ADD CONSTRAINT "spot_feature_links_spot_id_spots_id_fk" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spot_feature_links" ADD CONSTRAINT "spot_feature_links_feature_slug_spot_features_slug_fk" FOREIGN KEY ("feature_slug") REFERENCES "public"."spot_features"("slug") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spot_sports" ADD CONSTRAINT "spot_sports_spot_id_spots_id_fk" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spot_sports" ADD CONSTRAINT "spot_sports_discipline_slug_sport_disciplines_slug_fk" FOREIGN KEY ("discipline_slug") REFERENCES "public"."sport_disciplines"("slug") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "countries_region_idx" ON "countries" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "event_sports_discipline_idx" ON "event_sports" USING btree ("discipline_slug");--> statement-breakpoint
CREATE INDEX "event_tiers_sort_order_idx" ON "event_tiers" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "regions_sort_order_idx" ON "regions" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "sport_disciplines_sort_order_idx" ON "sport_disciplines" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "spot_feature_links_feature_idx" ON "spot_feature_links" USING btree ("feature_slug");--> statement-breakpoint
CREATE INDEX "spot_sports_discipline_idx" ON "spot_sports" USING btree ("discipline_slug");--> statement-breakpoint
CREATE INDEX "spot_types_sort_order_idx" ON "spot_types" USING btree ("sort_order");