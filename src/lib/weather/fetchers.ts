import { env } from "@/lib/env"
import { log } from "@/lib/log"
import {
	OpenWeatherRateLimitError,
	WeatherConfigError,
} from "./types"
import type { WeatherItem } from "@/types/weather"

const ENDPOINT_CURRENT = "data/2.5/weather" as const
const ENDPOINT_FORECAST = "data/2.5/forecast" as const

async function requestOpenWeather<T>(endpoint: string, params: {
	latitude: number
	longitude: number
	language: string
}): Promise<T> {
	const base = env.URL_WEATHER
	const key = env.API_KEY_WEATHER
	if (!base || !key) {
		throw new WeatherConfigError(
			"OpenWeather env vars are not set (URL_WEATHER, API_KEY_WEATHER).",
		)
	}
	const url = `${base}/${endpoint}?lat=${params.latitude}&lon=${params.longitude}&appid=${key}&units=metric&lang=${params.language}`

	const response = await fetch(url)
	if (response.status === 429) {
		log.error(`OpenWeather ${endpoint} rate-limited (429)`)
		throw new OpenWeatherRateLimitError(
			429,
			`OpenWeather ${endpoint} rate-limited`,
		)
	}
	if (!response.ok) {
		log.error(`OpenWeather ${endpoint} failed: ${response.status}`)
		throw new Error(`OpenWeather ${endpoint} failed: ${response.status}`)
	}
	return (await response.json()) as T
}

export async function fetchCurrentWeather(params: {
	latitude: number
	longitude: number
	language?: string
}): Promise<WeatherItem | null> {
	try {
		const data = await requestOpenWeather<WeatherItem>(ENDPOINT_CURRENT, {
			latitude: params.latitude,
			longitude: params.longitude,
			language: params.language ?? "en",
		})
		return { ...data, weatherIconUrl: env.URL_WEATHER_IMG }
	} catch (error) {
		if (!(error instanceof OpenWeatherRateLimitError)) {
			log.error(`Failed to fetch current weather: ${error}`)
		}
		return null
	}
}

export async function fetchForecast(params: {
	latitude: number
	longitude: number
	language?: string
}): Promise<WeatherItem[]> {
	if (!Number.isFinite(params.latitude) || !Number.isFinite(params.longitude)) {
		return []
	}
	try {
		const data = await requestOpenWeather<{ list?: WeatherItem[] }>(
			ENDPOINT_FORECAST,
			{
				latitude: params.latitude,
				longitude: params.longitude,
				language: params.language ?? "en",
			},
		)
		const list = data.list ?? []
		return list.map((item) => ({
			...item,
			weatherIconUrl: env.URL_WEATHER_IMG,
		}))
	} catch (error) {
		if (!(error instanceof OpenWeatherRateLimitError)) {
			log.error(`Failed to fetch forecast: ${error}`)
		}
		return []
	}
}
