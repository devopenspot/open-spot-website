import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { Spot } from "@/lib/types"
import { createSpotAction } from "@/app/actions/spots"
import type { NewSpot } from "@/lib/repositories"

interface SpotsState {
  spots: readonly Spot[]
  setSpots: (spots: readonly Spot[]) => void
  createSpot: (input: NewSpot) => Promise<Spot>
}

function toFormData(input: NewSpot): FormData {
  const fd = new FormData()
  if (input.id) fd.set("id", input.id)
  fd.set("name", input.name)
  fd.set("city", input.city)
  if (input.citySlug) fd.set("citySlug", input.citySlug)
  fd.set("address", input.address)
  fd.set("type", input.type)
  fd.set("features", input.features.join(","))
  fd.set("imageUrl", input.image)
  if (input.imagePath) fd.set("imagePath", input.imagePath)
  fd.set("communityNote", input.communityNote)
  fd.set("crowdLevel", String(input.crowdLevel))
  fd.set("crowdLevelLabel", input.crowdLevelLabel)
  fd.set("country", input.country)
  fd.set("locationLat", String(input.location.lat))
  fd.set("locationLon", String(input.location.lon))
  if (input.createdBy) fd.set("createdBy", input.createdBy)
  return fd
}

export const useSpotsStore = create<SpotsState>()(
  devtools(
    (set) => ({
      spots: [],
      setSpots: (spots) => set({ spots }),
      createSpot: async (input) => {
        const created = await createSpotAction(toFormData(input))
        set((s) => ({ spots: [created, ...s.spots] }))
        return created
      },
    }),
    { name: "SpotsStore", enabled: process.env.NODE_ENV === "development" },
  ),
)
