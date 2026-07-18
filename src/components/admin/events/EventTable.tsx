"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2 } from "lucide-react"
import { DeleteConfirmDialog } from "@/components/admin/common/DeleteConfirmDialog"
import { showToast } from "@/hooks/useToast"
import type { SportEvent } from "@/types/sport-events"

interface EventTableProps {
  events: readonly SportEvent[]
}

const TIER_LABEL: Record<string, string> = {
  "world-tour": "World Tour",
  championship: "Championship",
  festival: "Festival",
  federation: "Federation",
}

export function EventTable({ events }: EventTableProps) {
  const router = useRouter()
  const [pendingDelete, setPendingDelete] = useState<SportEvent | null>(null)

  const handleDeleted = async () => {
    if (!pendingDelete) return
    const res = await fetch(
      `/api/admin/events/${encodeURIComponent(pendingDelete.id)}`,
      { method: "DELETE" },
    )
    if (res.status === 401) {
      router.push("/login")
      return
    }
    if (!res.ok && res.status !== 204) {
      const body = (await res.json().catch(() => null)) as
        | { error?: string }
        | null
      showToast(body?.error ?? `Delete failed (${res.status})`, "error")
      return
    }
    showToast(`Deleted ${pendingDelete.name}`, "success")
    setPendingDelete(null)
    router.refresh()
  }

  if (events.length === 0) {
    return (
      <div
        role="status"
        className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-10 text-center"
      >
        <p className="font-display text-base font-bold uppercase tracking-widest text-on-surface">
          No events match your filters
        </p>
        <p className="mt-2 text-xs text-secondary leading-relaxed">
          Try clearing the search box or pick a different tier.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-outline-variant">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-outline-variant bg-surface-container-low font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
            <tr>
              <th scope="col" className="px-4 py-3">Name</th>
              <th scope="col" className="px-4 py-3">Location</th>
              <th scope="col" className="px-4 py-3">Tier</th>
              <th scope="col" className="px-4 py-3">Dates</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/60">
            {events.map((event) => (
              <tr
                key={event.id}
                className="transition-colors hover:bg-surface-container-low"
              >
                <td className="px-4 py-3 font-bold text-on-surface">
                  <a
                    href={`/admin/events/${event.id}`}
                    className="hover:underline focus:outline-none focus-visible:underline"
                  >
                    {event.name}
                    {event.featured ? (
                      <span
                        className="ml-2 inline-block rounded-sm bg-on-surface px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-widest text-surface"
                        title="Featured"
                      >
                        Featured
                      </span>
                    ) : null}
                  </a>
                </td>
                <td className="px-4 py-3 text-secondary">
                  {event.location.city}, {event.location.country}
                </td>
                <td className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-secondary">
                  {TIER_LABEL[event.tier] ?? event.tier}
                </td>
                <td className="px-4 py-3 font-mono text-[10px] text-secondary">
                  {event.startDate}
                  {event.endDate ? ` → ${event.endDate}` : ""}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <a
                      href={`/admin/events/${event.id}`}
                      className="inline-flex items-center gap-1 rounded border border-outline-variant px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-secondary hover:text-on-surface"
                    >
                      <Pencil size={10} aria-hidden="true" />
                      Edit
                    </a>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(event)}
                      className="inline-flex items-center gap-1 rounded border border-outline-variant px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-secondary hover:text-error"
                    >
                      <Trash2 size={10} aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeleteConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDeleted}
        title="Delete event"
        description={
          pendingDelete
            ? `Delete "${pendingDelete.name}"? This cannot be undone.`
            : ""
        }
      />
    </>
  )
}
