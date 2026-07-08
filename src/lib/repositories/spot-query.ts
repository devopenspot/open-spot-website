import { eq, sql } from "drizzle-orm"
import type { drizzle } from "drizzle-orm/postgres-js"
import {
  countries,
  spotFeatureLinks,
  spotFeatures,
  spotSports,
  spotTypes,
  sportDisciplines,
  spots,
} from "@/db/schema"
import type { SportDiscipline } from "@/types/sport-events"
import type { Spot, SpotLocation, SpotType } from "@/lib/types"
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

export const featuresAgg = sql<string[]>`
  coalesce(
    (
      select array_agg(sf.name order by sf.name)
      from ${spotFeatureLinks} sfl
      join ${spotFeatures} sf on sf.slug = sfl.feature_slug
      where sfl.spot_id = ${spots.id}
    ),
    '{}'::text[]
  )
`.as("features")

export interface JoinedSpotRow {
  id: string
  slug: string
  name: string
  city: string
  citySlug: string
  address: string
  type: string
  features: string[]
  sports: string[]
  imageUrl: string
  imagePath: string | null
  communityNote: string
  crowdLevel: number
  crowdLevelLabel: string
  country: string
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
      type: spotTypes.name,
      features: featuresAgg,
      sports: sportsAgg,
      imageUrl: spots.imageUrl,
      imagePath: spots.imagePath,
      communityNote: spots.communityNote,
      crowdLevel: spots.crowdLevel,
      crowdLevelLabel: spots.crowdLevelLabel,
      country: countries.name,
      location: spots.location,
      createdBy: spots.createdBy,
      createdAt: spots.createdAt,
      updatedAt: spots.updatedAt,
    })
    .from(spots)
    .leftJoin(spotTypes, eq(spotTypes.slug, spots.typeSlug))
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
    type: row.type as SpotType,
    features: row.features,
    sports: row.sports as readonly SportDiscipline[],
    image: row.imagePath ?? row.imageUrl,
    communityNote: row.communityNote,
    crowdLevel: row.crowdLevel,
    crowdLevelLabel: row.crowdLevelLabel,
    country: row.country,
    location: row.location,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function rowToSpotWithImagePath(row: JoinedSpotRow): SpotWithImagePath {
  return { spot: rowToSpot(row), imagePath: row.imagePath }
}
