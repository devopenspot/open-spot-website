import type { WeatherItem } from "@/types/weather"
import { URL_WEATHER, URL_WEATHER_IMG, API_KEY_WEATHER } from "./env"
import { log } from "@/lib/log"

const OPENWEATHER_BASE = URL_WEATHER
const OPENWEATHER_IMG_BASE = URL_WEATHER_IMG
const OPENWEATHER_KEY = API_KEY_WEATHER

export const fetchCurrentWeather = async ({
	latitude,
	longitude,
	language = "en",
}: {
	latitude: string | number
	longitude: string | number
	language?: string
}): Promise<WeatherItem | null> => {
	if (!OPENWEATHER_BASE || !OPENWEATHER_KEY) {
		log.error(
			"OpenWeather env vars are not set (URL_WEATHER, API_KEY_WEATHER).",
		)
		return null
	}
	const url = `${OPENWEATHER_BASE}/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_KEY}&units=metric&lang=${language}`

	try {
		const response = await fetch(url, { cache: "no-store" })
		if (!response.ok) {
			log.error(`OpenWeather /weather failed: ${response.status}`)
			return null
		}
		const data: WeatherItem = await response.json()

		return { ...data, weatherIconUrl: OPENWEATHER_IMG_BASE }
	} catch (error) {
		log.error(`Failed to fetch current weather: ${error}`)
		return null
	}
}
