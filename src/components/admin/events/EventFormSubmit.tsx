"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { showToast } from "@/hooks/useToast"
import type { EventFormState } from "./EventFormFields"

interface EventFormSubmitProps {
  state: EventFormState
  buildFormData: (state: EventFormState) => FormData
  action: (formData: FormData) => Promise<unknown>
  redirectTo: (result: { id: string }) => string
  label: string
  pendingLabel: string
  disabled?: boolean
}

export function EventFormSubmit({
  state,
  buildFormData,
  action,
  redirectTo,
  label,
  pendingLabel,
  disabled = false,
}: EventFormSubmitProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.name || !state.url || !state.image || !state.city || !state.country || !state.startDate) {
      showToast("Name, URL, image, city, country, and start date are required", "error")
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
        onClick={() => router.push("/admin/events")}
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
