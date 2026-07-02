import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { createJSONStorage } from "zustand/middleware"

interface MapFilterState {
  region: string | null
  country: string | null
  setRegion: (name: string | null) => void
  setCountry: (name: string | null) => void
  clearMapFilter: () => void
}

export const useMapFilterStore = create<MapFilterState>()(
  devtools(
    persist(
      (set) => ({
        region: null,
        country: null,
        setRegion: (name) => {
          if (name === null) {
            set({ region: null, country: null })
            return
          }
          set({ region: name })
        },
        setCountry: (name) => set({ country: name }),
        clearMapFilter: () => set({ region: null, country: null }),
      }),
      {
        name: "openspot-map-filter-v1",
        storage: createJSONStorage(() => localStorage),
        skipHydration: true,
        partialize: (s) => ({ region: s.region, country: s.country }),
        version: 1,
        migrate: (persisted) => persisted as MapFilterState,
      },
    ),
    { name: "MapFilterStore", enabled: process.env.NODE_ENV === "development" },
  ),
)