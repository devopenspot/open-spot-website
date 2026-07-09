import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { Spot, Region } from "@/lib/types"

interface SpotsState {
  spots: readonly Spot[]
  regions: readonly Region[]
  setSpots: (spots: readonly Spot[]) => void
  setRegions: (regions: readonly Region[]) => void
}

export const useSpotsStore = create<SpotsState>()(
  devtools(
    (set) => ({
      spots: [],
      regions: [],
      setSpots: (spots) => set({ spots }),
      setRegions: (regions) => set({ regions }),
    }),
    { name: "SpotsStore", enabled: process.env.NODE_ENV === "development" },
  ),
)
