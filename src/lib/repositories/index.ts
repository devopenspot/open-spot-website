import { getDbClient, withDbRetry } from "@/lib/db/client"
import { DrizzleSpotRepository } from "./drizzle-spot-repository"
import { DrizzleEventRepository } from "./drizzle-event-repository"
import { DrizzleSavedSpotsRepository } from "./drizzle-saved-spots-repository"
import { DrizzlePresetImagesRepository } from "./drizzle-preset-images-repository"
import type { SpotRepository } from "./spot-repository"
import type { EventRepository } from "./event-repository"
import type { SavedSpotsRepository } from "./saved-spots-repository"
import type { PresetImagesRepository } from "./preset-images-repository"

let spotRepository: SpotRepository | null = null
let eventRepository: EventRepository | null = null
let savedSpotsRepository: SavedSpotsRepository | null = null
let presetImagesRepository: PresetImagesRepository | null = null

/**
 * Wraps every method of a repository instance in `withDbRetry`.
 * Returns a Proxy that preserves the original type. The retry happens
 * at the method boundary so every DB call — read or write, including
 * ones callers forget to wrap — gets the standard 15s deadline and
 * 3-attempt retry on transient connection errors.
 */
function withRetryAll<T extends object>(repo: T): T {
  return new Proxy(repo, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)
      if (typeof value !== "function") return value
      return (...args: unknown[]) =>
        withDbRetry(() =>
          (value as (...a: unknown[]) => Promise<unknown>).apply(
            target,
            args,
          ),
        )
    },
  })
}

function getDrizzleRepos() {
  const { db } = getDbClient()
  return {
    spot: withRetryAll(new DrizzleSpotRepository(db)),
    event: withRetryAll(new DrizzleEventRepository(db)),
    savedSpots: withRetryAll(new DrizzleSavedSpotsRepository(db)),
    presetImages: withRetryAll(new DrizzlePresetImagesRepository(db)),
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

export async function getPresetImagesRepositoryAsync(): Promise<PresetImagesRepository> {
  if (!presetImagesRepository) {
    presetImagesRepository = getDrizzleRepos().presetImages
  }
  return presetImagesRepository
}

export { DrizzleSpotRepository } from "./drizzle-spot-repository"
export { DrizzleEventRepository } from "./drizzle-event-repository"
export { DrizzleSavedSpotsRepository } from "./drizzle-saved-spots-repository"
export { DrizzlePresetImagesRepository } from "./drizzle-preset-images-repository"
export type { SpotRepository } from "./spot-repository"
export type { EventRepository } from "./event-repository"
export type { SavedSpotsRepository } from "./saved-spots-repository"
export type {
  PresetImagesRepository,
  PresetImageEntity,
} from "./preset-images-repository"
export type { NewSpot, SpotPatch, SpotQuery } from "./types"
export type { SportEventQuery, SportEventListResult } from "./event-repository"
