"use client"

import { useId, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { cn } from "@/lib/cn"
import type { SpotType } from "@/lib/types"

const TYPES: readonly { value: SpotType; label: string }[] = [
  { value: "Plaza", label: "Plaza" },
  { value: "DIY", label: "DIY" },
  { value: "Stair", label: "Stair" },
  { value: "Bowl", label: "Bowl" },
  { value: "Park", label: "Park" },
  { value: "Ledges", label: "Ledges" },
  { value: "Pools", label: "Pools" },
]

export function SpotTableFilters() {
  const qId = useId()
  const typeId = useId()
  const countryId = useId()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [q, setQ] = useState(searchParams.get("q") ?? "")
  const [type, setType] = useState<SpotType | "">(
    (searchParams.get("type") as SpotType | null) ?? "",
  )
  const [country, setCountry] = useState(searchParams.get("country") ?? "")

  const emit = (next: { q: string; type: SpotType | ""; country: string }) => {
    const sp = new URLSearchParams()
    if (next.q) sp.set("q", next.q)
    if (next.type) sp.set("type", next.type)
    if (next.country) sp.set("country", next.country)
    const qs = sp.toString()
    startTransition(() => {
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
    })
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px_180px]">
      <div>
        <label
          htmlFor={qId}
          className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
        >
          Search
        </label>
        <div className="relative">
          <Search
            size={12}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
          />
          <input
            id={qId}
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              emit({ q: e.target.value, type, country })
            }}
            placeholder="Name, city, address, feature…"
            className="w-full rounded-lg border border-outline-variant bg-surface-bright py-3 pl-8 pr-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor={typeId}
          className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
        >
          Type
        </label>
        <select
          id={typeId}
          value={type}
          onChange={(e) => {
            const value = e.target.value as SpotType | ""
            setType(value)
            emit({ q, type: value, country })
          }}
          className={cn(
            "w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none",
            !type && "text-secondary",
          )}
        >
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor={countryId}
          className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
        >
          Country
        </label>
        <input
          id={countryId}
          type="text"
          value={country}
          onChange={(e) => {
            setCountry(e.target.value)
            emit({ q, type, country: e.target.value })
          }}
          placeholder="e.g. France"
          className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
        />
      </div>
    </div>
  )
}
