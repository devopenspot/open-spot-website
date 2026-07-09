import { notFound } from "next/navigation"
import { getSpotRepositoryAsync } from "@/lib/repositories"
import type { TerrainOption } from "@/lib/types"
import { AdminEditSpotForm } from "./AdminEditSpotForm"

export const metadata = {
  title: "Admin · Edit spot",
}

interface AdminEditSpotPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminEditSpotPage({ params }: AdminEditSpotPageProps) {
  const { id } = await params
  const repo = await getSpotRepositoryAsync()
  const spot = await repo.findById(id)
  if (!spot) notFound()
  const facets = await repo.listTypes()
  const terrainOptions: readonly TerrainOption[] = facets.map((f) => ({
    value: f.name,
    label: f.name,
  }))
  return <AdminEditSpotForm spot={spot} terrainOptions={terrainOptions} />
}
