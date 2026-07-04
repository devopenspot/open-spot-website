import { and, asc, desc, eq, ilike, inArray, isNotNull, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import { spots, type NewSpotRow, type SpotRow } from "@/db/schema"
import type { SportDiscipline } from "@/types/sport-events"
import type { Spot, SpotLocation, SpotType } from "@/lib/types"
import type {
  NewSpot,
  SpotListResult,
  SpotPatch,
  SpotQuery,
} from "./types"
import type { SpotRepository } from "./spot-repository"
import { hashToUnitInterval } from "@/lib/spots/geo"
import { withImageUrls, type SpotWithImagePath } from "@/lib/supabase/storage"

const DEFAULT_REGION = "Americas"
const EARTH_RADIUS_METERS = 6_371_000

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a))
}

function toRawSpot(row: SpotRow): SpotWithImagePath {
  return {
    spot: {
      id: row.id,
      slug: row.slug,
      name: row.name,
      city: row.city,
      citySlug: row.citySlug,
      address: row.address,
      type: row.type as SpotType,
      features: row.features as readonly string[],
      sports: row.sports as readonly SportDiscipline[],
      image: row.imagePath ?? row.imageUrl,
      communityNote: row.communityNote,
      crowdLevel: row.crowdLevel,
      crowdLevelLabel: row.crowdLevelLabel,
      country: row.country,
      location: row.location as SpotLocation,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
    imagePath: row.imagePath,
  }
}

export class DrizzleSpotRepository implements SpotRepository {
  constructor(private readonly db: ReturnType<typeof drizzle>) {}

  async list(query?: SpotQuery): Promise<SpotListResult> {
    const limit = query?.limit ?? 50
    const conditions = []
    if (query?.type) conditions.push(eq(spots.type, query.type))
    if (query?.country) conditions.push(eq(spots.country, query.country))
    if (query?.city) conditions.push(eq(spots.citySlug, query.city))
    if (query?.ids && query.ids.length > 0)
      conditions.push(inArray(spots.id, [...query.ids]))
    if (query?.q) {
      const like = `%${query.q.toLowerCase()}%`
      conditions.push(sql`(
        lower(coalesce(${spots.name}, '')) like ${like}
        or lower(coalesce(${spots.city}, '')) like ${like}
        or lower(coalesce(${spots.address}, '')) like ${like}
        or lower(coalesce(${spots.country}, '')) like ${like}
        or exists (select 1 from unnest(${spots.features}) f where lower(f) like ${like})
      )`)
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined

    // Apply PostGIS bbox + ST_DWithin for nearby.
    let baseQuery = this.db.select().from(spots).$dynamic()
    if (query?.near) {
      const point = sql`ST_SetSRID(ST_MakePoint(${query.near.lon}, ${query.near.lat}), 4326)`
      baseQuery = baseQuery.where(
        sql`ST_DWithin(${spots.location}, ${point}, ${query.near.radiusMeters})`,
      )
    }
    const rows = await (where
      ? baseQuery.where(where)
      : baseQuery
    )
      .orderBy(query?.cursor ? asc(spots.slug) : asc(spots.slug))
      .limit(limit + 1)

    const raws = rows.slice(0, limit).map(toRawSpot)
    let items = await withImageUrls(raws)
    if (query?.near) {
      items = items
        .map((s) => ({
          spot: s,
          d: haversineMeters(
            query.near!.lat,
            query.near!.lon,
            s.location.lat,
            s.location.lon,
          ),
        }))
        .sort((a, b) => a.d - b.d)
        .map((x) => x.spot)
    }
    const nextCursor =
      rows.length > limit
        ? (items[items.length - 1]?.slug ?? null)
        : null
    return { items, nextCursor }
  }

  async findById(id: string): Promise<Spot | null> {
    const [row] = await this.db
      .select()
      .from(spots)
      .where(eq(spots.id, id))
      .limit(1)
    if (!row) return null
    const [spot] = await withImageUrls([toRawSpot(row)])
    return spot ?? null
  }

  async findBySlug(slug: string): Promise<Spot | null> {
    const [row] = await this.db
      .select()
      .from(spots)
      .where(eq(spots.slug, slug))
      .limit(1)
    if (!row) return null
    const [spot] = await withImageUrls([toRawSpot(row)])
    return spot ?? null
  }

  async findNearby(params: {
    lat: number
    lon: number
    radiusMeters: number
  }): Promise<readonly Spot[]> {
    const point = sql`ST_SetSRID(ST_MakePoint(${params.lon}, ${params.lat}), 4326)`
    const rows = await this.db
      .select()
      .from(spots)
      .where(
        sql`ST_DWithin(${spots.location}, ${point}, ${params.radiusMeters})`,
      )
      .limit(200)
    return withImageUrls(rows.map(toRawSpot))
  }

  async listCountries(): Promise<readonly { name: string; region: string; count: number }[]> {
    const rows = await this.db.execute<{ country: string; region: string; count: string }>(sql`
      select s.country, coalesce(cr.region, ${DEFAULT_REGION}) as region, count(*)::int as count
      from ${spots} s
      left join country_regions cr on cr.country = s.country
      where s.country <> ''
      group by s.country, coalesce(cr.region, ${DEFAULT_REGION})
      order by s.country
    `)
    return rows.map((r) => ({
      name: r.country,
      region: r.region,
      count: Number(r.count),
    }))
  }

  async listCountriesForRegion(
    region: string,
  ): Promise<readonly { name: string; count: number }[]> {
    const all = await this.listCountries()
    return all
      .filter((c) => c.region === region)
      .map((c) => ({ name: c.name, count: c.count }))
  }

  async listTypes(): Promise<readonly { name: SpotType; count: number }[]> {
    const rows = await this.db
      .select({ name: spots.type, count: sql<number>`count(*)::int` })
      .from(spots)
      .groupBy(spots.type)
    return rows.map((r) => ({ name: r.name as SpotType, count: Number(r.count) }))
  }

  async listRegions(): Promise<
    readonly { name: string; countryCount: number; spotCount: number }[]
  > {
    const rows = await this.db.execute<{ region: string; country_count: string; spot_count: string }>(sql`
      select
        coalesce(cr.region, ${DEFAULT_REGION}) as region,
        count(distinct s.country)::int as country_count,
        count(*)::int as spot_count
      from ${spots} s
      left join country_regions cr on cr.country = s.country
      where s.country <> ''
      group by coalesce(cr.region, ${DEFAULT_REGION})
    `)
    return rows.map((r) => ({
      name: r.region,
      countryCount: Number(r.country_count),
      spotCount: Number(r.spot_count),
    }))
  }

  async create(input: NewSpot): Promise<Spot> {
    const insertValues: NewSpotRow = {
      id: input.id ?? crypto.randomUUID(),
      slug: `${input.citySlug}-${Date.now()}`,
      name: input.name.toUpperCase(),
      city: input.city,
      citySlug: input.citySlug ?? input.city.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      address: input.address,
      type: input.type,
      features: [...input.features],
      sports: [...input.sports],
      imageUrl: input.image,
      imagePath: input.imagePath ?? null,
      communityNote: input.communityNote,
      crowdLevel: input.crowdLevel,
      crowdLevelLabel: input.crowdLevelLabel,
      country: input.country,
      location: input.location as unknown as SpotRow["location"],
      createdBy: input.createdBy,
    }
    const [row] = await this.db
      .insert(spots)
      .values(insertValues)
      .returning()
    if (!row) throw new Error("Insert returned no row")
    const [spot] = await withImageUrls([toRawSpot(row)])
    if (!spot) throw new Error("withImageUrls returned no spot")
    return spot
  }

  async update(id: string, patch: SpotPatch): Promise<Spot> {
    const [row] = await this.db
      .update(spots)
      .set({
        ...patch,
        updatedAt: new Date(),
      })
      .where(eq(spots.id, id))
      .returning()
    if (!row) throw new Error(`Spot not found: ${id}`)
    const [spot] = await withImageUrls([toRawSpot(row)])
    if (!spot) throw new Error(`Spot not found: ${id}`)
    return spot
  }

  async delete(id: string): Promise<void> {
    const result = await this.db.delete(spots).where(eq(spots.id, id)).returning({ id: spots.id })
    if (result.length === 0) throw new Error(`Spot not found: ${id}`)
  }
}

// Suppress unused import warnings while keeping the symbols for future use.
void hashToUnitInterval
void isNotNull
void ilike
void desc
