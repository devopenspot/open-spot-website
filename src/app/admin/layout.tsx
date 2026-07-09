import type { Metadata } from "next"
import { requireAdminOrRedirect } from "@/lib/auth/server"
import { AdminShell } from "@/components/admin/AdminShell"

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
  return <AdminShell>{children}</AdminShell>
}
