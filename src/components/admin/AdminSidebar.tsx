"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Compass, MapPin, Trophy, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/cn"

interface SidebarItem {
  href: string
  label: string
  Icon: LucideIcon
  exact?: boolean
}

const ITEMS: readonly SidebarItem[] = [
  { href: "/admin", label: "Overview", Icon: Compass, exact: true },
  { href: "/admin/spots", label: "Spots", Icon: MapPin },
  { href: "/admin/events", label: "Events", Icon: Trophy },
]

export function AdminSidebar() {
  const pathname = usePathname()
  return (
    <aside
      aria-label="Admin navigation"
      className="hidden w-56 shrink-0 md:block"
    >
      <nav aria-label="Admin sections">
        <span className="mb-3 block font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
          Admin
        </span>
        <ul className="space-y-1">
          {ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.Icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 border-l-2 px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all",
                    active
                      ? "border-primary bg-surface-container text-on-surface"
                      : "border-transparent text-secondary hover:bg-surface-container-low hover:text-on-surface",
                  )}
                >
                  <Icon size={14} aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
