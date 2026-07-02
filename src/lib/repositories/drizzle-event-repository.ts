import { and, asc, eq, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import { sportEvents, type SportEventRow } from "@/db/schema"
import type { SportEvent, SportEventTier, SportDiscipline } from "@/types/sport-events"
import type {
  SportEventListResult,
  SportEventQuery,
} from "./event-repository"
import type { EventRepository } from "./event-repository"
import type {
  SportEventFacetCountry,
  SportEventFacetDiscipline,
  SportEventFacetTier,
} from "./types"

function toEvent(row: SportEventRow): SportEvent {
  const loc = row.location as { lat: number; lon: number } | null
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.shortName ?? undefined,
    url: row.url,
    image: row.image,
    description: row.description,
    sports: row.sports as readonly SportDiscipline[],
    startDate: row.startDate,
    endDate: row.endDate ?? undefined,
    location: {
      city: row.city,
      country: row.country,
      countryCode: row.countryCode ?? undefined,
      venue: row.venue ?? undefined,
      latitude: loc?.lat,
      longitude: loc?.lon,
    },
    tier: row.tier as SportEventTier,
    featured: row.featured === "true",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export class DrizzleEventRepository implements EventRepository {
  constructor(private readonly db: ReturnType<typeof drizzle>) {}

  async list(query?: SportEventQuery): Promise<SportEventListResult> {
    const limit = query?.limit ?? 50
    const conditions = []
    if (query?.country) conditions.push(eq(sportEvents.country, query.country))
    if (query?.tier) conditions.push(eq(sportEvents.tier, query.tier))
    if (query?.featured) conditions.push(eq(sportEvents.featured, "true"))
    if (query?.discipline)
      conditions.push(sql`${query.discipline} = ANY(${sportEvents.sports})`)
    if (query?.from) conditions.push(sql`${sportEvents.startDate} >= ${query.from}`)
    if (query?.to) conditions.push(sql`coalesce(${sportEvents.endDate}, ${sportEvents.startDate}) <= ${query.to}`)
    if (query?.q) {
      const like = `%${query.q.toLowerCase()}%`
      conditions.push(sql`(
        lower(coalesce(${sportEvents.name}, '')) like ${like}
        or lower(coalesce(${sportEvents.description}, '')) like ${like}
        or lower(coalesce(${sportEvents.city}, '')) like ${like}
        or lower(coalesce(${sportEvents.country}, '')) like ${like}
      )`)
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined
    const baseQuery = this.db.select().from(sportEvents).$dynamic()
    const rows = await (where
      ? baseQuery.where(where)
      : baseQuery
    )
      .orderBy(asc(sportEvents.startDate))
      .limit(limit + 1)
    const items = rows.slice(0, limit).map(toEvent)
    const nextCursor =
      rows.length > limit
        ? (items[items.length - 1]?.startDate ?? null)
        : null
    return { items, nextCursor }
  }

  async findById(id: string): Promise<SportEvent | null> {
    const [row] = await this.db
      .select()
      .from(sportEvents)
      .where(eq(sportEvents.id, id))
      .limit(1)
    return row ? toEvent(row) : null
  }

  async findFeatured(): Promise<SportEvent | null> {
    const [row] = await this.db
      .select()
      .from(sportEvents)
      .where(eq(sportEvents.featured, "true"))
      .limit(1)
    if (row) return toEvent(row)
    const [first] = await this.db
      .select()
      .from(sportEvents)
      .orderBy(asc(sportEvents.startDate))
      .limit(1)
    return first ? toEvent(first) : null
  }

  async listCountries(): Promise<readonly SportEventFacetCountry[]> {
    const rows = await this.db
      .select({ name: sportEvents.country, count: sql<number>`count(*)::int` })
      .from(sportEvents)
      .groupBy(sportEvents.country)
    return rows.map((r) => ({ name: r.name, count: Number(r.count) }))
  }

  async listTiers(): Promise<readonly SportEventFacetTier[]> {
    const rows = await this.db
      .select({ name: sportEvents.tier, count: sql<number>`count(*)::int` })
      .from(sportEvents)
      .groupBy(sportEvents.tier)
    return rows.map((r) => ({
      name: r.name as SportEventTier,
      count: Number(r.count),
    }))
  }

  async listDisciplines(): Promise<readonly SportEventFacetDiscipline[]> {
    const rows = await this.db.execute<{ name: string; count: string }>(sql`
      select s, count(*)::int as count
      from ${sportEvents}, unnest(${sportEvents.sports}) as s
      group by s
      order by s
    `)
    return rows.map((r) => ({
      name: r.name as SportDiscipline,
      count: Number(r.count),
    }))
  }
}