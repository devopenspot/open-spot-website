import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Spot } from "@/lib/types";

export type MapMode = "nearby" | "filtered" | "saved";

export interface MapController {
  flyTo: (spot: Spot) => void;
  fitBoundsToSpots: () => void;
  flyToUserLocation: () => void;
  fitRadius: (radiusMeters: number) => void;
}

interface MapState {
  activePinId: string | null;
  mapMode: MapMode;
  controller: MapController | null;
  setActivePin: (id: string | null) => void;
  toggleActivePin: (id: string) => void;
  setMapMode: (mode: MapMode) => void;
  bindController: (controller: MapController | null) => void;
  flyToSpot: (spot: Spot) => void;
  fitBoundsToSpots: () => void;
  fitRadius: (radiusMeters: number) => void;
  flyToUserLocation: () => void;
}

export const useMapStore = create<MapState>()(
  devtools(
    (set, get) => ({
      activePinId: null,
      mapMode: "filtered",
      controller: null,
      setActivePin: (id) => set({ activePinId: id }),
      toggleActivePin: (id) =>
        set((s) => ({ activePinId: s.activePinId === id ? null : id })),
      setMapMode: (mode) => set({ mapMode: mode }),
      bindController: (controller) => set({ controller }),
      flyToSpot: (spot) => get().controller?.flyTo(spot),
      fitBoundsToSpots: () => get().controller?.fitBoundsToSpots(),
      fitRadius: (radiusMeters) => get().controller?.fitRadius(radiusMeters),
      flyToUserLocation: () => get().controller?.flyToUserLocation(),
    }),
    { name: "MapStore", enabled: process.env.NODE_ENV === "development" },
  ),
);
