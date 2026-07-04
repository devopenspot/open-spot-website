import type { SportEvent, SportDiscipline, SportEventTier } from "@/types/sport-events"
import type {
  NewSportEvent,
  SportEventPatch,
  SportEventFacetCountry,
  SportEventFacetDiscipline,
  SportEventFacetTier,
} from "./types"

export interface SportEventListResult {
  items: readonly SportEvent[]
  nextCursor: string | null
}

export interface SportEventQuery {
  q?: string
  country?: string
  tier?: SportEventTier
  discipline?: SportDiscipline
  featured?: boolean
  from?: string
  to?: string
  cursor?: string
  limit?: number
}

export interface EventRepository {
  list(query?: SportEventQuery): Promise<SportEventListResult>
  findById(id: string): Promise<SportEvent | null>
  findFeatured(): Promise<SportEvent | null>
  listCountries(): Promise<readonly SportEventFacetCountry[]>
  listTiers(): Promise<readonly SportEventFacetTier[]>
  listDisciplines(): Promise<readonly SportEventFacetDiscipline[]>
  create(input: NewSportEvent): Promise<SportEvent>
  update(id: string, patch: SportEventPatch): Promise<SportEvent>
  delete(id: string): Promise<void>
}