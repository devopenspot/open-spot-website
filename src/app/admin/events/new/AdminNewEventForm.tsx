"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createEventAction } from "@/app/actions/admin-events"
import { EventFormFields, type EventFormState } from "@/components/admin/events/EventFormFields"
import { EventFormSubmit } from "@/components/admin/events/EventFormSubmit"
import type { SportDiscipline } from "@/types/sport-events"

function buildInitialState(): EventFormState {
  return {
    name: "",
    shortName: "",
    url: "",
    image: "",
    description: "",
    sports: [],
    startDate: "",
    endDate: "",
    city: "",
    country: "",
    countryCode: "",
    venue: "",
    latitude: "",
    longitude: "",
    tier: "festival",
    featured: false,
  }
}

function buildFormData(state: EventFormState): FormData {
  const fd = new FormData()
  fd.set("name", state.name)
  if (state.shortName) fd.set("shortName", state.shortName)
  fd.set("url", state.url)
  fd.set("image", state.image)
  fd.set("description", state.description)
  for (const sport of state.sports as readonly SportDiscipline[]) {
    fd.append("sports", sport)
  }
  fd.set("startDate", state.startDate)
  if (state.endDate) fd.set("endDate", state.endDate)
  fd.set("city", state.city)
  fd.set("country", state.country)
  if (state.countryCode) fd.set("countryCode", state.countryCode)
  if (state.venue) fd.set("venue", state.venue)
  if (state.latitude) fd.set("latitude", state.latitude)
  if (state.longitude) fd.set("longitude", state.longitude)
  fd.set("tier", state.tier)
  if (state.featured) fd.set("featured", "on")
  return fd
}

interface AdminNewEventFormProps {
  writeEnabled: boolean
}

export function AdminNewEventForm({ writeEnabled }: AdminNewEventFormProps) {
  const router = useRouter()
  const [state, setState] = useState<EventFormState>(buildInitialState())

  const handleAction = async (formData: FormData) => {
    return createEventAction(formData)
  }

  return (
    <section
      id="admin-new-event"
      aria-labelledby="admin-new-event-heading"
      className="space-y-6 animate-fade-in"
    >
      <header className="border-b border-outline-variant pb-5">
        <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
          Add to the calendar
        </span>
        <h1
          id="admin-new-event-heading"
          className="font-display text-2xl font-bold uppercase tracking-tight text-on-surface sm:text-3xl"
        >
          New event
        </h1>
        <p className="mt-1.5 max-w-2xl text-xs text-secondary leading-relaxed">
          World tours, championships, festivals, federations. The public
          listing reflects changes immediately.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
        noValidate
        className="space-y-8"
      >
        <EventFormFields state={state} onChange={setState} />
        <EventFormSubmit
          state={state}
          buildFormData={buildFormData}
          action={handleAction}
          redirectTo={(result) => `/admin/events/${result.id}`}
          label={writeEnabled ? "Create event" : "DB mode required"}
          pendingLabel="Creating…"
          disabled={!writeEnabled}
        />
      </form>

      {!writeEnabled ? (
        <p className="rounded-lg border border-outline-variant bg-surface-container-low p-3 text-xs text-secondary">
          Write actions are disabled in JSON mode. Set{" "}
          <code className="rounded bg-surface-container px-1 py-0.5 font-mono">
            SPOTS_DATA_SOURCE=db
          </code>{" "}
          to enable.
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => router.push("/admin/events")}
        className="rounded-lg border border-outline px-6 py-3 text-xs font-bold uppercase tracking-widest text-on-surface transition-all hover:bg-surface-container"
      >
        Back to events
      </button>
    </section>
  )
}
