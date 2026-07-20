import { cacheLife, cacheTag } from "next/cache"
import { getSpotRepositoryAsync } from "@/lib/repositories"

export interface CountryOption {
  iso2: string
  name: string
  region: string
}

const LIST_CACHE_LIFE = {
  revalidate: 60,
  stale: 300,
  expire: 3600,
} as const

/**
 * The `countries` table is seed-managed (no admin surface today), so
 * `revalidateTag("countries:all", LIST_CACHE_LIFE)` is intentionally
 * NOT called from any mutator. When a countries editor lands, add the
 * call there so seed-or-DB changes propagate within 60s.
 */
function filterCountries(
  rows: readonly CountryOption[],
  query: string,
): readonly CountryOption[] {
  const q = query.trim().toLowerCase()
  if (q.length === 0) return rows
  return rows.filter(
    (row) =>
      row.name.toLowerCase().includes(q) ||
      row.region.toLowerCase().includes(q),
  )
}

export async function runListCountries(
  query: string,
): Promise<readonly CountryOption[]> {
  const repo = await getSpotRepositoryAsync()
  const rows = await repo.listAllCountries()
  return filterCountries(rows, query)
}

export async function listCountries(
  query: string,
): Promise<readonly CountryOption[]> {
  "use cache"
  cacheTag("countries:all")
  cacheLife(LIST_CACHE_LIFE)
  return runListCountries(query)
}
