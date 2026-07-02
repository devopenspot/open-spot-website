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

export const useSpotsStore = create<SpotsState>()(
  devtools(
    (set) => ({
      spots: [],
      setSpots: (spots) => set({ spots }),
      createSpot: async (input) => {
        const created = await createSpotAction(input)
        set((s) => ({ spots: [created, ...s.spots] }))
        return created
      },
    }),
    { name: "SpotsStore", enabled: process.env.NODE_ENV === "development" },
  ),
)