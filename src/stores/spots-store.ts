import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { Spot, Region, PresetImage } from "@/lib/types"

interface SpotsState {
  spots: readonly Spot[]
  regions: readonly Region[]
  presetImages: readonly PresetImage[]
  setSpots: (spots: readonly Spot[]) => void
  setRegions: (regions: readonly Region[]) => void
  setPresetImages: (presetImages: readonly PresetImage[]) => void
}

export const useSpotsStore = create<SpotsState>()(
  devtools(
    (set) => ({
      spots: [],
      regions: [],
      presetImages: [],
      setSpots: (spots) => set({ spots }),
      setRegions: (regions) => set({ regions }),
      setPresetImages: (presetImages) => set({ presetImages }),
    }),
    { name: "SpotsStore", enabled: process.env.NODE_ENV === "development" },
  ),
)
