import { cache } from "react"
import { getSpotsDataSource } from "@/lib/env"
import { getSpotRepositoryAsync } from "@/lib/repositories"
import { getTerrainOptions } from "../spots"
import type { TerrainOption } from "@/lib/types"

/**
 * Data-source-aware variant of `getTerrainOptions` for **server components**
 * only. In DB mode it reads the canonical `spot_types` lookup table via the
 * spot repository, so admins see any custom-added type. In JSON mode (the
 * default and the build-time fallback) it returns the curated
 * `TERRAIN_OPTIONS` constant. The returned shape matches `TerrainOption` so
 * callers don't need to branch.
 *
 * This file is **server-only** because it imports the Drizzle repository
 * chain (`getSpotRepositoryAsync` → `getDbClient` → `server-only`). It must
 * not be imported from client components — server pages call this and pass
 * the result down as a prop.
 */
export const getTerrainOptionsFromSource = cache(
  async (): Promise<readonly TerrainOption[]> => {
    if (getSpotsDataSource() !== "db") {
      return getTerrainOptions()
    }
    const repo = await getSpotRepositoryAsync()
    const facets = await repo.listTypes()
    return facets.map((f) => ({ value: f.name, label: f.name }))
  },
)
