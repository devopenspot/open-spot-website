import { notFound } from "next/navigation"
import { getSpotsDataSource } from "@/lib/env"
import { getEventRepositoryAsync } from "@/lib/repositories"
import { AdminEditEventForm } from "./AdminEditEventForm"

export const metadata = {
  title: "Admin · Edit event",
}

interface AdminEditEventPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminEditEventPage({ params }: AdminEditEventPageProps) {
  const { id } = await params
  const repo = await getEventRepositoryAsync()
  const event = await repo.findById(id)
  if (!event) notFound()
  const writeEnabled = getSpotsDataSource() === "db"
  return <AdminEditEventForm event={event} writeEnabled={writeEnabled} />
}
