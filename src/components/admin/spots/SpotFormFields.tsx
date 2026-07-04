"use client"

import { useId } from "react"
import { Tag, Plus } from "lucide-react"
import { getTerrainOptions } from "@/lib/spots"
import { SPORT_DISCIPLINES, type SportDiscipline } from "@/types/sport-events"
import { CROWD_LEVEL } from "@/lib/constants"
import { ImageSourceField, type ImageSourceFieldValue } from "./ImageSourceField"
import type { SpotType } from "@/lib/types"

export interface SpotFormState {
  name: string
  city: string
  citySlug: string
  address: string
  country: string
  type: SpotType
  features: string[]
  sports: SportDiscipline[]
  communityNote: string
  crowdLevel: number
  image: ImageSourceFieldValue
  lat: number
  lon: number
}

interface SpotFormFieldsProps {
  state: SpotFormState
  onChange: (next: SpotFormState) => void
  errors?: Partial<Record<keyof SpotFormState, string>>
  imageDisabled?: boolean
}

export function SpotFormFields({
  state,
  onChange,
  errors,
  imageDisabled = false,
}: SpotFormFieldsProps) {
  const terrainOptions = getTerrainOptions()
  const nameId = useId()
  const typeId = useId()
  const cityId = useId()
  const addressId = useId()
  const countryId = useId()
  const crowdId = useId()
  const crowdHelpId = useId()
  const featuresId = useId()
  const noteId = useId()
  const sportsFieldsetId = useId()
  const featuresListId = useId()
  const errorId = useId()

  const update = <K extends keyof SpotFormState>(
    key: K,
    value: SpotFormState[K],
  ) => onChange({ ...state, [key]: value })

  const toggleFeature = (feature: string) => {
    if (state.features.includes(feature)) {
      update(
        "features",
        state.features.filter((f) => f !== feature),
      )
    } else {
      update("features", [...state.features, feature])
    }
  }

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
            Spot name <span aria-hidden="true">*</span>
          </label>
          <input
            id={nameId}
            type="text"
            required
            value={state.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. The White Marble Nine"
            aria-invalid={Boolean(errors?.name)}
            className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor={typeId}
            className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            Terrain type <span aria-hidden="true">*</span>
          </label>
          <select
            id={typeId}
            value={state.type}
            onChange={(e) => update("type", e.target.value as SpotType)}
            className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
          >
            {terrainOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label.toUpperCase()}
              </option>
            ))}
          </select>
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
            placeholder="e.g. Los Angeles, CA"
            aria-invalid={Boolean(errors?.city)}
            className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor={countryId}
            className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
          >
            Country
          </label>
          <input
            id={countryId}
            type="text"
            value={state.country}
            onChange={(e) => update("country", e.target.value)}
            placeholder="e.g. United States"
            className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor={addressId}
          className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
        >
          Address
        </label>
        <input
          id={addressId}
          type="text"
          value={state.address}
          onChange={(e) => update("address", e.target.value)}
          placeholder="e.g. Hope Street, L.A."
          className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
        />
      </div>

      <ImageSourceField
        value={state.image}
        onChange={(v) => update("image", v)}
        disabled={imageDisabled}
      />

      <fieldset
        id={sportsFieldsetId}
        className="rounded-xl border border-outline-variant bg-surface-container-low p-5"
      >
        <legend className="flex items-center px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-secondary">
          Sport types
        </legend>
        <p className="mb-3 text-[10px] text-secondary">
          Which disciplines does this spot support? Pick all that apply.
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {SPORT_DISCIPLINES.map((sport) => {
            const active = state.sports.includes(sport)
            return (
              <li key={sport}>
                <label
                  className={`inline-flex cursor-pointer items-center rounded-full border px-3 py-1 text-[10px] font-semibold transition-all ${
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

      <div>
        <label
          htmlFor={crowdId}
          className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
        >
          Crowd approximation{" "}
          <span aria-hidden="true">({state.crowdLevel}% occupancy)</span>
        </label>
        <input
          id={crowdId}
          type="range"
          min={0}
          max={100}
          value={state.crowdLevel}
          onChange={(e) => update("crowdLevel", Number(e.target.value))}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={state.crowdLevel}
          aria-valuetext={`${state.crowdLevel} percent occupied`}
          aria-describedby={crowdHelpId}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-outline-variant accent-primary"
        />
        <div
          id={crowdHelpId}
          className="mt-1 flex justify-between font-mono text-[9px] text-secondary"
          aria-hidden="true"
        >
          <span>0% (empty)</span>
          <span>50% (moderate)</span>
          <span>100% (prime time)</span>
        </div>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-secondary">
          {state.crowdLevel > CROWD_LEVEL.HIGH_MIN
            ? "High (Busy)"
            : state.crowdLevel > CROWD_LEVEL.LOW_MAX
              ? "Moderate Activity"
              : "Low Crowd (Ideal)"}
        </p>
      </div>

      <fieldset className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
        <legend className="flex items-center px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-secondary">
          <Tag size={12} className="mr-1.5" aria-hidden="true" />
          Obstacle specifications / features
        </legend>
        <div className="mb-3 flex space-x-2">
          <label htmlFor={featuresId} className="visually-hidden">
            Add feature tag
          </label>
          <input
            id={featuresId}
            type="text"
            placeholder="Add tag (e.g. Red Curb, Slappy, Waxed)"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                const value = (e.target as HTMLInputElement).value.trim()
                if (value && !state.features.includes(value)) {
                  update("features", [...state.features, value])
                  ;(e.target as HTMLInputElement).value = ""
                }
              }
            }}
            className="flex-1 rounded-lg border border-outline-variant bg-surface-bright px-3 py-2 text-xs font-medium text-on-surface focus:border-outline focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              const input = document.getElementById(
                featuresId,
              ) as HTMLInputElement | null
              if (!input) return
              const value = input.value.trim()
              if (value && !state.features.includes(value)) {
                toggleFeature(value)
                input.value = ""
              }
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-on-surface px-4 text-xs font-bold uppercase tracking-wider text-surface transition-all hover:bg-on-surface/90"
          >
            <Plus size={12} aria-hidden="true" />
            <span>Add</span>
          </button>
        </div>
        <ul
          id={featuresListId}
          className="flex flex-wrap gap-1.5"
          aria-label="Selected features"
        >
          {state.features.map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center rounded-full border border-outline-variant/60 bg-surface-container-high px-3 py-1 text-[10px] font-semibold text-on-surface"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => toggleFeature(tag)}
                aria-label={`Remove ${tag}`}
                className="ml-1.5 text-xs font-bold text-secondary hover:text-error"
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      </fieldset>

      <div>
        <label
          htmlFor={noteId}
          className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary"
        >
          Community intel / local notes
        </label>
        <textarea
          id={noteId}
          rows={3}
          value={state.communityNote}
          onChange={(e) => update("communityNote", e.target.value)}
          placeholder="Describe runway smoothness, security timing, wax needs, lighting, etc..."
          className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
        />
      </div>

      {Object.values(errors ?? {}).some(Boolean) ? (
        <p
          id={errorId}
          role="alert"
          className="rounded-lg border border-error/30 bg-error-container/30 px-4 py-2 text-xs text-error"
        >
          {Object.values(errors ?? {}).filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </div>
  )
}
