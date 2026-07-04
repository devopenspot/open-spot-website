import {
  customType,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

const geometryPoint = customType<{
  data: { lat: number; lon: number }
  driverData: string
}>({
  dataType() {
    return "geometry(Point, 4326)"
  },
  toDriver(value) {
    return `SRID=4326;POINT(${value.lon} ${value.lat})`
  },
  fromDriver(value) {
    const match = /POINT\(([-\d.]+)\s+([-\d.]+)\)/.exec(value)
    if (!match) return { lat: 0, lon: 0 }
    return { lat: Number(match[2]), lon: Number(match[1]) }
  },
})

export const spotTypeEnum = pgEnum("spot_type", [
  "Plaza",
  "DIY",
  "Stair",
  "Bowl",
  "Park",
  "Ledges",
  "Pools",
])

export const sportDisciplineEnum = pgEnum("sport_discipline", [
  "Skateboard",
  "BMX",
  "Inline",
  "Scooter",
  "Rollerblade",
  "Wakeboard",
  "Snowboard",
  "Ski",
])

export const sportEventTierEnum = pgEnum("sport_event_tier", [
  "world-tour",
  "championship",
  "festival",
  "federation",
])

export const spots = pgTable(
  "spots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    city: text("city").notNull(),
    citySlug: text("city_slug").notNull(),
    address: text("address").notNull(),
    type: spotTypeEnum("type").notNull(),
    features: text("features").array().notNull().default([]),
    sports: text("sports").array().notNull().default([]),
    imageUrl: text("image_url").notNull(),
    imagePath: text("image_path"),
    communityNote: text("community_note").notNull().default(""),
    crowdLevel: integer("crowd_level").notNull().default(0),
    crowdLevelLabel: text("crowd_level_label").notNull().default(""),
    country: text("country").notNull().default(""),
    location: geometryPoint("location").notNull(),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("spots_slug_unique").on(t.slug),
    index("spots_type_idx").on(t.type),
    index("spots_country_idx").on(t.country),
    index("spots_city_slug_idx").on(t.citySlug),
    index("spots_country_type_slug_idx").on(t.country, t.type, t.slug),
  ],
)

export const sportEvents = pgTable(
  "sport_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    shortName: text("short_name"),
    url: text("url").notNull(),
    image: text("image").notNull(),
    description: text("description").notNull().default(""),
    sports: sportDisciplineEnum("sports").array().notNull().default([]),
    startDate: text("start_date").notNull(),
    endDate: text("end_date"),
    city: text("city").notNull(),
    country: text("country").notNull(),
    countryCode: text("country_code"),
    venue: text("venue"),
    location: geometryPoint("location"),
    tier: sportEventTierEnum("tier").notNull(),
    featured: text("featured"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("sport_events_slug_unique").on(t.slug),
    index("sport_events_country_idx").on(t.country),
    index("sport_events_tier_idx").on(t.tier),
    index("sport_events_start_date_idx").on(t.startDate),
  ],
)

export const savedSpots = pgTable(
  "saved_spots",
  {
    userId: uuid("user_id").notNull(),
    spotId: uuid("spot_id")
      .notNull()
      .references(() => spots.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.spotId] }),
    index("saved_spots_user_created_idx").on(t.userId, t.createdAt),
    index("saved_spots_spot_idx").on(t.spotId),
  ],
)

export const countryRegions = pgTable(
  "country_regions",
  {
    country: text("country").primaryKey(),
    region: text("region").notNull(),
    iso2: text("iso2"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("country_regions_region_idx").on(t.region)],
)

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  initials: text("initials").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type SpotRow = typeof spots.$inferSelect
export type NewSpotRow = typeof spots.$inferInsert
export type SportEventRow = typeof sportEvents.$inferSelect
export type NewSportEventRow = typeof sportEvents.$inferInsert
export type SavedSpotRow = typeof savedSpots.$inferSelect
export type NewSavedSpotRow = typeof savedSpots.$inferInsert
export type CountryRegionRow = typeof countryRegions.$inferSelect
export type ProfileRow = typeof profiles.$inferSelect