import Link from "next/link"
import { Plus } from "lucide-react"
import { getSpotRepositoryAsync } from "@/lib/repositories"
import { SpotTable } from "@/components/admin/spots/SpotTable"
import { SpotTableFilters } from "@/components/admin/spots/SpotTableFilters"

interface AdminSpotsPageProps {
  searchParams: Promise<{
    q?: string
    type?: string
    country?: string
  }>
}

export const metadata = {
  title: "Admin · Spots",
}

export default async function AdminSpotsPage({ searchParams }: AdminSpotsPageProps) {
  const params = await searchParams
  const q = (params.q ?? "").trim()
  const type = (params.type ?? "").trim() || undefined
  const country = (params.country ?? "").trim()

  const repo = await getSpotRepositoryAsync()
  const result = await repo.list({
    q: q || undefined,
    type,
    country: country || undefined,
    limit: 100,
  })

  return (
    <section
      id="admin-spots"
      aria-labelledby="admin-spots-heading"
      className="space-y-6 animate-fade-in"
    >
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-outline-variant pb-5">
        <div>
          <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
            Catalogue
          </span>
          <h1
            id="admin-spots-heading"
            className="font-display text-2xl font-bold uppercase tracking-tight text-on-surface sm:text-3xl"
          >
            Spots
          </h1>
          <p className="mt-1.5 max-w-2xl text-xs text-secondary leading-relaxed">
            {result.items.length} shown
            {result.nextCursor ? " — refine your search to count precisely" : ""}
            .
          </p>
        </div>
        <Link
          href="/admin/spots/new"
          className="inline-flex items-center gap-2 rounded-lg bg-on-surface px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-surface transition-all hover:bg-on-surface/90"
        >
          <Plus size={12} aria-hidden="true" />
          New spot
        </Link>
      </header>

      <SpotTableFilters />
      <SpotTable spots={result.items} />
    </section>
  )
}
