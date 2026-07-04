import type { Metadata } from "next"
import { requireAdminOrRedirect } from "@/lib/auth/server"
import { getSpotsDataSource } from "@/lib/env"
import { AdminShell } from "@/components/admin/AdminShell"
import { DataModeNotice } from "@/components/admin/DataModeNotice"

export const metadata: Metadata = {
  title: "Admin",
  description: "Manage skate spots and sport events.",
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdminOrRedirect("/admin")
  const isJsonMode = getSpotsDataSource() === "json"
  return (
    <>
      <DataModeNotice isJsonMode={isJsonMode} />
      <AdminShell>{children}</AdminShell>
    </>
  )
}
