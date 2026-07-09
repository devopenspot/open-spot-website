import { getSpotRepositoryAsync } from "@/lib/repositories"
import type { TerrainOption } from "@/lib/types"
import { AdminNewSpotForm } from "./AdminNewSpotForm"

export const metadata = {
  title: "Admin · New spot",
}

export default async function AdminNewSpotPage() {
  const repo = await getSpotRepositoryAsync()
  const facets = await repo.listTypes()
  const terrainOptions: readonly TerrainOption[] = facets.map((f) => ({
    value: f.name,
    label: f.name,
  }))
  return <AdminNewSpotForm terrainOptions={terrainOptions} />
}
