import "./load-env"
import postgres from "postgres"
import { getDatabaseUrl } from "../lib/env"
import { log } from "../lib/log"
import {
  EVENT_TIER_SEED,
  SPORT_DISCIPLINE_SEED,
  SPOT_TYPE_SEED,
} from "./seed-data/taxonomy"
import { REGION_SEED } from "./seed-data/regions"
import { buildCountrySeed, type CountrySeed } from "./seed-data/countries"
import { PRESET_IMAGE_SEED } from "./seed-data/preset-images"
import { SOURCE_SPOTS } from "./seed-data/spots"
import { SOURCE_SPORT_EVENTS } from "./seed-data/sport-events"
import { DEV_SAVED_SPOTS } from "./seed-data/saved-spots"

// ─── Helpers ────────────────────────────────────────────────────────

function pointWkt(lat: number, lon: number): string {
  return `SRID=4326;POINT(${lon} ${lat})`
}

// ─── Dimension seeds ────────────────────────────────────────────────

async function seedRegions(sql: ReturnType<typeof postgres>): Promise<void> {
  log.info("seed.regions.start")
  for (const r of REGION_SEED) {
    await sql`
      insert into regions (slug, name, description, image_url, sort_order)
      values (${r.slug}, ${r.name}, ${r.desc}, ${r.image}, ${0})
      on conflict (slug) do update set
        name = excluded.name,
        description = excluded.description,
        image_url = excluded.image_url,
        sort_order = excluded.sort_order,
        updated_at = now()
    `
  }
  log.info("seed.regions.done", { count: REGION_SEED.length })
}

async function seedCountries(
  sql: ReturnType<typeof postgres>,
): Promise<void> {
  log.info("seed.countries.start")
  const countries: readonly CountrySeed[] = buildCountrySeed()
  const regionRows = await sql<{ id: string; name: string }[]>`
    select id, name from regions
  `
  const regionIdByName = new Map(regionRows.map((r) => [r.name, r.id]))
  let count = 0
  for (const c of countries) {
    const regionId = regionIdByName.get(c.region)
    if (!regionId) {
      log.warn("seed.countries.skip_no_region", { country: c.name })
      continue
    }
    await sql`
      insert into countries (iso2, name, iso3, region_id)
      values (${c.iso2}, ${c.name}, ${c.iso3 || null}, ${regionId})
      on conflict (iso2) do update set
        name = excluded.name,
        iso3 = excluded.iso3,
        region_id = excluded.region_id,
        updated_at = now()
    `
    count++
  }
  log.info("seed.countries.done", { count })
}

async function seedSpotTypes(sql: ReturnType<typeof postgres>): Promise<void> {
  log.info("seed.spot_types.start")
  for (const t of SPOT_TYPE_SEED) {
    await sql`
      insert into spot_types (slug, name, sort_order)
      values (${t.slug}, ${t.name}, ${t.sortOrder})
      on conflict (slug) do update set
        name = excluded.name,
        sort_order = excluded.sort_order
    `
  }
  log.info("seed.spot_types.done", { count: SPOT_TYPE_SEED.length })
}

async function seedSportDisciplines(
  sql: ReturnType<typeof postgres>,
): Promise<void> {
  log.info("seed.sport_disciplines.start")
  for (const d of SPORT_DISCIPLINE_SEED) {
    await sql`
      insert into sport_disciplines (slug, name, sort_order)
      values (${d.slug}, ${d.name}, ${d.sortOrder})
      on conflict (slug) do update set
        name = excluded.name,
        sort_order = excluded.sort_order
    `
  }
  log.info("seed.sport_disciplines.done", { count: SPORT_DISCIPLINE_SEED.length })
}

async function seedEventTiers(sql: ReturnType<typeof postgres>): Promise<void> {
  log.info("seed.event_tiers.start")
  for (const t of EVENT_TIER_SEED) {
    await sql`
      insert into event_tiers (slug, name, sort_order)
      values (${t.slug}, ${t.name}, ${t.sortOrder})
      on conflict (slug) do update set
        name = excluded.name,
        sort_order = excluded.sort_order
    `
  }
  log.info("seed.event_tiers.done", { count: EVENT_TIER_SEED.length })
}

async function seedPresetImages(
  sql: ReturnType<typeof postgres>,
): Promise<void> {
  log.info("seed.preset_images.start")
  for (const p of PRESET_IMAGE_SEED) {
    await sql`
      insert into preset_images (slug, name, url, sort_order, created_by)
      values (${p.slug}, ${p.name}, ${p.url}, ${p.sortOrder}, ${p.createdBy ?? null})
    on conflict (slug) do update set
      name = excluded.name,
      url = excluded.url,
      sort_order = excluded.sort_order,
      created_by = excluded.created_by,
      updated_at = now()
    `
  }
  log.info("seed.preset_images.done", { count: PRESET_IMAGE_SEED.length })
}

// ─── Content seeds ────────────────────────────────────────────────

async function seedSpots(
  sql: ReturnType<typeof postgres>,
): Promise<Map<string, string>> {
  log.info("seed.spots.start")
  const slugToId = new Map<string, string>()
  let count = 0
  for (const spot of SOURCE_SPOTS) {
    if (!spot.id || !spot.citySlug) {
      log.warn("seed.spots.skip_no_id", { name: spot.name })
      continue
    }
    const slug = spot.id
    const citySlug = spot.citySlug
    const [row] = await sql<{ id: string }[]>`
      insert into spots (
        id, slug, name, city, city_slug, address,
        image_url, crowd_level, country_code, location, created_by
      ) values (
        gen_random_uuid(), ${slug}, ${spot.name}, ${spot.city},
        ${citySlug}, ${spot.address},
        ${spot.image}, ${spot.crowdLevel},
        (select iso2 from countries where name = ${spot.country} limit 1),
        ${pointWkt(spot.location.lat, spot.location.lon)}::geometry,
        ${spot.createdBy ?? null}
      )
      on conflict (slug) do update set
        name = excluded.name,
        city = excluded.city,
        city_slug = excluded.city_slug,
        address = excluded.address,
        image_url = excluded.image_url,
        crowd_level = excluded.crowd_level,
        country_code = excluded.country_code,
        location = excluded.location,
        created_by = excluded.created_by
      returning id
    `
    const spotId = row?.id
    if (spotId) {
      slugToId.set(slug, spotId)
      for (const sport of spot.sports) {
        const slug = sport.toLowerCase()
        await sql`
          insert into spot_sports (spot_id, discipline_slug)
          values (${spotId}, ${slug})
          on conflict do nothing
        `
      }
      // Delete-then-insert the join rows (mirrors `syncSpotTypes` in
      // the repository). This makes the seed self-healing across
      // taxonomy renames — without it, renaming a type in
      // `SPOT_TYPE_SEED` leaves the old join rows in place and a spot
      // ends up carrying both the old and the new type.
      await sql`delete from spot_spot_types where spot_id = ${spotId}`
      for (const typeSlug of spot.types) {
        const slug = typeSlug.toLowerCase()
        await sql`
          insert into spot_spot_types (spot_id, type_slug)
          values (${spotId}, ${slug})
          on conflict do nothing
        `
      }
    }
    count++
  }
  log.info("seed.spots.done", { count })
  return slugToId
}

async function seedSportEvents(
  sql: ReturnType<typeof postgres>,
): Promise<void> {
  log.info("seed.sport_events.start")
  let count = 0
  for (const event of SOURCE_SPORT_EVENTS) {
    const location =
      typeof event.latitude === "number" && typeof event.longitude === "number"
        ? pointWkt(event.latitude, event.longitude)
        : null
    const startAt = `${event.startDate} 00:00:00+00`
    const endAt = event.endDate ? `${event.endDate} 00:00:00+00` : null
    const [row] = await sql<{ id: string }[]>`
      insert into sport_events (
        id, slug, name, short_name, url, image, description,
        start_at, end_at, city, country_code, venue,
        location, tier_slug, featured, created_by
      ) values (
        gen_random_uuid(), ${event.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")},
        ${event.name}, ${event.shortName ?? null},
        ${event.url}, ${event.image}, ${event.description},
        ${startAt}::timestamptz, ${endAt}::timestamptz,
        ${event.city}, ${event.countryCode ?? null}, ${event.venue ?? null},
        ${location}::geometry, ${event.tier}, ${event.featured ?? false},
        ${event.createdBy ?? null}
      )
      on conflict (slug) do update set
        name = excluded.name,
        short_name = excluded.short_name,
        url = excluded.url,
        image = excluded.image,
        description = excluded.description,
        start_at = excluded.start_at,
        end_at = excluded.end_at,
        city = excluded.city,
        country_code = excluded.country_code,
        venue = excluded.venue,
        location = excluded.location,
        tier_slug = excluded.tier_slug,
        featured = excluded.featured,
        created_by = excluded.created_by
      returning id
    `
    const eventId = row?.id
    if (eventId) {
      for (const sport of event.sports) {
        const slug = sport.toLowerCase()
        await sql`
          insert into event_sports (event_id, discipline_slug)
          values (${eventId}, ${slug})
          on conflict do nothing
        `
      }
    }
    count++
  }
  log.info("seed.sport_events.done", { count })
}

async function seedDevSavedSpots(
  sql: ReturnType<typeof postgres>,
  slugToId: Map<string, string>,
): Promise<void> {
  log.info("seed.dev_saved_spots.start")
  let count = 0
  for (const saved of DEV_SAVED_SPOTS) {
    // The seed file uses slugs as the `spotId` key; look up the actual
    // UUID that the spots insert assigned to that slug. If a spot was
    // skipped during seeding, its slug won't have a UUID — skip the
    // saved row too.
    const spotUuid = slugToId.get(saved.spotId)
    if (!spotUuid) {
      log.warn("seed.dev_saved_spots.skip_no_spot", { spotId: saved.spotId })
      continue
    }
    await sql`
      insert into saved_spots (user_id, spot_id)
      values (${saved.userId}, ${spotUuid})
      on conflict (user_id, spot_id) do nothing
    `
    count++
  }
  log.info("seed.dev_saved_spots.done", { count })
}


// ─── Orchestrator ───────────────────────────────────────────────────

async function main() {
  const url = getDatabaseUrl()
  if (!url) throw new Error("DATABASE_URL is not configured")
  const sql = postgres(url, { ssl: "require", max: 1, connect_timeout: 10 })
  try {
    await seedRegions(sql)
    await seedCountries(sql)
    await seedSpotTypes(sql)
    await seedSportDisciplines(sql)
    await seedEventTiers(sql)
    await seedPresetImages(sql)
    const slugToId = await seedSpots(sql)
    await seedDevSavedSpots(sql, slugToId)
    await seedSportEvents(sql)
    log.info("seed.complete")
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
