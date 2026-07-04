import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { Spot } from "@/lib/types"

interface SpotsState {
  spots: readonly Spot[]
  setSpots: (spots: readonly Spot[]) => void
}

export const useSpotsStore = create<SpotsState>()(
  devtools(
    (set) => ({
      spots: [],
      setSpots: (spots) => set({ spots }),
    }),
    { name: "SpotsStore", enabled: process.env.NODE_ENV === "development" },
  ),
)
