import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { Spot, Region, PresetImage, SpotTypeEntity } from "@/lib/types"

interface SpotsState {
  spots: readonly Spot[]
  regions: readonly Region[]
  presetImages: readonly PresetImage[]
  spotTypes: readonly SpotTypeEntity[]
  setSpots: (spots: readonly Spot[]) => void
  setRegions: (regions: readonly Region[]) => void
  setPresetImages: (presetImages: readonly PresetImage[]) => void
  setSpotTypes: (spotTypes: readonly SpotTypeEntity[]) => void
}

export const useSpotsStore = create<SpotsState>()(
  devtools(
    (set) => ({
      spots: [],
      regions: [],
      presetImages: [],
      spotTypes: [],
      setSpots: (spots) => set({ spots }),
      setRegions: (regions) => set({ regions }),
      setPresetImages: (presetImages) => set({ presetImages }),
      setSpotTypes: (spotTypes) => set({ spotTypes }),
    }),
    { name: "SpotsStore", enabled: process.env.NODE_ENV === "development" },
  ),
)
