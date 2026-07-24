import { getSpotWeather } from "./weather-cached"
import type { SpotWeather } from "./weather-cached"
import type { Spot } from "@/lib/types"

// Concurrency cap for the per-spot fan-out. On a cold cache the loop
// would otherwise fire 2 * N parallel requests (current + forecast per
// spot), which on a 500-spot render can trip OpenWeather's 60/min limit
// before the per-spot `"use cache"` can absorb subsequent calls. 8 in
// flight is well under the per-minute ceiling and is short enough that
// the cold-cache waterfall completes in a few seconds.
const MAX_CONCURRENT_SPOTS = 8

async function mapWithConcurrency<T, R>(
	items: readonly T[],
	limit: number,
	fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
	if (items.length === 0) return []
	const results: R[] = new Array(items.length)
	let cursor = 0
	async function worker(): Promise<void> {
		while (true) {
			const i = cursor++
			if (i >= items.length) return
			results[i] = await fn(items[i]!, i)
		}
	}
	const workers = Math.min(limit, items.length)
	await Promise.all(Array.from({ length: workers }, () => worker()))
	return results
}

/**
 * Per-spot weather is cached at the `getSpotWeather` boundary
 * (`"use cache"`, 1h revalidate, `weather:spot:{spotId}` tag). This
 * helper is a thin composition that fans the spot list out to the
 * per-spot cache, with a small concurrency cap on the cold-cache
 * path so a 500-spot first render cannot trip OpenWeather's
 * 60 calls/min ceiling.
 */
export async function getWeatherForAllSpots(
	spots: readonly Spot[],
): Promise<Record<string, SpotWeather>> {
	const entries = await mapWithConcurrency(
		spots,
		MAX_CONCURRENT_SPOTS,
		async (s) => {
			const weather = await getSpotWeather({
				spotId: s.id,
				latitude: s.location.lat,
				longitude: s.location.lon,
			})
			return [s.id, weather] as const
		},
	)
	return Object.fromEntries(entries)
}
