import { notFound } from "next/navigation"
import { findSpotById } from "@/lib/services/spots"
import { listSpotTypes } from "@/lib/services/spot-types"
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
  const [spot, spotTypes] = await Promise.all([
    findSpotById(id),
    listSpotTypes(),
  ])
  if (!spot) notFound()
  const spotTypeOptions: readonly SpotTypeEntity[] = spotTypes
  return (
    <AdminEditSpotForm spot={spot} spotTypes={spotTypeOptions} />
  )
}
