import { cache } from "react"
import { connection } from "next/server"
import { getSpotRepositoryAsync } from "@/lib/repositories"
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

export const getWeatherForAllSpots = cache(
  async (): Promise<Record<string, SpotWeather>> => {
    await connection()
    const repo = await getSpotRepositoryAsync()
    const { items } = await repo.list()
    return getWeatherForSpots(items)
  },
)