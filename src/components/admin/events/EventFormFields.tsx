"use client"

import { useId } from "react"
import { SPORT_DISCIPLINES, type SportDiscipline } from "@/types/sport-events"

const TIERS = [
  { value: "world-tour", label: "World Tour" },
  { value: "championship", label: "Championship" },
  { value: "festival", label: "Festival" },
  { value: "federation", label: "Federation" },
] as const

export interface EventFormState {
  name: string
  shortName: string
  url: string
  image: string
  description: string
  sports: SportDiscipline[]
  startDate: string
  endDate: string
  city: string
  country: string
  countryCode: string
  venue: string
  latitude: string
  longitude: string
  tier: (typeof TIERS)[number]["value"]
  featured: boolean
}

interface EventFormFieldsProps {
  state: EventFormState
  onChange: (next: EventFormState) => void
}

export function EventFormFields({ state, onChange }: EventFormFieldsProps) {
  const nameId = useId()
  const shortId = useId()
  const urlId = useId()
  const imageId = useId()
  const descId = useId()
  const sportsId = useId()
  const startId = useId()
  const endId = useId()
  const cityId = useId()
  const countryId = useId()
  const ccId = useId()
  const venueId = useId()
  const latId = useId()
  const lonId = useId()
  const tierId = useId()
  const featuredId = useId()

  const update = <K extends keyof EventFormState>(
    key: K,
    value: EventFormState[K],
  ) => onChange({ ...state, [key]: value })

  const toggleSport = (sport: SportDiscipline) => {
    if (state.sports.includes(sport)) {
      update(
        "sports",
        state.sports.filter((s) => s !== sport),
      )
    } else {
      update("sports", [...state.sports, sport])
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor={nameId}
            className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            Event name <span aria-hidden="true">*</span>
          </label>
          <input
            id={nameId}
            type="text"
            required
            value={state.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. World Skate Games 2026"
            className="w-full rounded-none-none border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-none-none focus:border-outline focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor={shortId}
            className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            Short name
          </label>
          <input
            id={shortId}
            type="text"
            value={state.shortName}
            onChange={(e) => update("shortName", e.target.value)}
            placeholder="e.g. WSG26"
            className="w-full rounded-none-none border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-none-none focus:border-outline focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor={urlId}
            className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            Official URL <span aria-hidden="true">*</span>
          </label>
          <input
            id={urlId}
            type="url"
            required
            value={state.url}
            onChange={(e) => update("url", e.target.value)}
            placeholder="https://example.com/event"
            className="w-full rounded-none-none border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-none-none focus:border-outline focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor={imageId}
            className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            Image URL <span aria-hidden="true">*</span>
          </label>
          <input
            id={imageId}
            type="url"
            required
            value={state.image}
            onChange={(e) => update("image", e.target.value)}
            placeholder="https://example.com/banner.png"
            className="w-full rounded-none-none border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-none-none focus:border-outline focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor={descId}
          className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
        >
          Description
        </label>
        <textarea
          id={descId}
          rows={3}
          value={state.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="A short blurb about the event…"
          className="w-full rounded-none-none border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-none-none focus:border-outline focus:outline-none"
        />
      </div>

      <fieldset
        id={sportsId}
        className="rounded-none-none border border-outline-variant bg-surface-container-low p-5"
      >
        <legend className="flex items-center px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-secondary">
          Disciplines featured
        </legend>
        <p className="mb-3 text-[10px] text-secondary">
          Which disciplines does this event cover? Pick all that apply.
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {SPORT_DISCIPLINES.map((sport) => {
            const active = state.sports.includes(sport)
            return (
              <li key={sport}>
                <label
                  className={`inline-flex cursor-pointer items-center rounded-none-none border px-3 py-1 text-[10px] font-semibold transition-all ${
                    active
                      ? "border-primary bg-primary text-surface"
                      : "border-outline-variant bg-surface text-on-surface hover:border-outline"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleSport(sport)}
                    className="sr-only"
                    aria-label={sport}
                  />
                  {sport}
                </label>
              </li>
            )
          })}
        </ul>
      </fieldset>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor={startId}
            className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            Start date <span aria-hidden="true">*</span>
          </label>
          <input
            id={startId}
            type="date"
            required
            value={state.startDate}
            onChange={(e) => update("startDate", e.target.value)}
            className="w-full rounded-none-none border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-none-none focus:border-outline focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor={endId}
            className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            End date
          </label>
          <input
            id={endId}
            type="date"
            value={state.endDate}
            onChange={(e) => update("endDate", e.target.value)}
            className="w-full rounded-none-none border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-none-none focus:border-outline focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor={cityId}
            className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            City <span aria-hidden="true">*</span>
          </label>
          <input
            id={cityId}
            type="text"
            required
            value={state.city}
            onChange={(e) => update("city", e.target.value)}
            className="w-full rounded-none-none border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-none-none focus:border-outline focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor={countryId}
            className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            Country <span aria-hidden="true">*</span>
          </label>
          <input
            id={countryId}
            type="text"
            required
            value={state.country}
            onChange={(e) => update("country", e.target.value)}
            className="w-full rounded-none-none border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-none-none focus:border-outline focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor={ccId}
            className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            Country code (ISO 3166-1 alpha-2)
          </label>
          <input
            id={ccId}
            type="text"
            maxLength={2}
            value={state.countryCode}
            onChange={(e) => update("countryCode", e.target.value.toUpperCase())}
            placeholder="e.g. ES"
            className="w-full rounded-none-none border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-none-none focus:border-outline focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor={venueId}
            className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            Venue
          </label>
          <input
            id={venueId}
            type="text"
            value={state.venue}
            onChange={(e) => update("venue", e.target.value)}
            placeholder="e.g. Olympic Stadium"
            className="w-full rounded-none-none border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-none-none focus:border-outline focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor={latId}
            className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            Latitude
          </label>
          <input
            id={latId}
            type="number"
            step="any"
            min={-90}
            max={90}
            value={state.latitude}
            onChange={(e) => update("latitude", e.target.value)}
            placeholder="optional"
            className="w-full rounded-none-none border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-none-none focus:border-outline focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor={lonId}
            className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            Longitude
          </label>
          <input
            id={lonId}
            type="number"
            step="any"
            min={-180}
            max={180}
            value={state.longitude}
            onChange={(e) => update("longitude", e.target.value)}
            placeholder="optional"
            className="w-full rounded-none-none border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-none-none focus:border-outline focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor={tierId}
            className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            Tier <span aria-hidden="true">*</span>
          </label>
          <select
            id={tierId}
            value={state.tier}
            onChange={(e) =>
              update(
                "tier",
                e.target.value as EventFormState["tier"],
              )
            }
            className="w-full rounded-none-none border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-none-none focus:border-outline focus:outline-none"
          >
            {TIERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor={featuredId}
            className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            Featured
          </label>
          <label
            htmlFor={featuredId}
            className="mt-2 inline-flex items-center gap-2 text-xs text-on-surface"
          >
            <input
              id={featuredId}
              type="checkbox"
              checked={state.featured}
              onChange={(e) => update("featured", e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span>Pin to the featured hero on the public listing</span>
          </label>
        </div>
      </div>
    </div>
  )
}
