import { fetchCurrentWeather } from "./weather-current"
import { fetchForecast } from "./weather-forecast"
import { mapCurrentWeather, mapForecast } from "./mappers"
import type { SpotForecast } from "@/lib/types"

export interface SpotWeather {
	current: number
	forecast: SpotForecast[]
	fetchedAt: number
}

export async function getSpotWeather({
	spotId,
	latitude,
	longitude,
}: {
	spotId: string
	latitude: number
	longitude: number
}): Promise<SpotWeather> {
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
