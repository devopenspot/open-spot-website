import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { Spot, Region, SpotTypeEntity } from "@/lib/types"

interface SpotsState {
  spots: readonly Spot[]
  regions: readonly Region[]
  spotTypes: readonly SpotTypeEntity[]
  setSpots: (spots: readonly Spot[]) => void
  setRegions: (regions: readonly Region[]) => void
  setSpotTypes: (spotTypes: readonly SpotTypeEntity[]) => void
}

export const useSpotsStore = create<SpotsState>()(
  devtools(
    (set) => ({
      spots: [],
      regions: [],
      spotTypes: [],
      setSpots: (spots) => set({ spots }),
      setRegions: (regions) => set({ regions }),
      setSpotTypes: (spotTypes) => set({ spotTypes }),
    }),
    { name: "SpotsStore", enabled: process.env.NODE_ENV === "development" },
  ),
)
