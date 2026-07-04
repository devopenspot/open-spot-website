import { getSpotsDataSource } from "@/lib/env"
import { AdminNewSpotForm } from "./AdminNewSpotForm"

export const metadata = {
  title: "Admin · New spot",
}

export default function AdminNewSpotPage() {
  const writeEnabled = getSpotsDataSource() === "db"
  return <AdminNewSpotForm writeEnabled={writeEnabled} />
}
