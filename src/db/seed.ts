// Seeds the static dimension tables (regions, countries, spot types,
// sport disciplines, event tiers) and the content tables (spots,
// sport events).
//
// Spot and sport-event writes go through `DrizzleSpotRepository` and
// `DrizzleEventRepository` so there is exactly one code path that
// writes those tables. Both repos upsert on the unique slug index, so
// the seed is idempotent — re-running it updates the same rows in
// place instead of erroring on the unique constraint or duplicating
// join rows.

import "./load-env"
import { sql } from "drizzle-orm"
import { closeDb, getDbClient } from "@/lib/db/client"
import { DrizzleEventRepository } from "@/lib/repositories/drizzle-event-repository"
import { DrizzleSpotRepository } from "@/lib/repositories/drizzle-spot-repository"
import { log } from "@/lib/log"
import {
  EVENT_TIER_SEED,
  SPORT_DISCIPLINE_SEED,
  SPOT_TYPE_SEED,
} from "./seed-data/taxonomy"
import { REGION_SEED } from "./seed-data/regions"
import { buildCountrySeed, type CountrySeed } from "./seed-data/countries"
import { SOURCE_SPOTS } from "./seed-data/spots"
import { SOURCE_SPORT_EVENTS } from "./seed-data/sport-events"

type Db = ReturnType<typeof getDbClient>["db"]

// ─── Dimension seeds ────────────────────────────────────────────────

async function seedRegions(db: Db): Promise<void> {
  log.info("seed.regions.start")
  for (const r of REGION_SEED) {
    await db.execute(sql`
      insert into regions (slug, name, description, image_url, sort_order)
      values (${r.slug}, ${r.name}, ${r.desc}, ${r.image}, ${r.sortOrder})
      on conflict (slug) do update set
        name = excluded.name,
        description = excluded.description,
        image_url = excluded.image_url,
        sort_order = excluded.sort_order,
        updated_at = now()
    `)
  }
  log.info("seed.regions.done", { count: REGION_SEED.length })
}

async function seedCountries(db: Db): Promise<void> {
  log.info("seed.countries.start")
  const countries: readonly CountrySeed[] = buildCountrySeed()
  const regionRows = await db.execute<{ id: string; name: string }>(sql`
    select id, name from regions
  `)
  const regionIdByName = new Map(regionRows.map((r) => [r.name, r.id]))
  let count = 0
  for (const c of countries) {
    const regionId = regionIdByName.get(c.region)
    if (!regionId) {
      log.warn("seed.countries.skip_no_region", { country: c.name })
      continue
    }
    await db.execute(sql`
      insert into countries (iso2, name, iso3, region_id)
      values (${c.iso2}, ${c.name}, ${c.iso3 || null}, ${regionId})
      on conflict (iso2) do update set
        name = excluded.name,
        iso3 = excluded.iso3,
        region_id = excluded.region_id,
        updated_at = now()
    `)
    count++
  }
  log.info("seed.countries.done", { count })
}

async function seedSpotTypes(db: Db): Promise<void> {
  log.info("seed.spot_types.start")
  for (const t of SPOT_TYPE_SEED) {
    await db.execute(sql`
      insert into spot_types (slug, name, sort_order)
      values (${t.slug}, ${t.name}, ${t.sortOrder})
      on conflict (slug) do update set
        name = excluded.name,
        sort_order = excluded.sort_order
    `)
  }
  log.info("seed.spot_types.done", { count: SPOT_TYPE_SEED.length })
}

async function seedSportDisciplines(db: Db): Promise<void> {
  log.info("seed.sport_disciplines.start")
  for (const d of SPORT_DISCIPLINE_SEED) {
    await db.execute(sql`
      insert into sport_disciplines (slug, name, sort_order)
      values (${d.slug}, ${d.name}, ${d.sortOrder})
      on conflict (slug) do update set
        name = excluded.name,
        sort_order = excluded.sort_order
    `)
  }
  log.info("seed.sport_disciplines.done", {
    count: SPORT_DISCIPLINE_SEED.length,
  })
}

async function seedEventTiers(db: Db): Promise<void> {
  log.info("seed.event_tiers.start")
  for (const t of EVENT_TIER_SEED) {
    await db.execute(sql`
      insert into event_tiers (slug, name, sort_order)
      values (${t.slug}, ${t.name}, ${t.sortOrder})
      on conflict (slug) do update set
        name = excluded.name,
        sort_order = excluded.sort_order
    `)
  }
  log.info("seed.event_tiers.done", { count: EVENT_TIER_SEED.length })
}

// ─── Content seeds ────────────────────────────────────────────────

async function seedSpots(repo: DrizzleSpotRepository): Promise<void> {
  log.info("seed.spots.start")
  let count = 0
  for (const spot of SOURCE_SPOTS) {
    // The source data's `id` is the stable seed slug (per the
    // `seed-data/spots.ts` header). It's NOT a UUID, so we must not
    // pass it as the DB `id` — the repo would reject the
    // non-UUID `uuid` column. Destructure it out and use it as the
    // `slug` upsert key instead.
    const { id: slug, ...rest } = spot
    if (!slug || !rest.citySlug) {
      log.warn("seed.spots.skip_no_id", { name: spot.name })
      continue
    }
    // `upsertBySlug` skips the read-path reload (no
    // `withImageUrls` round-trip), so this CLI does not pull in
    // `server-only` from `@/lib/supabase/storage`.
    await repo.upsertBySlug({ ...rest, slug })
    count++
  }
  log.info("seed.spots.done", { count })
}

async function seedSportEvents(
  repo: DrizzleEventRepository,
): Promise<void> {
  log.info("seed.sport_events.start")
  let count = 0
  for (const event of SOURCE_SPORT_EVENTS) {
    // `event.slug` is the stable seed key (mapped from the source
    // `id` in `seed-data/sport-events.ts`). The repo's
    // `upsertBySlug` upserts on it and returns the row id without
    // reloading, so re-running the seed is idempotent and the CLI
    // does not pull in any read-path modules.
    await repo.upsertBySlug(event)
    count++
  }
  log.info("seed.sport_events.done", { count })
}

// ─── Orchestrator ───────────────────────────────────────────────────

async function main() {
  const { db } = getDbClient()
  const spotRepo = new DrizzleSpotRepository(db)
  const eventRepo = new DrizzleEventRepository(db)
  try {
    await seedRegions(db)
    await seedCountries(db)
    await seedSpotTypes(db)
    await seedSportDisciplines(db)
    await seedEventTiers(db)
    await seedSpots(spotRepo)
    await seedSportEvents(eventRepo)
    log.info("seed.complete")
  } finally {
    await closeDb()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
