import { create } from "zustand"
import { devtools, persist, createJSONStorage } from "zustand/middleware"

export type DistanceUnit = "mi" | "km"
export type TemperatureUnit = "C" | "F"

export const DEFAULT_DISTANCE_UNIT: DistanceUnit = "mi"
export const DEFAULT_TEMPERATURE_UNIT: TemperatureUnit = "C"

interface PreferencesState {
  onboarded: boolean
  distanceUnit: DistanceUnit
  temperatureUnit: TemperatureUnit
  region: string | null
  country: string | null
  setOnboarded: (v: boolean) => void
  setDistanceUnit: (u: DistanceUnit) => void
  setTemperatureUnit: (u: TemperatureUnit) => void
  setRegion: (name: string | null) => void
  setCountry: (name: string | null) => void
  reset: () => void
}

export const usePreferencesStore = create<PreferencesState>()(
  devtools(
    persist(
      (set) => ({
        onboarded: false,
        distanceUnit: DEFAULT_DISTANCE_UNIT,
        temperatureUnit: DEFAULT_TEMPERATURE_UNIT,
        region: null,
        country: null,
        setOnboarded: (v) => set({ onboarded: v }),
        setDistanceUnit: (u) => set({ distanceUnit: u }),
        setTemperatureUnit: (u) => set({ temperatureUnit: u }),
        setRegion: (name) => set({ region: name }),
        setCountry: (name) => set({ country: name }),
        reset: () =>
          set({
            onboarded: false,
            distanceUnit: DEFAULT_DISTANCE_UNIT,
            temperatureUnit: DEFAULT_TEMPERATURE_UNIT,
            region: null,
            country: null,
          }),
      }),
      {
        name: "openspot-preferences-v1",
        storage: createJSONStorage(() => localStorage),
        skipHydration: true,
        partialize: (s) => ({
          onboarded: s.onboarded,
          distanceUnit: s.distanceUnit,
          temperatureUnit: s.temperatureUnit,
          region: s.region,
          country: s.country,
        }),
      },
    ),
    {
      name: "PreferencesStore",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
)
