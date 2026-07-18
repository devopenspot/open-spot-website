import { cache } from "react"
import { connection } from "next/server"
import { getSpotWeather } from "./weather-cached"
import type { SpotWeather } from "./weather-cached"
import type { Spot } from "@/lib/types"

export async function getWeatherForSpots(
  spots: readonly Spot[],
): Promise<Record<string, SpotWeather>> {
  await connection()
  const entries = await Promise.all(
    spots.map(async (s) => {
      const weather = await getSpotWeather({
        spotId: s.id,
        latitude: s.location.lat,
        longitude: s.location.lon,
      })
      return [s.id, weather] as const
    }),
  )
  return Object.fromEntries(entries)
}

/**
 * Derives a weather map from a pre-fetched spots collection. The BFF
 * pattern says: the page-level data dependency (the spots list) is
 * fetched once by the caller and passed in. This eliminates the
 * duplicate `spots.list` call that previously fired alongside the
 * weather fetch on every home page render.
 */
export const getWeatherForAllSpots = cache(
  async (spots: readonly Spot[]): Promise<Record<string, SpotWeather>> =>
    getWeatherForSpots(spots),
)
