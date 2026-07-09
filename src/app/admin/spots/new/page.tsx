import { getSpotRepositoryAsync } from "@/lib/repositories"
import type { SpotTypeEntity } from "@/lib/types"
import { AdminNewSpotForm } from "./AdminNewSpotForm"

export const metadata = {
  title: "Admin · New spot",
}

export default async function AdminNewSpotPage() {
  const repo = await getSpotRepositoryAsync()
  const spotTypes = await repo.listAllSpotTypes()
  const spotTypeOptions: readonly SpotTypeEntity[] = spotTypes.map((t) => ({
    slug: t.slug,
    name: t.name,
  }))
  const initialTypeSlug = spotTypeOptions[0]?.slug ?? null
  return (
    <AdminNewSpotForm
      spotTypes={spotTypeOptions}
      initialTypeSlug={initialTypeSlug}
    />
  )
}
