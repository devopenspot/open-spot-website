import { notFound } from "next/navigation"
import { getSpotRepositoryAsync } from "@/lib/repositories"
import type { SpotTypeEntity } from "@/lib/types"
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
  const spotTypes = await repo.listAllSpotTypes()
  const spotTypeOptions: readonly SpotTypeEntity[] = spotTypes.map((t) => ({
    slug: t.slug,
    name: t.name,
  }))
  return (
    <AdminEditSpotForm spot={spot} spotTypes={spotTypeOptions} />
  )
}
