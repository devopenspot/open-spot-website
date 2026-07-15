"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { showToast } from "@/hooks/useToast"
import { createSpotFromLookupAction } from "@/app/actions/admin-spots"
import { SpotFormFields, type SpotFormState } from "@/components/admin/spots/SpotFormFields"
import { SpotFormSubmit } from "@/components/admin/spots/SpotFormSubmit"
import type { ProjectedAddress } from "@/lib/geocode/project"
import type { SpotTypeEntity } from "@/lib/types"
import type { SportDiscipline } from "@/types/sport-events"

function buildInitialState(initialTypeSlug: string): SpotFormState {
  return {
    name: "",
    city: "",
    citySlug: "",
    address: "",
    country: "",
    countryCode: "",
    type: initialTypeSlug,
    sports: [],
    crowdLevel: 35,
    image: { imageUrl: "", file: null },
    lat: 0,
    lon: 0,
  }
}

function applyAddress(
  state: SpotFormState,
  address: ProjectedAddress,
): SpotFormState {
  return {
    ...state,
    city: state.city || address.city || "",
    citySlug:
      state.citySlug ||
      (address.city ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    country: state.country || address.country || "",
    countryCode: state.countryCode || address.countryCode || "",
    address:
      state.address ||
      [address.houseNumber, address.road].filter(Boolean).join(" "),
    lat: address.lat,
    lon: address.lon,
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
  if (state.image.file) {
    fd.set("image", state.image.file)
  }
  return fd
}

interface AdminNewSpotFormProps {
  spotTypes: readonly SpotTypeEntity[]
  initialTypeSlug: string | null
}

export function AdminNewSpotForm({
  spotTypes,
  initialTypeSlug,
}: AdminNewSpotFormProps) {
  const router = useRouter()
  const [state, setState] = useState<SpotFormState>(
    buildInitialState(initialTypeSlug ?? ""),
  )

  const handleError = (message: string) => {
    showToast(message, "error")
  }

  const handleAction = async (formData: FormData) => {
    return createSpotFromLookupAction(formData)
  }

  const submitDisabled = !state.name || !state.city

  return (
    <section
      id="admin-new-spot"
      aria-labelledby="admin-new-spot-heading"
      className="space-y-6 animate-fade-in"
    >
      <header className="border-b border-outline-variant pb-5">
        <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
          Contribute to cartography
        </span>
        <h1
          id="admin-new-spot-heading"
          className="font-display text-2xl font-bold uppercase tracking-tight text-on-surface sm:text-3xl"
        >
          Register new obstacle
        </h1>
        <p className="mt-1.5 max-w-2xl text-xs text-secondary leading-relaxed">
          Map your local ledges, stairs, DIYs, or pools. Provide accurate
          metadata to help fellow skaters coordinate sessions safely.
        </p>
      </header>

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
          latLonMode="auto-fill"
          onAutoFillResult={(address) => setState((s) => applyAddress(s, address))}
          onError={handleError}
          spotTypes={spotTypes}
        />
        <SpotFormSubmit
          state={state}
          buildFormData={buildFormData}
          action={handleAction}
          redirectTo={(result) => `/admin/spots/${result.id}`}
          label="Register Spot"
          pendingLabel="Registering…"
          disabled={submitDisabled}
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
