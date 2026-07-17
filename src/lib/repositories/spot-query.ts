import { eq, sql } from "drizzle-orm"
import type { drizzle } from "drizzle-orm/postgres-js"
import {
  countries,
  spotSpotTypes,
  spotSports,
  sportDisciplines,
  spots,
  spotTypes,
} from "@/db/schema"
import type { SportDiscipline } from "@/types/sport-events"
import type { Spot, SpotLocation, SpotTypeRef } from "@/lib/types"
import type { SpotWithImagePath } from "@/lib/supabase/storage"

export const sportsAgg = sql<string[]>`
  coalesce(
    (
      select array_agg(sd.name order by sd.name)
      from ${spotSports} ss
      join ${sportDisciplines} sd on sd.slug = ss.discipline_slug
      where ss.spot_id = ${spots.id}
    ),
    '{}'::text[]
  )
`.as("sports")

/**
 * Aggregates the spot's type tags into a denormalized `{slug, name}[]
 * ordered by the type dimension's `sort_order` then `name`. Each row
 * is a `json` object (Postgres `jsonb_build_object`), so the driver
 * returns the array as a list of plain objects.
 */
export const typesAgg = sql<SpotTypeRef[]>`
  coalesce(
    (
      select array_agg(
        json_build_object('slug', st.slug, 'name', st.name)
        order by st.sort_order, st.name
      )
      from ${spotSpotTypes} sst
      join ${spotTypes} st on st.slug = sst.type_slug
      where sst.spot_id = ${spots.id}
    ),
    '{}'::json[]
  )
`.as("types")

export interface JoinedSpotRow {
  id: string
  slug: string
  name: string
  city: string
  citySlug: string
  address: string
  types: SpotTypeRef[]
  sports: string[]
  imageUrl: string
  imagePath: string | null
  crowdLevel: number
  country: string
  countryCode: string | null
  location: SpotLocation
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}

export function joinedSpotSelect(
  db: ReturnType<typeof drizzle>,
) {
  return db
    .select({
      id: spots.id,
      slug: spots.slug,
      name: spots.name,
      city: spots.city,
      citySlug: spots.citySlug,
      address: spots.address,
      types: typesAgg,
      sports: sportsAgg,
      imageUrl: spots.imageUrl,
      imagePath: spots.imagePath,
      crowdLevel: spots.crowdLevel,
      country: countries.name,
      countryCode: spots.countryCode,
      location: spots.location,
      createdBy: spots.createdBy,
      createdAt: spots.createdAt,
      updatedAt: spots.updatedAt,
    })
    .from(spots)
    .leftJoin(countries, eq(countries.iso2, spots.countryCode))
    .$dynamic()
}

export function rowToSpot(row: JoinedSpotRow): Spot {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    citySlug: row.citySlug,
    address: row.address,
    types: row.types ?? [],
    sports: row.sports as readonly SportDiscipline[],
    image: row.imagePath ?? row.imageUrl,
    crowdLevel: row.crowdLevel,
    country: row.country,
    countryCode: row.countryCode ?? "",
    location: row.location,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function rowToSpotWithImagePath(row: JoinedSpotRow): SpotWithImagePath {
  return { spot: rowToSpot(row), imagePath: row.imagePath }
}
