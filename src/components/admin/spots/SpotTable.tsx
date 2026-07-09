"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2 } from "lucide-react"
import { DeleteConfirmDialog } from "@/components/admin/common/DeleteConfirmDialog"
import { showToast } from "@/hooks/useToast"
import { deleteSpotAction } from "@/app/actions/admin-spots"
import type { Spot } from "@/lib/types"

interface SpotTableProps {
  spots: readonly Spot[]
}

export function SpotTable({ spots }: SpotTableProps) {
  const router = useRouter()
  const [pendingDelete, setPendingDelete] = useState<Spot | null>(null)

  const handleDeleted = async () => {
    if (!pendingDelete) return
    await deleteSpotAction(pendingDelete.id)
    showToast(`Deleted ${pendingDelete.name}`, "success")
    setPendingDelete(null)
    router.refresh()
  }

  if (spots.length === 0) {
    return (
      <div
        role="status"
        className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-10 text-center"
      >
        <p className="font-display text-base font-bold uppercase tracking-widest text-on-surface">
          No spots match your filters
        </p>
        <p className="mt-2 text-xs text-secondary leading-relaxed">
          Try clearing the search box or pick a different type.
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
              <th scope="col" className="px-4 py-3">City</th>
              <th scope="col" className="px-4 py-3">Type</th>
              <th scope="col" className="px-4 py-3">Country</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/60">
            {spots.map((spot) => (
              <tr
                key={spot.id}
                className="transition-colors hover:bg-surface-container-low"
              >
                <td className="px-4 py-3 font-bold text-on-surface">
                  <a
                    href={`/admin/spots/${spot.id}`}
                    className="hover:underline focus:outline-none focus-visible:underline"
                  >
                    {spot.name}
                  </a>
                </td>
                <td className="px-4 py-3 text-secondary">{spot.city}</td>
                <td className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-secondary">
                  {spot.type}
                </td>
                <td className="px-4 py-3 text-secondary">{spot.country || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <a
                      href={`/admin/spots/${spot.id}`}
                      className="inline-flex items-center gap-1 rounded border border-outline-variant px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-secondary hover:text-on-surface"
                    >
                      <Pencil size={10} aria-hidden="true" />
                      Edit
                    </a>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(spot)}
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
        title="Delete spot"
        description={
          pendingDelete
            ? `Delete "${pendingDelete.name}"? Saved spots referencing this row are also removed. This cannot be undone.`
            : ""
        }
      />
    </>
  )
}
