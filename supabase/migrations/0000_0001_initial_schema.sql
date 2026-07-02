CREATE TYPE "public"."sport_discipline" AS ENUM('Skateboard', 'BMX', 'Inline', 'Scooter', 'Rollerblade', 'Wakeboard', 'Snowboard', 'Ski');--> statement-breakpoint
CREATE TYPE "public"."sport_event_tier" AS ENUM('world-tour', 'championship', 'festival', 'federation');--> statement-breakpoint
CREATE TYPE "public"."spot_type" AS ENUM('Plaza', 'DIY', 'Stair', 'Bowl', 'Park', 'Ledges', 'Pools');--> statement-breakpoint
CREATE TABLE "country_regions" (
	"country" text PRIMARY KEY NOT NULL,
	"region" text NOT NULL,
	"iso2" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"email" text NOT NULL,
	"initials" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_spots" (
	"user_id" uuid NOT NULL,
	"spot_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_spots_user_id_spot_id_pk" PRIMARY KEY("user_id","spot_id")
);
--> statement-breakpoint
CREATE TABLE "sport_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"url" text NOT NULL,
	"image" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sports" "sport_discipline"[] DEFAULT '{}' NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text,
	"city" text NOT NULL,
	"country" text NOT NULL,
	"country_code" text,
	"venue" text,
	"location" geometry(Point, 4326),
	"tier" "sport_event_tier" NOT NULL,
	"featured" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"city_slug" text NOT NULL,
	"address" text NOT NULL,
	"type" "spot_type" NOT NULL,
	"features" text[] DEFAULT '{}' NOT NULL,
	"image_url" text NOT NULL,
	"image_path" text,
	"community_note" text DEFAULT '' NOT NULL,
	"crowd_level" integer DEFAULT 0 NOT NULL,
	"crowd_level_label" text DEFAULT '' NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"location" geometry(Point, 4326) NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_spots" ADD CONSTRAINT "saved_spots_spot_id_spots_id_fk" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "country_regions_region_idx" ON "country_regions" USING btree ("region");--> statement-breakpoint
CREATE INDEX "saved_spots_user_created_idx" ON "saved_spots" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "saved_spots_spot_idx" ON "saved_spots" USING btree ("spot_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sport_events_slug_unique" ON "sport_events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "sport_events_country_idx" ON "sport_events" USING btree ("country");--> statement-breakpoint
CREATE INDEX "sport_events_tier_idx" ON "sport_events" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "sport_events_start_date_idx" ON "sport_events" USING btree ("start_date");--> statement-breakpoint
CREATE UNIQUE INDEX "spots_slug_unique" ON "spots" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "spots_type_idx" ON "spots" USING btree ("type");--> statement-breakpoint
CREATE INDEX "spots_country_idx" ON "spots" USING btree ("country");--> statement-breakpoint
CREATE INDEX "spots_city_slug_idx" ON "spots" USING btree ("city_slug");--> statement-breakpoint
CREATE INDEX "spots_country_type_slug_idx" ON "spots" USING btree ("country","type","slug");