import { cacheLife, cacheTag } from "next/cache"
import { getSpotRepositoryAsync } from "@/lib/repositories"
import type { SpotTypeEntity } from "@/lib/types"

const LIST_CACHE_LIFE = {
  revalidate: 60,
  stale: 300,
  expire: 3600,
} as const

export async function runListSpotTypes(): Promise<readonly SpotTypeEntity[]> {
  const repo = await getSpotRepositoryAsync()
  const rows = await repo.listAllSpotTypes()
  return rows.map((r) => ({ slug: r.slug, name: r.name }))
}

export async function listSpotTypes(): Promise<readonly SpotTypeEntity[]> {
  "use cache"
  cacheTag("spot-types:all")
  cacheLife(LIST_CACHE_LIFE)
  return runListSpotTypes()
}
