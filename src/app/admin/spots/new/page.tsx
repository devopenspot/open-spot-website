import { getSpotsDataSource } from "@/lib/env"
import { getTerrainOptionsFromSource } from "@/lib/spots/source"
import { AdminNewSpotForm } from "./AdminNewSpotForm"

export const metadata = {
  title: "Admin · New spot",
}

export default async function AdminNewSpotPage() {
  const writeEnabled = getSpotsDataSource() === "db"
  const terrainOptions = await getTerrainOptionsFromSource()
  return (
    <AdminNewSpotForm
      writeEnabled={writeEnabled}
      terrainOptions={terrainOptions}
    />
  )
}
