"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"
import { Overlay } from "@/components/feedback/Overlay"
import { showToast } from "@/hooks/useToast"

interface DeleteConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  title: string
  description: string
  confirmLabel?: string
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
}: DeleteConfirmDialogProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = () => {
    setError(null)
    startTransition(async () => {
      try {
        await onConfirm()
        showToast("Deleted", "success")
        onClose()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Delete failed"
        setError(message)
        showToast(message, "error")
      }
    })
  }

  return (
    <Overlay
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="delete-confirm-title"
      role="alertdialog"
      contentId="delete-confirm-panel"
    >
      <div
        id="delete-confirm-panel"
        className="rounded-none-none border border-outline-variant bg-surface-bright p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Trash2
            size={16}
            aria-hidden="true"
            className="text-error"
          />
          <h2
            id="delete-confirm-title"
            className="font-display text-base font-bold uppercase tracking-widest text-on-surface"
          >
            {title}
          </h2>
        </div>
        <p className="text-xs text-secondary leading-relaxed">{description}</p>
        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-none-none border border-error/30 bg-error-container/30 px-3 py-2 text-xs text-error"
          >
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-none-none border border-outline px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface transition-all hover:bg-surface-container disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="rounded-none-none bg-on-surface px-4 py-2 text-xs font-bold uppercase tracking-widest text-surface transition-all hover:bg-on-surface/90 disabled:opacity-50"
          >
            {pending ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </Overlay>
  )
}
