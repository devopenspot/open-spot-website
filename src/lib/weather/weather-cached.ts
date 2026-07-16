import { fetchCurrentWeather } from "./weather-current"
import { fetchForecast } from "./weather-forecast"
import { mapCurrentWeather, mapForecast } from "./mappers"
import type { SpotForecast } from "@/lib/types"

export interface SpotWeather {
	current: number
	description: string
	tempMin: number | null
	tempMax: number | null
	wind: number | null
	humidity: number | null
	precipitationMm: number | null
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

	const mapped = mapCurrentWeather(current);

	return {
		current: mapped.temp,
		description: mapped.description,
		tempMin: current ? Math.round(current.main.temp_min) : null,
		tempMax: current ? Math.round(current.main.temp_max) : null,
		wind: current?.wind?.speed ?? null,
		humidity: mapped.humidity,
		precipitationMm: mapped.precipitationMm,
		forecast: mapForecast(forecast, spotId),
		fetchedAt: Date.now(),
	}
}
