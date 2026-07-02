import { log } from "@/lib/log"
import { env, getSpotsDataSource, isSupabaseConfigured } from "@/lib/env"
import { checkDbHealth } from "@/lib/db/health"
import { JsonSpotRepository } from "./json-spot-repository"
import { JsonEventRepository } from "./json-event-repository"
import { JsonSavedSpotsRepository } from "./json-saved-spots-repository"
import { DrizzleSpotRepository } from "./drizzle-spot-repository"
import { DrizzleEventRepository } from "./drizzle-event-repository"
import { DrizzleSavedSpotsRepository } from "./drizzle-saved-spots-repository"
import { getDbClient, isDbConfigured } from "@/lib/db/client"
import type { SpotRepository } from "./spot-repository"
import type { EventRepository } from "./event-repository"
import type { SavedSpotsRepository } from "./saved-spots-repository"

let spotRepository: SpotRepository | null = null
let eventRepository: EventRepository | null = null
let savedSpotsRepository: SavedSpotsRepository | null = null

interface FactoryContext {
  forceSource?: "json" | "db"
  reason?: string
}

let lastContext: FactoryContext = {}

export function getLastRepositoryContext(): FactoryContext {
  return { ...lastContext }
}

function getJsonSpotRepo(): SpotRepository {
  if (!spotRepository) {
    spotRepository = new JsonSpotRepository()
  }
  return spotRepository
}

function getJsonEventRepo(): EventRepository {
  if (!eventRepository) {
    eventRepository = new JsonEventRepository()
  }
  return eventRepository
}

function getJsonSavedSpotsRepo(): SavedSpotsRepository {
  if (!savedSpotsRepository) {
    savedSpotsRepository = new JsonSavedSpotsRepository()
  }
  return savedSpotsRepository
}

function getDrizzleRepos() {
  const { db } = getDbClient()
  return {
    spot: new DrizzleSpotRepository(db),
    event: new DrizzleEventRepository(db),
    savedSpots: new DrizzleSavedSpotsRepository(db),
  }
}

export async function getSpotRepositoryAsync(): Promise<SpotRepository> {
  const source = lastContext.forceSource ?? getSpotsDataSource()
  if (source !== "db") {
    lastContext = { forceSource: "json" }
    return getJsonSpotRepo()
  }
  if (!isDbConfigured()) {
    log.warn("repositories.db_not_configured_falling_back_to_json")
    lastContext = { reason: "db_not_configured" }
    return getJsonSpotRepo()
  }
  const health = await checkDbHealth()
  if (!health.ok) {
    log.error("repositories.db_unhealthy_falling_back_to_json", {
      error: health.error,
      latencyMs: health.latencyMs,
    })
    lastContext = { reason: "db_unhealthy" }
    return getJsonSpotRepo()
  }
  if (!spotRepository) {
    spotRepository = getDrizzleRepos().spot
  }
  lastContext = {}
  return spotRepository
}

export async function getEventRepositoryAsync(): Promise<EventRepository> {
  const source = lastContext.forceSource ?? getSpotsDataSource()
  if (source !== "db") {
    lastContext = { forceSource: "json" }
    return getJsonEventRepo()
  }
  if (!isDbConfigured()) {
    lastContext = { reason: "db_not_configured" }
    return getJsonEventRepo()
  }
  const health = await checkDbHealth()
  if (!health.ok) {
    lastContext = { reason: "db_unhealthy" }
    return getJsonEventRepo()
  }
  if (!eventRepository) {
    eventRepository = getDrizzleRepos().event
  }
  return eventRepository
}

export async function getSavedSpotsRepositoryAsync(): Promise<SavedSpotsRepository> {
  const source = lastContext.forceSource ?? getSpotsDataSource()
  if (source !== "db") {
    lastContext = { forceSource: "json" }
    return getJsonSavedSpotsRepo()
  }
  if (!isDbConfigured()) {
    lastContext = { reason: "db_not_configured" }
    return getJsonSavedSpotsRepo()
  }
  const health = await checkDbHealth()
  if (!health.ok) {
    lastContext = { reason: "db_unhealthy" }
    return getJsonSavedSpotsRepo()
  }
  if (!savedSpotsRepository) {
    savedSpotsRepository = getDrizzleRepos().savedSpots
  }
  return savedSpotsRepository
}

// Sync factories (kept for tests, CLI scripts, and the legacy A.3 surface).
// The async variants above are the production path used by server actions and pages.
export function getSpotRepository(): SpotRepository {
  if (spotRepository) return spotRepository
  const source = getSpotsDataSource()
  if (source === "db" && isSupabaseConfigured() && isDbConfigured()) {
    log.warn("repositories.spots_db_using_sync_fallback_json_for_tests")
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

void env

export { JsonSpotRepository } from "./json-spot-repository"
export { JsonEventRepository } from "./json-event-repository"
export { JsonSavedSpotsRepository } from "./json-saved-spots-repository"
export type { SpotRepository } from "./spot-repository"
export type { EventRepository } from "./event-repository"
export type { SavedSpotsRepository } from "./saved-spots-repository"
export type { NewSpot, SpotPatch, SpotQuery } from "./types"
export type { SportEventQuery, SportEventListResult } from "./event-repository"