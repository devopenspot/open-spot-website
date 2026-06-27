import type { WeatherItem } from "@/types/weather"

const OPENWEATHER_BASE = process.env.URL_WEATHER ?? ""
const OPENWEATHER_IMG_BASE = process.env.URL_WEATHER_IMG ?? ""
const OPENWEATHER_KEY = process.env.API_KEY_WEATHER ?? ""

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
		console.error(
			"OpenWeather env vars are not set (URL_WEATHER, API_KEY_WEATHER).",
		)
		return []
	}
	if (!latitude || !longitude) return []

	const url = `${OPENWEATHER_BASE}/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_KEY}&units=metric&lang=${language}`

	try {
		const response = await fetch(url)
		if (!response.ok) {
			console.error(`OpenWeather /forecast failed: ${response.status}`)
			return []
		}
		const data: { list: WeatherItem[] } = await response.json()
		return (data.list ?? []).map((item) => ({
			...item,
			weatherIconUrl: OPENWEATHER_IMG_BASE,
		}))
	} catch (error) {
		console.error(`Failed to fetch forecast: ${error}`)
		return []
	}
}
