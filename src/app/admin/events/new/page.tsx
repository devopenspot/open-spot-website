import { getSpotsDataSource } from "@/lib/env"
import { AdminNewEventForm } from "./AdminNewEventForm"

export const metadata = {
  title: "Admin · New event",
}

export default function AdminNewEventPage() {
  const writeEnabled = getSpotsDataSource() === "db"
  return <AdminNewEventForm writeEnabled={writeEnabled} />
}
