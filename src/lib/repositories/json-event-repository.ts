import sportEventsJson from "@/data/sport-events.json"
import { SportEventSchema } from "@/lib/schemas/event"
import type { SportEvent } from "@/types/sport-events"
import type {
  NewSportEvent,
  SportEventPatch,
  SportEventFacetCountry,
  SportEventFacetDiscipline,
  SportEventFacetTier,
} from "./types"
import type { EventRepository, SportEventListResult, SportEventQuery } from "./event-repository"

const SOURCE_EVENTS: readonly SportEvent[] = Object.freeze(
  SportEventSchema.array().parse(sportEventsJson),
)

function matchesQuery(event: SportEvent, query: SportEventQuery): boolean {
  if (query.country && event.location.country !== query.country) return false
  if (query.tier && event.tier !== query.tier) return false
  if (query.featured && !event.featured) return false
  if (query.discipline && !event.sports.includes(query.discipline)) return false
  if (query.from && event.startDate < query.from) return false
  if (query.to && (event.endDate ?? event.startDate) > query.to) return false
  if (query.q) {
    const haystack = `${event.name} ${event.description} ${event.location.city} ${event.location.country}`.toLowerCase()
    if (!haystack.includes(query.q.toLowerCase())) return false
  }
  return true
}

export class JsonEventRepository implements EventRepository {
  private events: SportEvent[]

  constructor(events: readonly SportEvent[] = SOURCE_EVENTS) {
    this.events = [...events]
  }

  async list(query?: SportEventQuery): Promise<SportEventListResult> {
    const limit = query?.limit ?? 50
    const filtered = query ? this.events.filter((e) => matchesQuery(e, query)) : [...this.events]
    const sorted = [...filtered].sort((a, b) => a.startDate.localeCompare(b.startDate))
    const startIdx = query?.cursor
      ? sorted.findIndex((e) => e.startDate > query.cursor!)
      : 0
    const sliceStart = startIdx < 0 ? sorted.length : startIdx
    const items = sorted.slice(sliceStart, sliceStart + limit)
    const nextCursor =
      sliceStart + limit < sorted.length ? (items[items.length - 1]?.startDate ?? null) : null
    return { items, nextCursor }
  }

  async findById(id: string): Promise<SportEvent | null> {
    return this.events.find((e) => e.id === id) ?? null
  }

  async findFeatured(): Promise<SportEvent | null> {
    return this.events.find((e) => e.featured) ?? this.events[0] ?? null
  }

  async listCountries(): Promise<readonly SportEventFacetCountry[]> {
    const counts = new Map<string, number>()
    for (const event of this.events) {
      const country = event.location.country
      counts.set(country, (counts.get(country) ?? 0) + 1)
    }
    return [...counts.entries()].map(([name, count]) => ({ name, count }))
  }

  async listTiers(): Promise<readonly SportEventFacetTier[]> {
    const counts = new Map<SportEvent["tier"], number>()
    for (const event of this.events) {
      counts.set(event.tier, (counts.get(event.tier) ?? 0) + 1)
    }
    return [...counts.entries()].map(([name, count]) => ({ name, count }))
  }

  async listDisciplines(): Promise<readonly SportEventFacetDiscipline[]> {
    const counts = new Map<string, number>()
    for (const event of this.events) {
      for (const sport of event.sports) {
        counts.set(sport, (counts.get(sport) ?? 0) + 1)
      }
    }
    return [...counts.entries()].map(([name, count]) => ({ name, count })) as readonly SportEventFacetDiscipline[]
  }

  // The JSON mode is the read-only fallback (see `getEventRepositoryAsync`).
  // All writes throw so the admin UI's `DataModeNotice` is the only way to
  // reach this code path; callers should not catch and continue.
  async create(_input: NewSportEvent): Promise<SportEvent> {
    throw new Error("sport_events writes are not supported in JSON mode")
  }

  async update(_id: string, _patch: SportEventPatch): Promise<SportEvent> {
    throw new Error("sport_events writes are not supported in JSON mode")
  }

  async delete(_id: string): Promise<void> {
    throw new Error("sport_events writes are not supported in JSON mode")
  }
}