import { cacheLife, cacheTag, revalidatePath, revalidateTag } from "next/cache"
import { getSpotRepositoryAsync } from "@/lib/repositories"
import type {
  NewSpot,
  SpotListResult,
  SpotPatch,
  SpotQuery,
} from "@/lib/repositories/types"
import type { Spot } from "@/lib/types"

const NEARBY_DEFAULT_LIMIT = 200

// `listSpots` is the heaviest read on the home page. It runs the
// `joinedSpotSelect` (two correlated subquery aggregates: `types` and
// `sports`) over the full spots table. Caching it for 60s/revalidate,
// 300s/stale, 3600s/expire keeps warm home pages off the DB entirely.
// Mutations in Phase 5 call `revalidateTag("spots:list")` (plus the
// per-id/per-slug tags) so writes propagate.
//
// `connection()` is intentionally NOT called here: `"use cache"`
// functions must be producible outside a request lifecycle (the cache
// can be populated at build/preview time). Callers that want dynamic
// rendering call `connection()` at the page/route level.
const LIST_CACHE_LIFE = {
  revalidate: 60,
  stale: 300,
  expire: 3600,
} as const

const ITEM_CACHE_LIFE = {
  revalidate: 60,
  stale: 300,
  expire: 3600,
} as const

// ---------- list ----------

export async function runListSpots(
  query?: SpotQuery,
): Promise<SpotListResult> {
  const repo = await getSpotRepositoryAsync()
  return repo.list(query)
}

export async function listSpots(query?: SpotQuery): Promise<SpotListResult> {
  "use cache"
  cacheTag("spots:list")
  cacheLife(LIST_CACHE_LIFE)
  return runListSpots(query)
}

// ---------- findById ----------

export async function runFindSpotById(id: string): Promise<Spot | null> {
  const repo = await getSpotRepositoryAsync()
  return repo.findById(id)
}

export async function findSpotById(id: string): Promise<Spot | null> {
  "use cache"
  cacheTag(`spots:item:${id}`)
  cacheLife(ITEM_CACHE_LIFE)
  return runFindSpotById(id)
}

// ---------- findBySlug ----------

export async function runFindSpotBySlug(slug: string): Promise<Spot | null> {
  const repo = await getSpotRepositoryAsync()
  return repo.findBySlug(slug)
}

export async function findSpotBySlug(slug: string): Promise<Spot | null> {
  "use cache"
  cacheTag(`spots:slug:${slug}`)
  cacheLife(ITEM_CACHE_LIFE)
  return runFindSpotBySlug(slug)
}

// ---------- findNearby ----------

export async function runFindNearbySpots(params: {
  lat: number
  lon: number
  radiusMeters: number
}): Promise<readonly Spot[]> {
  const repo = await getSpotRepositoryAsync()
  return repo.findNearby(params)
}

export async function findNearbySpots(params: {
  lat: number
  lon: number
  radiusMeters: number
}): Promise<readonly Spot[]> {
  "use cache"
  cacheTag("spots:nearby")
  cacheLife(LIST_CACHE_LIFE)
  return runFindNearbySpots({
    lat: params.lat,
    lon: params.lon,
    radiusMeters: Math.min(params.radiusMeters, NEARBY_DEFAULT_LIMIT),
  })
}

// ---------- mutators ----------
// `revalidateTag` is called with the same cache-life profile the
// original `"use cache"` block was configured with (Next.js 16
// requires the profile arg).

export async function runCreateSpot(input: NewSpot): Promise<Spot> {
  const repo = await getSpotRepositoryAsync()
  return repo.create(input)
}

export async function createSpot(input: NewSpot): Promise<Spot> {
  const spot = await runCreateSpot(input)
  revalidateTag("spots:list", LIST_CACHE_LIFE)
  revalidateTag(`spots:item:${spot.id}`, ITEM_CACHE_LIFE)
  revalidateTag(`spots:slug:${spot.slug}`, ITEM_CACHE_LIFE)
  revalidatePath("/admin/spots")
  revalidatePath("/")
  revalidatePath("/map")
  return spot
}

export async function runUpdateSpot(
  id: string,
  patch: SpotPatch,
): Promise<Spot> {
  const repo = await getSpotRepositoryAsync()
  return repo.update(id, patch)
}

export async function updateSpot(
  id: string,
  patch: SpotPatch,
): Promise<Spot> {
  const spot = await runUpdateSpot(id, patch)
  revalidateTag("spots:list", LIST_CACHE_LIFE)
  revalidateTag(`spots:item:${id}`, ITEM_CACHE_LIFE)
  revalidateTag(`spots:slug:${spot.slug}`, ITEM_CACHE_LIFE)
  revalidatePath(`/spots/${id}`)
  revalidatePath("/admin/spots")
  revalidatePath("/")
  revalidatePath("/map")
  return spot
}

export async function runDeleteSpot(id: string): Promise<void> {
  const repo = await getSpotRepositoryAsync()
  return repo.delete(id)
}

export async function deleteSpot(id: string): Promise<void> {
  await runDeleteSpot(id)
  revalidateTag("spots:list", LIST_CACHE_LIFE)
  revalidateTag(`spots:item:${id}`, ITEM_CACHE_LIFE)
  revalidatePath(`/spots/${id}`)
  revalidatePath("/admin/spots")
  revalidatePath("/")
  revalidatePath("/map")
  revalidatePath("/explore")
}
