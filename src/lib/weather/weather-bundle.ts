import { cache } from "react"
import { getSpotRepository } from "@/lib/repositories"
import { getCachedSpotWeather } from "./weather-cached"
import type { CachedSpotWeather } from "./weather-cached"
import type { Spot } from "@/lib/types"

export async function getWeatherForSpots(
  spots: readonly Spot[],
): Promise<Record<string, CachedSpotWeather>> {
  const entries = await Promise.all(
    spots.map(async (s) => {
      const weather = await getCachedSpotWeather({
        spotId: s.id,
        latitude: s.location.lat,
        longitude: s.location.lon,
      })
      return [s.id, weather] as const
    }),
  )
  return Object.fromEntries(entries)
}

export const getWeatherForAllSpots = cache(
  async (): Promise<Record<string, CachedSpotWeather>> => {
    const { items } = await getSpotRepository().list()
    return getWeatherForSpots(items)
  },
)