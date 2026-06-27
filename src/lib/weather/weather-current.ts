import type { WeatherItem } from "@/types/weather"

const OPENWEATHER_BASE = process.env.URL_WEATHER ?? ""
const OPENWEATHER_IMG_BASE = process.env.URL_WEATHER_IMG ?? ""
const OPENWEATHER_KEY = process.env.API_KEY_WEATHER ?? ""

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
		console.error(
			"OpenWeather env vars are not set (URL_WEATHER, API_KEY_WEATHER).",
		)
		return null
	}
	const url = `${OPENWEATHER_BASE}/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_KEY}&units=metric&lang=${language}`

	try {
		const response = await fetch(url)
		if (!response.ok) {
			console.error(`OpenWeather /weather failed: ${response.status}`)
			return null
		}
		const data: WeatherItem = await response.json()

		return { ...data, weatherIconUrl: OPENWEATHER_IMG_BASE }
	} catch (error) {
		console.error(`Failed to fetch current weather: ${error}`)
		return null
	}
}
