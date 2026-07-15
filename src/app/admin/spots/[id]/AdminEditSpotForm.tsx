"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateSpotAction } from "@/app/actions/admin-spots"
import { SpotFormFields, type SpotFormState } from "@/components/admin/spots/SpotFormFields"
import { SpotFormSubmit } from "@/components/admin/spots/SpotFormSubmit"
import { SPORT_DISCIPLINES, type SportDiscipline } from "@/types/sport-events"
import type { Spot, SpotTypeEntity } from "@/lib/types"

function stateFromSpot(spot: Spot): SpotFormState {
  return {
    name: spot.name,
    city: spot.city,
    citySlug: spot.citySlug,
    address: spot.address,
    country: spot.country,
    countryCode: spot.countryCode,
    type: spot.typeSlug,
    sports: spot.sports.filter(
      (s): s is SportDiscipline =>
        SPORT_DISCIPLINES.includes(s as SportDiscipline),
    ),
    crowdLevel: spot.crowdLevel,
    image: { imageUrl: spot.image, file: null },
    lat: spot.location.lat,
    lon: spot.location.lon,
  }
}

function buildFormData(state: SpotFormState): FormData {
  const fd = new FormData()
  fd.set("name", state.name)
  fd.set("city", state.city)
  fd.set("citySlug", state.citySlug)
  fd.set("address", state.address)
  fd.set("country", state.country)
  fd.set("countryCode", state.countryCode)
  fd.set("type", state.type)
  for (const sport of state.sports as readonly SportDiscipline[]) {
    fd.append("sports", sport)
  }
  fd.set("crowdLevel", String(state.crowdLevel))
  fd.set("imageUrl", state.image.imageUrl)
  fd.set("lat", String(state.lat))
  fd.set("lon", String(state.lon))
  return fd
}

interface AdminEditSpotFormProps {
  spot: Spot
  spotTypes: readonly SpotTypeEntity[]
}

export function AdminEditSpotForm({ spot, spotTypes }: AdminEditSpotFormProps) {
  const router = useRouter()
  const [state, setState] = useState<SpotFormState>(stateFromSpot(spot))

  const handleAction = async (formData: FormData) => {
    return updateSpotAction(spot.id, formData)
  }

  return (
    <section
      id="admin-edit-spot"
      aria-labelledby="admin-edit-spot-heading"
      className="space-y-6 animate-fade-in"
    >
      <header className="border-b border-outline-variant pb-5">
        <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
          Edit entry
        </span>
        <h1
          id="admin-edit-spot-heading"
          className="font-display text-2xl font-bold uppercase tracking-tight text-on-surface sm:text-3xl"
        >
          {spot.name}
        </h1>
        <p className="mt-1.5 max-w-2xl text-xs text-secondary leading-relaxed">
          Last updated{" "}
          <time dateTime={spot.updatedAt}>{spot.updatedAt}</time>. Changes
          are written to the spots cache immediately.
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4 text-xs sm:grid-cols-4">
        <div>
          <dt className="font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
            ID
          </dt>
          <dd className="mt-1 font-mono text-[10px] text-on-surface break-all">
            {spot.id}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
            Slug
          </dt>
          <dd className="mt-1 font-mono text-[10px] text-on-surface break-all">
            {spot.slug}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
            Created
          </dt>
          <dd className="mt-1 font-mono text-[10px] text-on-surface">
            {spot.createdAt}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
            Created by
          </dt>
          <dd className="mt-1 font-mono text-[10px] text-on-surface break-all">
            {spot.createdBy ?? "—"}
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
        <SpotFormFields
          state={state}
          onChange={setState}
          latLonMode="preview"
          spotTypes={spotTypes}
        />
        <SpotFormSubmit
          state={state}
          buildFormData={buildFormData}
          action={handleAction}
          redirectTo={() => `/admin/spots/${spot.id}`}
          label="Save changes"
          pendingLabel="Saving…"
          disabled={false}
        />
      </form>

      <button
        type="button"
        onClick={() => router.push("/admin/spots")}
        className="rounded-lg border border-outline px-6 py-3 text-xs font-bold uppercase tracking-widest text-on-surface transition-all hover:bg-surface-container"
      >
        Back to spots
      </button>
    </section>
  )
}
