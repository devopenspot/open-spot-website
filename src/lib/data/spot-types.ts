import "server-only"
import { connection } from "next/server"
import { getSpotRepositoryAsync } from "@/lib/repositories"
import { withDbRetry } from "@/lib/db/client"
import type { SpotTypeEntity } from "@/lib/types"

/**
 * Server-only. Reads every row from the `spot_types` table and returns
 * the `{ slug, name }` shape consumed by the client tree (via
 * `SpotsProvider` → `useSpotsStore`).
 *
 * Called once per request from `RootDataProviders` and cached in the
 * spots store.
 */
export async function getSpotTypesForClient(): Promise<readonly SpotTypeEntity[]> {
  await connection()
  const repo = await getSpotRepositoryAsync()
  const rows = await withDbRetry(() => repo.listAllSpotTypes())
  return rows.map((r) => ({ slug: r.slug, name: r.name }))
}
