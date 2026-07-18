import { listSpotTypes } from "@/lib/services/spot-types"
import type { SpotTypeEntity } from "@/lib/types"
import { AdminNewSpotForm } from "./AdminNewSpotForm"

export const metadata = {
  title: "Admin · New spot",
}

export default async function AdminNewSpotPage() {
  const spotTypes = await listSpotTypes()
  const spotTypeOptions: readonly SpotTypeEntity[] = spotTypes
  const initialTypeSlug = spotTypeOptions[0]?.slug ?? null
  return (
    <AdminNewSpotForm
      spotTypes={spotTypeOptions}
      initialTypeSlug={initialTypeSlug}
    />
  )
}
