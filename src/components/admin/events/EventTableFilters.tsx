"use client"

import { useId, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { cn } from "@/lib/cn"
import type { SportEventTier } from "@/types/sport-events"

const TIER_OPTIONS: ReadonlyArray<{ value: SportEventTier | ""; label: string }> = [
  { value: "", label: "All tiers" },
  { value: "world-tour", label: "World Tour" },
  { value: "championship", label: "Championship" },
  { value: "festival", label: "Festival" },
  { value: "federation", label: "Federation" },
]

export function EventTableFilters() {
  const qId = useId()
  const tierId = useId()
  const countryId = useId()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [q, setQ] = useState(searchParams.get("q") ?? "")
  const [tier, setTier] = useState<SportEventTier | "">(
    (searchParams.get("tier") as SportEventTier | null) ?? "",
  )
  const [country, setCountry] = useState(searchParams.get("country") ?? "")

  const emit = (next: { q: string; tier: SportEventTier | ""; country: string }) => {
    const sp = new URLSearchParams()
    if (next.q) sp.set("q", next.q)
    if (next.tier) sp.set("tier", next.tier)
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
              emit({ q: e.target.value, tier, country })
            }}
            placeholder="Name, description, city…"
            className="w-full rounded-lg border border-outline-variant bg-surface-bright py-3 pl-8 pr-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor={tierId}
          className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
        >
          Tier
        </label>
        <select
          id={tierId}
          value={tier}
          onChange={(e) => {
            const value = e.target.value as SportEventTier | ""
            setTier(value)
            emit({ q, tier: value, country })
          }}
          className={cn(
            "w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none",
            !tier && "text-secondary",
          )}
        >
          {TIER_OPTIONS.map((t) => (
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
            emit({ q, tier, country: e.target.value })
          }}
          placeholder="e.g. Spain"
          className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
        />
      </div>
    </div>
  )
}
