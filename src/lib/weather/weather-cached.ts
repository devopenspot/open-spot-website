import { cacheLife, cacheTag } from "next/cache"
import { fetchCurrentWeather } from "./weather-current"
import { fetchForecast } from "./weather-forecast"
import { mapCurrentWeather, mapForecast } from "./mappers"
import type { SpotForecast } from "@/lib/types"

export interface CachedSpotWeather {
	current: number
	forecast: SpotForecast[]
	fetchedAt: number
}

export async function getCachedSpotWeather({
	spotId,
	latitude,
	longitude,
}: {
	spotId: string
	latitude: number
	longitude: number
}): Promise<CachedSpotWeather> {
	"use cache"
	cacheTag("weather", `weather:spot:${spotId}`)
	cacheLife({
		revalidate: 300,
		stale: 300,
		expire: 3600,
	})

	const [current, forecast] = await Promise.all([
		fetchCurrentWeather({ latitude, longitude }),
		fetchForecast({ latitude, longitude }),
	])

	return {
		current: mapCurrentWeather(current),
		forecast: mapForecast(forecast, spotId),
		fetchedAt: Date.now(),
	}
}
