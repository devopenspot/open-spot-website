import Link from "next/link"
import { Plus } from "lucide-react"
import { getSpotsDataSource } from "@/lib/env"
import { getEventRepositoryAsync } from "@/lib/repositories"
import { EventTable } from "@/components/admin/events/EventTable"
import { EventTableFilters } from "@/components/admin/events/EventTableFilters"
import type { SportEventTier } from "@/types/sport-events"

interface AdminEventsPageProps {
  searchParams: Promise<{
    q?: string
    tier?: string
    country?: string
  }>
}

export const metadata = {
  title: "Admin · Events",
}

export default async function AdminEventsPage({ searchParams }: AdminEventsPageProps) {
  const params = await searchParams
  const q = (params.q ?? "").trim()
  const tier: SportEventTier | undefined =
    (params.tier as SportEventTier | undefined) || undefined
  const country = (params.country ?? "").trim()

  const repo = await getEventRepositoryAsync()
  const result = await repo.list({
    q: q || undefined,
    tier,
    country: country || undefined,
    limit: 100,
  })
  const writeEnabled = getSpotsDataSource() === "db"

  return (
    <section
      id="admin-events"
      aria-labelledby="admin-events-heading"
      className="space-y-6 animate-fade-in"
    >
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-outline-variant pb-5">
        <div>
          <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
            Circuit
          </span>
          <h1
            id="admin-events-heading"
            className="font-display text-2xl font-bold uppercase tracking-tight text-on-surface sm:text-3xl"
          >
            Events
          </h1>
          <p className="mt-1.5 max-w-2xl text-xs text-secondary leading-relaxed">
            {result.items.length} shown
            {result.nextCursor ? " — refine your search to count precisely" : ""}
            .
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 rounded-lg bg-on-surface px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-surface transition-all hover:bg-on-surface/90"
        >
          <Plus size={12} aria-hidden="true" />
          New event
        </Link>
      </header>

      <EventTableFilters />
      <EventTable events={result.items} writeEnabled={writeEnabled} />
    </section>
  )
}
