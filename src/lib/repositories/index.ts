import { getDbClient } from "@/lib/db/client"
import { DrizzleSpotRepository } from "./drizzle-spot-repository"
import { DrizzleEventRepository } from "./drizzle-event-repository"
import { DrizzleSavedSpotsRepository } from "./drizzle-saved-spots-repository"
import type { SpotRepository } from "./spot-repository"
import type { EventRepository } from "./event-repository"
import type { SavedSpotsRepository } from "./saved-spots-repository"

let spotRepository: SpotRepository | null = null
let eventRepository: EventRepository | null = null
let savedSpotsRepository: SavedSpotsRepository | null = null

function getDrizzleRepos() {
  const { db } = getDbClient()
  return {
    spot: new DrizzleSpotRepository(db),
    event: new DrizzleEventRepository(db),
    savedSpots: new DrizzleSavedSpotsRepository(db),
  }
}

export async function getSpotRepositoryAsync(): Promise<SpotRepository> {
  if (!spotRepository) {
    spotRepository = getDrizzleRepos().spot
  }
  return spotRepository
}

export async function getEventRepositoryAsync(): Promise<EventRepository> {
  if (!eventRepository) {
    eventRepository = getDrizzleRepos().event
  }
  return eventRepository
}

export async function getSavedSpotsRepositoryAsync(): Promise<SavedSpotsRepository> {
  if (!savedSpotsRepository) {
    savedSpotsRepository = getDrizzleRepos().savedSpots
  }
  return savedSpotsRepository
}

export { DrizzleSpotRepository } from "./drizzle-spot-repository"
export { DrizzleEventRepository } from "./drizzle-event-repository"
export { DrizzleSavedSpotsRepository } from "./drizzle-saved-spots-repository"
export type { SpotRepository } from "./spot-repository"
export type { EventRepository } from "./event-repository"
export type { SavedSpotsRepository } from "./saved-spots-repository"
export type { NewSpot, SpotPatch, SpotQuery } from "./types"
export type { SportEventQuery, SportEventListResult } from "./event-repository"
