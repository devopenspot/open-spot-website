"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { showToast } from "@/hooks/useToast"
import type { SpotFormState } from "./SpotFormFields"

interface SpotFormSubmitProps {
  state: SpotFormState
  /** Build the FormData payload for the action. */
  buildFormData: (state: SpotFormState) => FormData
  /** Server action (create or update). */
  action: (formData: FormData) => Promise<unknown>
  /** Path to navigate to on success (typically the edit page). */
  redirectTo: (result: { id: string }) => string
  /** Button label, e.g. "Register Spot" / "Save changes". */
  label: string
  /** Pending label, e.g. "Registering…" / "Saving…". */
  pendingLabel: string
  /** Disable submission (e.g. in JSON mode). */
  disabled?: boolean
}

export function SpotFormSubmit({
  state,
  buildFormData,
  action,
  redirectTo,
  label,
  pendingLabel,
  disabled = false,
}: SpotFormSubmitProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.name || !state.city) {
      showToast("Name and city are required", "error")
      return
    }
    const formData = buildFormData(state)
    startTransition(async () => {
      try {
        const result = (await action(formData)) as { id: string }
        showToast("Saved", "success")
        router.push(redirectTo(result))
        router.refresh()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Save failed"
        showToast(message, "error")
      }
    })
  }

  return (
    <div className="flex justify-end gap-2 border-t border-outline-variant pt-5">
      <button
        type="button"
        onClick={() => router.push("/admin/spots")}
        disabled={pending}
        className="rounded-lg border border-outline px-6 py-3 text-xs font-bold uppercase tracking-widest text-on-surface transition-all hover:bg-surface-container disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={pending || disabled}
        onClick={handleSubmit}
        title={disabled ? "DB mode required" : undefined}
        className="rounded-lg bg-on-surface px-8 py-3 text-xs font-bold uppercase tracking-widest text-surface shadow-md transition-all hover:bg-on-surface/90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? pendingLabel : label}
      </button>
    </div>
  )
}
