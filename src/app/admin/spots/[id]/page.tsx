import { notFound } from "next/navigation"
import { getSpotsDataSource } from "@/lib/env"
import { getSpotRepositoryAsync } from "@/lib/repositories"
import { getTerrainOptionsFromSource } from "@/lib/spots/source"
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
  const writeEnabled = getSpotsDataSource() === "db"
  const terrainOptions = await getTerrainOptionsFromSource()
  return (
    <AdminEditSpotForm
      spot={spot}
      writeEnabled={writeEnabled}
      terrainOptions={terrainOptions}
    />
  )
}
