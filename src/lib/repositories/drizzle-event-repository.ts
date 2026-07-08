import { and, asc, eq, sql, type SQL } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import {
  countries,
  eventSports,
  eventTiers,
  sportDisciplines,
  sportEvents,
  type NewSportEventRow,
} from "@/db/schema"
import type {
  SportEvent,
  SportEventTier,
  SportDiscipline,
} from "@/types/sport-events"
import type {
  SportEventListResult,
  SportEventQuery,
} from "./event-repository"
import type { EventRepository } from "./event-repository"
import type {
  NewSportEvent,
  SportEventPatch,
  SportEventFacetCountry,
  SportEventFacetDiscipline,
  SportEventFacetTier,
} from "./types"

const sportsAgg = sql<string[]>`
  coalesce(
    (
      select array_agg(sd.name order by sd.name)
      from ${eventSports} es
      join ${sportDisciplines} sd on sd.slug = es.discipline_slug
      where es.event_id = ${sportEvents.id}
    ),
    '{}'::text[]
  )
`.as("sports")

interface JoinedEventRow {
  id: string
  slug: string
  name: string
  shortName: string | null
  url: string
  image: string
  description: string
  sports: string[]
  tier: string
  startAt: Date
  endAt: Date | null
  city: string
  country: string
  countryCode: string | null
  venue: string | null
  location: { lat: number; lon: number } | null
  featured: boolean
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}

function dateOnly(d: Date | null): string {
  if (!d) return ""
  return d.toISOString().slice(0, 10)
}

function toEvent(row: JoinedEventRow): SportEvent {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.shortName ?? undefined,
    url: row.url,
    image: row.image,
    description: row.description,
    sports: row.sports as readonly SportDiscipline[],
    startDate: dateOnly(row.startAt),
    endDate: row.endAt ? dateOnly(row.endAt) : undefined,
    location: {
      city: row.city,
      country: row.country,
      countryCode: row.countryCode ?? undefined,
      venue: row.venue ?? undefined,
      latitude: row.location?.lat,
      longitude: row.location?.lon,
    },
    tier: row.tier as SportEventTier,
    featured: row.featured,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function sportDisciplineTitleToSlug(title: string): string {
  return title.toLowerCase()
}

export class DrizzleEventRepository implements EventRepository {
  constructor(private readonly db: ReturnType<typeof drizzle>) {}

  private selectJoined() {
    return this.db
      .select({
        id: sportEvents.id,
        slug: sportEvents.slug,
        name: sportEvents.name,
        shortName: sportEvents.shortName,
        url: sportEvents.url,
        image: sportEvents.image,
        description: sportEvents.description,
        sports: sportsAgg,
        tier: eventTiers.slug,
        startAt: sportEvents.startAt,
        endAt: sportEvents.endAt,
        city: sportEvents.city,
        country: countries.name,
        countryCode: sportEvents.countryCodeFk,
        venue: sportEvents.venue,
        location: sportEvents.location,
        featured: sportEvents.featuredV2,
        createdBy: sportEvents.createdBy,
        createdAt: sportEvents.createdAt,
        updatedAt: sportEvents.updatedAt,
      })
      .from(sportEvents)
      .leftJoin(eventTiers, eq(eventTiers.slug, sportEvents.tierSlug))
      .leftJoin(
        countries,
        eq(countries.iso2, sportEvents.countryCodeFk),
      )
      .$dynamic()
  }

  async list(query?: SportEventQuery): Promise<SportEventListResult> {
    const limit = query?.limit ?? 50
    const conditions: SQL[] = []
    if (query?.country) conditions.push(eq(sportEvents.country, query.country))
    if (query?.tier)
      conditions.push(eq(sportEvents.tierSlug, query.tier))
    if (query?.featured)
      conditions.push(eq(sportEvents.featuredV2, true))
    if (query?.discipline)
      conditions.push(
        sql`${query.discipline.toLowerCase()} = (
          select lower(sd.name) from ${eventSports} es
          join ${sportDisciplines} sd on sd.slug = es.discipline_slug
          where es.event_id = ${sportEvents.id} limit 1
        )`,
      )
    if (query?.from)
      conditions.push(sql`${sportEvents.startAt} >= ${query.from}::timestamptz`)
    if (query?.to)
      conditions.push(
        sql`coalesce(${sportEvents.endAt}, ${sportEvents.startAt}) <= ${query.to}::timestamptz`,
      )
    if (query?.q) {
      const like = `%${query.q.toLowerCase()}%`
      conditions.push(sql`(
        lower(coalesce(${sportEvents.name}, '')) like ${like}
        or lower(coalesce(${sportEvents.description}, '')) like ${like}
        or lower(coalesce(${sportEvents.city}, '')) like ${like}
        or lower(coalesce(${countries.name}, '')) like ${like}
      )`)
    }
    const where =
      conditions.length > 0
        ? and(...conditions.map((c) => c as SQL | undefined).filter(Boolean) as SQL[])
        : undefined

    const rows = await (where
      ? this.selectJoined().where(where)
      : this.selectJoined()
    )
      .orderBy(asc(sportEvents.startAt))
      .limit(limit + 1)
    const items = (rows as unknown as JoinedEventRow[]).slice(0, limit).map(toEvent)
    const nextCursor =
      rows.length > limit
        ? (items[items.length - 1]?.startDate ?? null)
        : null
    return { items, nextCursor }
  }

  async findById(id: string): Promise<SportEvent | null> {
    const rows = await this.selectJoined()
      .where(eq(sportEvents.id, id))
      .limit(1)
    const row = (rows as unknown as JoinedEventRow[])[0]
    return row ? toEvent(row) : null
  }

  async findFeatured(): Promise<SportEvent | null> {
    const rows = await this.selectJoined()
      .where(eq(sportEvents.featuredV2, true))
      .limit(1)
    const row = (rows as unknown as JoinedEventRow[])[0]
    if (row) return toEvent(row)
    const fallback = await this.selectJoined()
      .orderBy(asc(sportEvents.startAt))
      .limit(1)
    const first = (fallback as unknown as JoinedEventRow[])[0]
    return first ? toEvent(first) : null
  }

  async listCountries(): Promise<readonly SportEventFacetCountry[]> {
    const rows = await this.db.execute<{ country: string; count: string }>(sql`
      select c.name as country, count(*)::int as count
      from ${sportEvents} se
      join ${countries} c on c.iso2 = se.country_code_fk
      group by c.name
      order by c.name
    `)
    return rows.map((r) => ({ name: r.country, count: Number(r.count) }))
  }

  async listTiers(): Promise<readonly SportEventFacetTier[]> {
    const rows = await this.db.execute<{ tier: string; count: string }>(sql`
      select et.slug as tier, count(*)::int as count
      from ${sportEvents} se
      join ${eventTiers} et on et.slug = se.tier_slug
      group by et.slug
      order by et.slug
    `)
    return rows.map((r) => ({
      name: r.tier as SportEventTier,
      count: Number(r.count),
    }))
  }

  async listDisciplines(): Promise<readonly SportEventFacetDiscipline[]> {
    const rows = await this.db.execute<{ name: string; count: string }>(sql`
      select sd.name, count(*)::int as count
      from ${eventSports} es
      join ${sportDisciplines} sd on sd.slug = es.discipline_slug
      group by sd.name
      order by sd.name
    `)
    return rows.map((r) => ({
      name: r.name as SportDiscipline,
      count: Number(r.count),
    }))
  }

  private async syncEventSports(
    eventId: string,
    disciplines: readonly SportDiscipline[],
  ): Promise<void> {
    await this.db
      .delete(eventSports)
      .where(eq(eventSports.eventId, eventId))
    if (disciplines.length === 0) return
    const slugs = disciplines.map(sportDisciplineTitleToSlug)
    await this.db
      .insert(eventSports)
      .values(
        slugs.map((disciplineSlug) => ({ eventId, disciplineSlug })),
      )
  }

  async create(input: NewSportEvent): Promise<SportEvent> {
    const id = crypto.randomUUID()
    const slug = `${slugify(input.name)}-${Date.now()}`
    const startAtTsql = `${input.startDate} 00:00:00+00`
    const endAtTsql = input.endDate ? `${input.endDate} 00:00:00+00` : null
    const location =
      typeof input.latitude === "number" && typeof input.longitude === "number"
        ? ({ lat: input.latitude, lon: input.longitude } as unknown as NewSportEventRow["location"])
        : null

    const insertValues: NewSportEventRow = {
      id,
      slug,
      name: input.name,
      shortName: input.shortName ?? null,
      url: input.url,
      image: input.image,
      description: input.description,
      sports: [...input.sports],
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      startAt: sql`${startAtTsql}::timestamptz` as unknown as Date,
      endAt: endAtTsql
        ? (sql`${endAtTsql}::timestamptz` as unknown as Date)
        : null,
      city: input.city,
      country: input.country,
      countryCode: input.countryCode ?? null,
      countryCodeFk: input.countryCode
        ? (input.countryCode as unknown as NewSportEventRow["countryCodeFk"])
        : (sql<string | null>`(select iso2 from ${countries} where name = ${input.country} limit 1)` as unknown as string),
      venue: input.venue ?? null,
      location,
      tier: input.tier as unknown as NewSportEventRow["tier"],
      tierSlug: input.tier,
      featured: input.featured ? "true" : null,
      featuredV2: input.featured,
      createdBy: null,
    }
    const [row] = await this.db
      .insert(sportEvents)
      .values(insertValues)
      .returning()
    if (!row) throw new Error("Insert returned no row")
    await this.syncEventSports(id, input.sports)
    const reloaded = await this.findById(id)
    if (!reloaded) throw new Error("Event not found after insert")
    return reloaded
  }

  async update(id: string, patch: SportEventPatch): Promise<SportEvent> {
    const setValues: Record<string, unknown> = {
      updatedAt: new Date(),
    }
    if (patch.name !== undefined) setValues.name = patch.name
    if (patch.shortName !== undefined) setValues.shortName = patch.shortName
    if (patch.url !== undefined) setValues.url = patch.url
    if (patch.image !== undefined) setValues.image = patch.image
    if (patch.description !== undefined) setValues.description = patch.description
    if (patch.sports !== undefined) setValues.sports = [...patch.sports]
    if (patch.startDate !== undefined) {
      setValues.startDate = patch.startDate
      setValues.startAt =
        sql`${patch.startDate} 00:00:00+00::timestamptz` as unknown as Date
    }
    if (patch.endDate !== undefined) {
      setValues.endDate = patch.endDate
      if (patch.endDate === null || patch.endDate === "") {
        setValues.endAt = null
      } else {
        setValues.endAt =
          sql`${patch.endDate} 00:00:00+00::timestamptz` as unknown as Date
      }
    }
    if (patch.city !== undefined) setValues.city = patch.city
    if (patch.country !== undefined) setValues.country = patch.country
    if (patch.countryCode !== undefined) {
      setValues.countryCode = patch.countryCode
      setValues.countryCodeFk = patch.countryCode as unknown as NewSportEventRow["countryCodeFk"]
    } else if (patch.country !== undefined) {
      setValues.countryCodeFk =
        sql<string | null>`(select iso2 from ${countries} where name = ${patch.country} limit 1)` as unknown as string
    }
    if (patch.venue !== undefined) setValues.venue = patch.venue
    if (patch.tier !== undefined) {
      setValues.tier = patch.tier as unknown as NewSportEventRow["tier"]
      setValues.tierSlug = patch.tier
    }
    if (patch.featured !== undefined) {
      setValues.featured = patch.featured ? "true" : null
      setValues.featuredV2 = patch.featured
    }
    if (patch.latitude !== undefined && patch.longitude !== undefined) {
      setValues.location = {
        lat: patch.latitude,
        lon: patch.longitude,
      } as unknown as NewSportEventRow["location"]
    }

    const [row] = await this.db
      .update(sportEvents)
      .set(setValues as Partial<NewSportEventRow>)
      .where(eq(sportEvents.id, id))
      .returning()
    if (!row) throw new Error(`Sport event not found: ${id}`)
    if (patch.sports !== undefined) {
      await this.syncEventSports(id, patch.sports)
    }
    const reloaded = await this.findById(id)
    if (!reloaded) throw new Error(`Sport event not found: ${id}`)
    return reloaded
  }

  async delete(id: string): Promise<void> {
    const result = await this.db
      .delete(sportEvents)
      .where(eq(sportEvents.id, id))
      .returning({ id: sportEvents.id })
    if (result.length === 0) throw new Error(`Sport event not found: ${id}`)
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
