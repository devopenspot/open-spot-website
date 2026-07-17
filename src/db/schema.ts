import {
  boolean,
  customType,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

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
    // postgres-js returns a `geometry(Point, 4326)` column as hex-encoded
    // EWKB (Extended Well-Known Binary). Accept that as the primary
    // format, with a WKT/EWKT fallback for any other future driver.
    if (typeof value === "string" && /^[0-9A-Fa-f]+$/.test(value) && value.length >= 50) {
      // EWKB Point with SRID = 25 bytes = 50 hex chars.
      // Layout: [0]=endian, [1..4]=type, [5..8]=SRID, [9..16]=X (lon), [17..24]=Y (lat)
      const buf = Buffer.from(value, "hex")
      const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
      const lon = view.getFloat64(9, true)
      const lat = view.getFloat64(17, true)
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        return { lat, lon }
      }
    }
    // Fallback: WKT / EWKT ("POINT(<lon> <lat>)" or "SRID=4326;POINT(...)")
    const match = /(?:SRID=\d+;)?POINT\s*\(\s*([-\d.eE]+)\s+([-\d.eE]+)\s*\)/i.exec(
      value,
    )
    if (match) {
      return { lat: Number(match[2]), lon: Number(match[1]) }
    }
    console.warn("geometryPoint.fromDriver: unparseable geometry", { value })
    return { lat: 0, lon: 0 }
  },
})

export const spots = pgTable(
  "spots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    city: text("city").notNull(),
    citySlug: text("city_slug").notNull(),
    address: text("address").notNull(),
    typeSlug: text("type_slug")
      .notNull()
      .references(() => spotTypes.slug, { onDelete: "restrict" }),
    imageUrl: text("image_url").notNull(),
    imagePath: text("image_path"),
    crowdLevel: integer("crowd_level").notNull().default(0),
    countryCode: text("country_code")
      .notNull()
      .references(() => countries.iso2, { onDelete: "restrict" }),
    location: geometryPoint("location").notNull(),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("spots_slug_unique").on(t.slug),
    index("spots_type_slug_idx").on(t.typeSlug),
    index("spots_country_code_idx").on(t.countryCode),
    index("spots_city_slug_idx").on(t.citySlug),
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
    startAt: timestamp("start_at", { withTimezone: true })
      .notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),
    city: text("city").notNull(),
    countryCode: text("country_code")
      .notNull()
      .references(() => countries.iso2, { onDelete: "restrict" }),
    venue: text("venue"),
    location: geometryPoint("location"),
    tierSlug: text("tier_slug")
      .notNull()
      .references(() => eventTiers.slug, { onDelete: "restrict" }),
    featured: boolean("featured").notNull().default(false),
    // `text` (not `uuid`) so the dev placeholder user is representable.
    // The FK to `profiles(id)` is dropped (dev has no profile row); RLS
    // is service-role-only on this table, so no auth.uid() cast needed.
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("sport_events_slug_unique").on(t.slug),
    index("sport_events_country_code_idx").on(t.countryCode),
    index("sport_events_tier_slug_idx").on(t.tierSlug),
    index("sport_events_start_at_idx").on(t.startAt),
  ],
)

export const savedSpots = pgTable(
  "saved_spots",
  {
    // `text` (not `uuid`) so the dev placeholder user (`id === "dev"`)
    // is representable in this table. Real Supabase users still have
    // UUIDs; the `auth.uid()`-based RLS policies cast to text for
    // comparison. See `supabase/migrations/0000_fresh.sql`.
    userId: text("user_id").notNull(),
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

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  initials: text("initials").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const regions = pgTable(
  "regions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("regions_sort_order_idx").on(t.sortOrder)],
)

export const countries = pgTable(
  "countries",
  {
    iso2: text("iso2").primaryKey(),
    name: text("name").notNull().unique(),
    iso3: text("iso3"),
    regionId: uuid("region_id")
      .notNull()
      .references(() => regions.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("countries_region_idx").on(t.regionId)],
)

export const spotTypes = pgTable(
  "spot_types",
  {
    slug: text("slug").primaryKey(),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("spot_types_sort_order_idx").on(t.sortOrder)],
)

export const sportDisciplines = pgTable(
  "sport_disciplines",
  {
    slug: text("slug").primaryKey(),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("sport_disciplines_sort_order_idx").on(t.sortOrder)],
)

export const eventTiers = pgTable(
  "event_tiers",
  {
    slug: text("slug").primaryKey(),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("event_tiers_sort_order_idx").on(t.sortOrder)],
)

export const presetImages = pgTable(
  "preset_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    // `text` (not `uuid`) so the dev placeholder user is representable.
    // RLS casts `(auth.uid())::text` for owner comparison.
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("preset_images_sort_order_idx").on(t.sortOrder)],
)

export const spotSports = pgTable(
  "spot_sports",
  {
    spotId: uuid("spot_id")
      .notNull()
      .references(() => spots.id, { onDelete: "cascade" }),
    disciplineSlug: text("discipline_slug")
      .notNull()
      .references(() => sportDisciplines.slug, { onDelete: "restrict" }),
  },
  (t) => [
    primaryKey({ columns: [t.spotId, t.disciplineSlug] }),
    index("spot_sports_discipline_idx").on(t.disciplineSlug),
  ],
)

export const eventSports = pgTable(
  "event_sports",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => sportEvents.id, { onDelete: "cascade" }),
    disciplineSlug: text("discipline_slug")
      .notNull()
      .references(() => sportDisciplines.slug, { onDelete: "restrict" }),
  },
  (t) => [
    primaryKey({ columns: [t.eventId, t.disciplineSlug] }),
    index("event_sports_discipline_idx").on(t.disciplineSlug),
  ],
)

export const spotsRelations = relations(spots, ({ one, many }) => ({
  type: one(spotTypes, {
    fields: [spots.typeSlug],
    references: [spotTypes.slug],
  }),
  country: one(countries, {
    fields: [spots.countryCode],
    references: [countries.iso2],
  }),
  sports: many(spotSports),
}))

export const sportEventsRelations = relations(sportEvents, ({ one, many }) => ({
  tier: one(eventTiers, {
    fields: [sportEvents.tierSlug],
    references: [eventTiers.slug],
  }),
  country: one(countries, {
    fields: [sportEvents.countryCode],
    references: [countries.iso2],
  }),
  sports: many(eventSports),
  creator: one(profiles, {
    fields: [sportEvents.createdBy],
    references: [profiles.id],
  }),
}))

export const countriesRelations = relations(countries, ({ one, many }) => ({
  region: one(regions, {
    fields: [countries.regionId],
    references: [regions.id],
  }),
  spots: many(spots),
  events: many(sportEvents),
}))

export const regionsRelations = relations(regions, ({ many }) => ({
  countries: many(countries),
}))

export const spotSportsRelations = relations(spotSports, ({ one }) => ({
  spot: one(spots, { fields: [spotSports.spotId], references: [spots.id] }),
  discipline: one(sportDisciplines, {
    fields: [spotSports.disciplineSlug],
    references: [sportDisciplines.slug],
  }),
}))

export const eventSportsRelations = relations(eventSports, ({ one }) => ({
  event: one(sportEvents, {
    fields: [eventSports.eventId],
    references: [sportEvents.id],
  }),
  discipline: one(sportDisciplines, {
    fields: [eventSports.disciplineSlug],
    references: [sportDisciplines.slug],
  }),
}))

export const savedSpotsRelations = relations(savedSpots, ({ one }) => ({
  spot: one(spots, { fields: [savedSpots.spotId], references: [spots.id] }),
}))

export type SpotRow = typeof spots.$inferSelect
export type NewSpotRow = typeof spots.$inferInsert
export type SportEventRow = typeof sportEvents.$inferSelect
export type NewSportEventRow = typeof sportEvents.$inferInsert
export type SavedSpotRow = typeof savedSpots.$inferSelect
export type NewSavedSpotRow = typeof savedSpots.$inferInsert
export type ProfileRow = typeof profiles.$inferSelect

export type RegionRow = typeof regions.$inferSelect
export type NewRegionRow = typeof regions.$inferInsert
export type CountryRow = typeof countries.$inferSelect
export type NewCountryRow = typeof countries.$inferInsert
export type SpotTypeRow = typeof spotTypes.$inferSelect
export type NewSpotTypeRow = typeof spotTypes.$inferInsert
export type SportDisciplineRow = typeof sportDisciplines.$inferSelect
export type NewSportDisciplineRow = typeof sportDisciplines.$inferInsert
export type EventTierRow = typeof eventTiers.$inferSelect
export type NewEventTierRow = typeof eventTiers.$inferInsert
export type SpotFeatureRow = never
export type NewSpotFeatureRow = never
export type SpotSportRow = typeof spotSports.$inferSelect
export type NewSpotSportRow = typeof spotSports.$inferInsert
export type EventSportRow = typeof eventSports.$inferSelect
export type NewEventSportRow = typeof eventSports.$inferInsert
export type PresetImageRow = typeof presetImages.$inferSelect
export type NewPresetImageRow = typeof presetImages.$inferInsert
