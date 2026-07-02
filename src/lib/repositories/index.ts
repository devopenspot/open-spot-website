import { log } from "@/lib/log"
import { getSpotsDataSource } from "@/lib/env"
import { JsonSpotRepository } from "./json-spot-repository"
import { JsonEventRepository } from "./json-event-repository"
import { JsonSavedSpotsRepository } from "./json-saved-spots-repository"
import type { SpotRepository } from "./spot-repository"
import type { EventRepository } from "./event-repository"
import type { SavedSpotsRepository } from "./saved-spots-repository"

let spotRepository: SpotRepository | null = null
let eventRepository: EventRepository | null = null
let savedSpotsRepository: SavedSpotsRepository | null = null

export function getSpotRepository(): SpotRepository {
  if (spotRepository) return spotRepository
  const source = getSpotsDataSource()
  if (source === "db") {
    log.warn("repositories.spots_db_not_implemented_falling_back_to_json")
    spotRepository = new JsonSpotRepository()
    return spotRepository
  }
  spotRepository = new JsonSpotRepository()
  return spotRepository
}

export function getEventRepository(): EventRepository {
  if (eventRepository) return eventRepository
  eventRepository = new JsonEventRepository()
  return eventRepository
}

export function getSavedSpotsRepository(): SavedSpotsRepository {
  if (savedSpotsRepository) return savedSpotsRepository
  savedSpotsRepository = new JsonSavedSpotsRepository()
  return savedSpotsRepository
}

export { JsonSpotRepository } from "./json-spot-repository"
export { JsonEventRepository } from "./json-event-repository"
export { JsonSavedSpotsRepository } from "./json-saved-spots-repository"
export type { SpotRepository } from "./spot-repository"
export type { EventRepository } from "./event-repository"
export type { SavedSpotsRepository } from "./saved-spots-repository"
export type { NewSpot, SpotPatch, SpotQuery } from "./types"