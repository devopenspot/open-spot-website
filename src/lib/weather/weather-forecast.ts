import type { WeatherItem } from "@/types/weather"
import { URL_WEATHER, URL_WEATHER_IMG, API_KEY_WEATHER } from "./env"
import { log } from "@/lib/log"

const OPENWEATHER_BASE = URL_WEATHER
const OPENWEATHER_IMG_BASE = URL_WEATHER_IMG
const OPENWEATHER_KEY = API_KEY_WEATHER

export const fetchForecast = async ({
	latitude,
	longitude,
	language = "en",
}: {
	latitude: string | number
	longitude: string | number
	language?: string
}): Promise<WeatherItem[]> => {
	if (!OPENWEATHER_BASE || !OPENWEATHER_KEY) {
		log.error(
			"OpenWeather env vars are not set (URL_WEATHER, API_KEY_WEATHER).",
		)
		return []
	}
	if (!latitude || !longitude) return []

	const url = `${OPENWEATHER_BASE}/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_KEY}&units=metric&lang=${language}`

	try {
		const response = await fetch(url, { cache: "no-store" })
		if (!response.ok) {
			log.error(`OpenWeather /forecast failed: ${response.status}`)
			return []
		}
		const data: { list: WeatherItem[] } = await response.json()
		return (data.list ?? []).map((item) => ({
			...item,
			weatherIconUrl: OPENWEATHER_IMG_BASE,
		}))
	} catch (error) {
		log.error(`Failed to fetch forecast: ${error}`)
		return []
	}
}
