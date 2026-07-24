import { cacheLife, cacheTag } from "next/cache"
import { fetchCurrentWeather, fetchForecast } from "./fetchers"
import { mapCurrentWeather, mapForecast } from "./mappers"
import type { SpotForecast } from "@/lib/types"
import { log } from "@/lib/log"

export interface SpotWeather {
	current: number | null
	description: string
	tempMin: number | null
	tempMax: number | null
	wind: number | null
	humidity: number | null
	precipitationMm: number | null
	forecast: SpotForecast[]
	fetchedAt: number
}

// OpenWeather free plan updates its data every 2h; a 1h revalidate keeps
// the cache fresh enough for the home page and the map without making
// redundant upstream calls. `stale` matches `revalidate` so a revalidate
// tick during a render serves the previous value for the rest of the
// window. `expire` is a hard 24h ceiling so a forgotten spot doesn't
// stay warm forever.
const WEATHER_CACHE_LIFE = {
	revalidate: 3600,
	stale: 3600,
	expire: 86400,
} as const

export async function getSpotWeather({
	spotId,
	latitude,
	longitude,
	language,
}: {
	spotId: string
	latitude: number
	longitude: number
	language?: string
}): Promise<SpotWeather> {
	"use cache"
	cacheTag(`weather:spot:${spotId}`)
	cacheLife(WEATHER_CACHE_LIFE)

	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
		return {
			current: null,
			description: "",
			tempMin: null,
			tempMax: null,
			wind: null,
			humidity: null,
			precipitationMm: null,
			forecast: [],
			fetchedAt: Date.now(),
		}
	}

	try {
		const [current, forecast] = await Promise.all([
			fetchCurrentWeather({ latitude, longitude, language }),
			fetchForecast({ latitude, longitude, language }),
		])

		const mapped = mapCurrentWeather(current)
		return {
			current: mapped.temp,
			description: mapped.description,
			tempMin: current ? Math.round(current.main.temp_min) : null,
			tempMax: current ? Math.round(current.main.temp_max) : null,
			wind: current?.wind?.speed ?? null,
			humidity: mapped.humidity,
			precipitationMm: mapped.precipitationMm,
			forecast: mapForecast(forecast),
			fetchedAt: Date.now(),
		}
	} catch (error) {
		log.error(`getSpotWeather(${spotId}) failed: ${error}`)
		return {
			current: null,
			description: "",
			tempMin: null,
			tempMax: null,
			wind: null,
			humidity: null,
			precipitationMm: null,
			forecast: [],
			fetchedAt: Date.now(),
		}
	}
}
