import { eq, sql, type SQL } from "drizzle-orm";
import type { drizzle } from "drizzle-orm/postgres-js";
import {
  countries,
  spotSpotTypes,
  spotSports,
  sportDisciplines,
  spots,
  spotTypes,
} from "@/db/schema";
import type { SportDiscipline } from "@/types/sport-events";
import type { Spot, SpotLocation, SpotTypeRef } from "@/lib/types";
import type { SpotWithImagePath } from "@/lib/supabase/storage";

/**
 * Aggregates the spot's type tags into a denormalized `{slug, name}[]`
 * ordered by the type dimension's `sort_order` then `name`. Each row
 * is a `json` object (Postgres `json_build_object`), so the driver
 * returns the array as a list of plain objects.
 *
 * The previous implementation was a correlated subquery that re-ran
 * the aggregate for every row in the outer spots query. With
 * `SPOT_LIST_HARD_CAP = 500` that hit the 8s server
 * `statement_timeout` (`57014 canceling statement due to statement
 * timeout`). Aggregating once into a derived table and LEFT JOINing
 * back is O(N) — one pass per join table — instead of O(N²).
 */
function typesAggregated(db: ReturnType<typeof drizzle>) {
  return db
    .select({
      spotId: spotSpotTypes.spotId,
      types: sql<SpotTypeRef[]>`
        array_agg(
          json_build_object('slug', ${spotTypes.slug}, 'name', ${spotTypes.name})
          order by ${spotTypes.sortOrder}, ${spotTypes.name}
        )
      `.as("types"),
    })
    .from(spotSpotTypes)
    .innerJoin(spotTypes, eq(spotTypes.slug, spotSpotTypes.typeSlug))
    .groupBy(spotSpotTypes.spotId)
    .as("types_agg");
}

function sportsAggregated(db: ReturnType<typeof drizzle>) {
  return db
    .select({
      spotId: spotSports.spotId,
      sports: sql<string[]>`
        array_agg(${sportDisciplines.name} order by ${sportDisciplines.name})
      `.as("sports"),
    })
    .from(spotSports)
    .innerJoin(
      sportDisciplines,
      eq(sportDisciplines.slug, spotSports.disciplineSlug),
    )
    .groupBy(spotSports.spotId)
    .as("sports_agg");
}

export interface JoinedSpotRow {
  id: string;
  slug: string;
  name: string;
  city: string;
  citySlug: string;
  address: string;
  types: SpotTypeRef[];
  sports: string[];
  imageUrl: string;
  imagePath: string | null;
  country: string;
  countryCode: string | null;
  location: SpotLocation;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * `COALESCE(..., '{}'::json[])` on the LEFT JOINed aggregates keeps
 * the row shape stable for spots with no types or no sports — the
 * correlated-subquery form produced an empty array via the inner
 * `coalesce(..., '{}'::json[])`; the joined form produces NULL when
 * the spot has no rows in the join table, which `COALESCE` folds to
 * the same empty array. The result type is unchanged for callers.
 */
const emptyTypes: SQL = sql`'{}'::json[]`;
const emptySports: SQL = sql`'{}'::text[]`;

export function joinedSpotSelect(db: ReturnType<typeof drizzle>) {
  const typesAgg = typesAggregated(db);
  const sportsAgg = sportsAggregated(db);
  return db
    .select({
      id: spots.id,
      slug: spots.slug,
      name: spots.name,
      city: spots.city,
      citySlug: spots.citySlug,
      address: spots.address,
      types: sql<SpotTypeRef[]>`coalesce(${typesAgg.types}, ${emptyTypes})`,
      sports: sql<string[]>`coalesce(${sportsAgg.sports}, ${emptySports})`,
      imageUrl: spots.imageUrl,
      imagePath: spots.imagePath,
      country: countries.name,
      countryCode: spots.countryCode,
      location: spots.location,
      createdBy: spots.createdBy,
      createdAt: spots.createdAt,
      updatedAt: spots.updatedAt,
    })
    .from(spots)
    .leftJoin(countries, eq(countries.iso2, spots.countryCode))
    .leftJoin(typesAgg, eq(typesAgg.spotId, spots.id))
    .leftJoin(sportsAgg, eq(sportsAgg.spotId, spots.id))
    .$dynamic();
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
    country: row.country,
    countryCode: row.countryCode ?? "",
    location: row.location,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function rowToSpotWithImagePath(row: JoinedSpotRow): SpotWithImagePath {
  return { spot: rowToSpot(row), imagePath: row.imagePath };
}
