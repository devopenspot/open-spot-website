"use client"

import { useId, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { cn } from "@/lib/cn"
import { useSpotsStore } from "@/stores/spots-store"

function parseTypesParam(value: string | null): string[] {
  if (!value) return []
  return Array.from(
    new Set(
      value
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0),
    ),
  )
}

function typesToParam(types: readonly string[]): string {
  return Array.from(new Set(types.map((t) => t.trim().toLowerCase()))).join(",")
}

export function SpotTableFilters() {
  const qId = useId()
  const countryId = useId()
  const typesFieldsetId = useId()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const spotTypes = useSpotsStore((s) => s.spotTypes)

  const [q, setQ] = useState(searchParams.get("q") ?? "")
  const [types, setTypes] = useState<string[]>(
    parseTypesParam(searchParams.get("type")),
  )
  const [country, setCountry] = useState(searchParams.get("country") ?? "")

  const emit = (next: { q: string; types: string[]; country: string }) => {
    const sp = new URLSearchParams()
    if (next.q) sp.set("q", next.q)
    const typesValue = typesToParam(next.types)
    if (typesValue) sp.set("type", typesValue)
    if (next.country) sp.set("country", next.country)
    const qs = sp.toString()
    startTransition(() => {
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
    })
  }

  const toggleType = (slug: string) => {
    const next = types.includes(slug)
      ? types.filter((s) => s !== slug)
      : [...types, slug]
    setTypes(next)
    emit({ q, types: next, country })
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px_180px]">
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
              emit({ q: e.target.value, types, country })
            }}
            placeholder="Name, city, address, feature…"
            className="w-full rounded-lg border border-outline-variant bg-surface-bright py-3 pl-8 pr-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
          />
        </div>
      </div>
      <fieldset
        id={typesFieldsetId}
        className="rounded-lg border border-outline-variant bg-surface-bright p-2"
      >
        <legend className="px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-secondary">
          Types
        </legend>
        <ul
          className="flex flex-wrap gap-1"
          aria-label="Filter by spot type (match any)"
        >
          {spotTypes.map((t) => {
            const active = types.includes(t.slug)
            return (
              <li key={t.slug}>
                <button
                  type="button"
                  onClick={() => toggleType(t.slug)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all",
                    active
                      ? "border-primary bg-primary text-surface"
                      : "border-outline-variant bg-surface text-on-surface hover:border-outline",
                  )}
                >
                  {t.name}
                </button>
              </li>
            )
          })}
        </ul>
        {types.length > 0 ? (
          <p
            className="mt-1 font-mono text-[9px] uppercase tracking-wider text-secondary"
            aria-live="polite"
          >
            Match any of {types.length} type{types.length === 1 ? "" : "s"}
          </p>
        ) : null}
      </fieldset>
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
            emit({ q, types, country: e.target.value })
          }}
          placeholder="e.g. France"
          className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
        />
      </div>
    </div>
  )
}
