"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateEventAction } from "@/app/actions/admin-events"
import { EventFormFields, type EventFormState } from "@/components/admin/events/EventFormFields"
import { EventFormSubmit } from "@/components/admin/events/EventFormSubmit"
import { SPORT_DISCIPLINES, type SportDiscipline, type SportEvent } from "@/types/sport-events"

function stateFromEvent(event: SportEvent): EventFormState {
  return {
    name: event.name,
    shortName: event.shortName ?? "",
    url: event.url,
    image: event.image,
    description: event.description,
    sports: event.sports.filter(
      (s): s is SportDiscipline =>
        SPORT_DISCIPLINES.includes(s as SportDiscipline),
    ),
    startDate: event.startDate,
    endDate: event.endDate ?? "",
    city: event.location.city,
    country: event.location.country,
    countryCode: event.location.countryCode ?? "",
    venue: event.location.venue ?? "",
    latitude:
      event.location.latitude !== undefined
        ? String(event.location.latitude)
        : "",
    longitude:
      event.location.longitude !== undefined
        ? String(event.location.longitude)
        : "",
    tier: event.tier,
    featured: event.featured ?? false,
  }
}

function buildFormData(state: EventFormState): FormData {
  const fd = new FormData()
  fd.set("name", state.name)
  if (state.shortName) fd.set("shortName", state.shortName)
  else fd.set("shortName", "")
  fd.set("url", state.url)
  fd.set("image", state.image)
  fd.set("description", state.description)
  for (const sport of state.sports as readonly SportDiscipline[]) {
    fd.append("sports", sport)
  }
  fd.set("startDate", state.startDate)
  if (state.endDate) fd.set("endDate", state.endDate)
  else fd.set("endDate", "")
  fd.set("city", state.city)
  fd.set("country", state.country)
  if (state.countryCode) fd.set("countryCode", state.countryCode)
  else fd.set("countryCode", "")
  if (state.venue) fd.set("venue", state.venue)
  else fd.set("venue", "")
  if (state.latitude) fd.set("latitude", state.latitude)
  else fd.set("latitude", "")
  if (state.longitude) fd.set("longitude", state.longitude)
  else fd.set("longitude", "")
  fd.set("tier", state.tier)
  fd.set("featured", state.featured ? "on" : "off")
  return fd
}

interface AdminEditEventFormProps {
  event: SportEvent
}

export function AdminEditEventForm({ event }: AdminEditEventFormProps) {
  const router = useRouter()
  const [state, setState] = useState<EventFormState>(stateFromEvent(event))

  const handleAction = async (formData: FormData) => {
    return updateEventAction(event.id, formData)
  }

  return (
    <section
      id="admin-edit-event"
      aria-labelledby="admin-edit-event-heading"
      className="space-y-6 animate-fade-in"
    >
      <header className="border-b border-outline-variant pb-5">
        <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
          Edit event
        </span>
        <h1
          id="admin-edit-event-heading"
          className="font-display text-2xl font-bold uppercase tracking-tight text-on-surface sm:text-3xl"
        >
          {event.name}
        </h1>
        <p className="mt-1.5 max-w-2xl text-xs text-secondary leading-relaxed">
          Slug{" "}
          <span className="font-mono">{event.slug}</span>. Last updated{" "}
          <time dateTime={event.updatedAt}>{event.updatedAt}</time>.
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4 text-xs sm:grid-cols-4">
        <div>
          <dt className="font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
            ID
          </dt>
          <dd className="mt-1 font-mono text-[10px] text-on-surface break-all">
            {event.id}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
            Tier
          </dt>
          <dd className="mt-1 font-mono text-[10px] uppercase tracking-widest text-on-surface">
            {event.tier}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
            Created
          </dt>
          <dd className="mt-1 font-mono text-[10px] text-on-surface">
            {event.createdAt}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
            Featured
          </dt>
          <dd className="mt-1 font-mono text-[10px] uppercase tracking-widest text-on-surface">
            {event.featured ? "Yes" : "No"}
          </dd>
        </div>
      </dl>

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
          redirectTo={() => `/admin/events/${event.id}`}
          label="Save changes"
          pendingLabel="Saving…"
          disabled={false}
        />
      </form>

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
