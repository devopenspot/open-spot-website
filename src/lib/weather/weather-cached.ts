import { fetchCurrentWeather } from "./weather-current"
import { fetchForecast } from "./weather-forecast"
import { mapCurrentWeather, mapForecast } from "./mappers"
import type { SpotForecast } from "@/lib/types"

export interface SpotWeather {
	current: number
	tempMin: number | null
	tempMax: number | null
	wind: number | null
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
		tempMin: current ? Math.round(current.main.temp_min) : null,
		tempMax: current ? Math.round(current.main.temp_max) : null,
		wind: current?.wind?.speed ?? null,
		forecast: mapForecast(forecast, spotId),
		fetchedAt: Date.now(),
	}
}
