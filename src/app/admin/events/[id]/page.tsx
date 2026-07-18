import { notFound } from "next/navigation"
import { findEventById } from "@/lib/services/events"
import { AdminEditEventForm } from "./AdminEditEventForm"

export const metadata = {
  title: "Admin · Edit event",
}

interface AdminEditEventPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminEditEventPage({ params }: AdminEditEventPageProps) {
  const { id } = await params
  const event = await findEventById(id)
  if (!event) notFound()
  return <AdminEditEventForm event={event} />
}
