import type { WeatherItem } from "@/types/weather"
import type { SpotForecast, WeatherIconName } from "@/lib/types"

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const

const FALLBACK_ICON: WeatherIconName = "sunny"
const FALLBACK_TEMP = 22
const FALLBACK_DAY = "TUE"

function hash(s: string): number {
	let h = 0
	for (let i = 0; i < s.length; i++) {
		h = (h * 31 + s.charCodeAt(i)) | 0
	}
	return Math.abs(h)
}

function dayNameFromUnix(dt: number): string {
	return DAY_NAMES[new Date(dt * 1000).getDay()] ?? FALLBACK_DAY
}

function pickRepresentativeForDay(items: WeatherItem[]): WeatherItem | undefined {
	if (items.length === 0) return undefined
	const noon = items.find(
		(it) => new Date(it.dt * 1000).getHours() === 12,
	)
	return noon ?? items[0]
}

export function mapIconName(icon: string | undefined): WeatherIconName {
	if (!icon) return "sunny"
	switch (icon.slice(0, 2)) {
		case "01":
			return "sunny"
		case "02":
			return "partly_cloudy_day"
		case "03":
		case "04":
			return "cloudy"
		case "09":
		case "10":
			return "rain"
		case "13":
			return "snow"
		default:
			return "sunny"
	}
}

export function mapCurrentWeather(item: WeatherItem | null): number {
	if (!item) return FALLBACK_TEMP
	return Math.round(item.main.temp)
}

export function mapForecast(
	items: WeatherItem[],
	seed: string,
): SpotForecast[] {
	if (items.length === 0) return fallbackForecastForSeed(seed)

	const byDay = new Map<string, WeatherItem[]>()
	const orderedDays: string[] = []
	for (const item of items) {
		const day = dayNameFromUnix(item.dt)
		if (!byDay.has(day)) {
			byDay.set(day, [])
			orderedDays.push(day)
		}
		byDay.get(day)!.push(item)
		if (orderedDays.length >= 3) break
	}

	const result: SpotForecast[] = []
	for (const day of orderedDays) {
		const rep = pickRepresentativeForDay(byDay.get(day) ?? [])
		if (!rep) continue
		result.push({
			day,
			icon: mapIconName(rep.weather[0]?.icon),
			temp: Math.round(rep.main.temp),
		})
	}

	while (result.length < 3) {
		result.push({ day: FALLBACK_DAY, icon: FALLBACK_ICON, temp: FALLBACK_TEMP })
	}
	return result
}

function fallbackForecastForSeed(seed: string): SpotForecast[] {
	const h = hash(seed)
	const base = 18 + (h % 14)
	return [
		{ day: "TUE", icon: "sunny", temp: base },
		{
			day: "WED",
			icon: h % 2 === 0 ? "partly_cloudy_day" : "sunny",
			temp: base - 2,
		},
		{ day: "THU", icon: "sunny", temp: base + 1 },
	]
}
