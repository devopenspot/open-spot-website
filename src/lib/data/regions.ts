import "server-only"
import { asc, eq } from "drizzle-orm"
import { getDbClient } from "@/lib/db/client"
import { getSpotRepositoryAsync } from "@/lib/repositories"
import { countries, regions } from "@/db/schema"
import type { Region } from "@/lib/types"

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function formatCount(spotCount: number): string {
  if (spotCount >= 1000) return `${(spotCount / 1000).toFixed(1)}k Spots`
  return `${spotCount} Spots`
}

/**
 * Server-only. Joins the `regions` + `countries` tables, merges with the
 * spot-count aggregate from `listRegions()`, and returns the `Region[]`
 * shape consumed by the client tree (via `SpotsProvider`).
 *
 * Called once per request from `RootDataProviders` and cached in the
 * spots store.
 */
export async function getRegionsForClient(): Promise<readonly Region[]> {
  const { db } = getDbClient()
  const rows = await db
    .select({
      name: regions.name,
      description: regions.description,
      imageUrl: regions.imageUrl,
      countryName: countries.name,
    })
    .from(regions)
    .leftJoin(countries, eq(countries.regionId, regions.id))
    .orderBy(asc(regions.sortOrder), asc(countries.name))

  const spotRepo = await getSpotRepositoryAsync()
  const regionCounts = await spotRepo.listRegions()
  const countByName = new Map(
    regionCounts.map((r) => [r.name, r.spotCount] as const),
  )

  const grouped = new Map<string, { region: Region; countries: string[] }>()
  for (const row of rows) {
    const countryName = row.countryName ?? null
    const existing = grouped.get(row.name)
    if (existing) {
      if (countryName) existing.countries.push(countryName)
    } else {
      const spotCount = countByName.get(row.name) ?? 0
      grouped.set(row.name, {
        region: {
          name: row.name,
          desc: row.description,
          image: row.imageUrl ?? "",
          link: `/map?region=${slugify(row.name)}`,
          count: formatCount(spotCount),
          countries: [],
        },
        countries: countryName ? [countryName] : [],
      })
    }
  }

  return [...grouped.values()].map(
    ({ region, countries: countryList }): Region => ({
      ...region,
      countries: countryList,
    }),
  )
}
