import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { createJSONStorage } from "zustand/middleware";

export const NEARBY_RADIUS_OPTIONS = [10, 25, 50, 100] as const;
export type NearbyRadiusMiles = (typeof NEARBY_RADIUS_OPTIONS)[number];
export const DEFAULT_NEARBY_RADIUS_MI: NearbyRadiusMiles = 50;

export type UserLocationStatus =
  | "idle"
  | "requesting"
  | "granted"
  | "denied"
  | "unavailable";

export interface UserLocation {
  lat: number;
  lon: number;
  accuracy: number;
}

interface UserLocationState {
  status: UserLocationStatus;
  location: UserLocation | null;
  grantedAt: number | null;
  radiusMiles: NearbyRadiusMiles;
  setGranted: (loc: UserLocation) => void;
  setStatus: (status: UserLocationStatus) => void;
  setRadiusMiles: (miles: NearbyRadiusMiles) => void;
  clear: () => void;
}

export const useUserLocationStore = create<UserLocationState>()(
  devtools(
    persist(
      (set) => ({
        status: "idle",
        location: null,
        grantedAt: null,
        radiusMiles: DEFAULT_NEARBY_RADIUS_MI,
        setGranted: (loc) =>
          set({
            status: "granted",
            location: loc,
            grantedAt: Date.now(),
          }),
        setStatus: (status) => set({ status }),
        setRadiusMiles: (miles) => set({ radiusMiles: miles }),
        clear: () =>
          set({
            status: "idle",
            location: null,
            grantedAt: null,
          }),
      }),
      {
        name: "openspot-user-location-v1",
        storage: createJSONStorage(() => sessionStorage),
        skipHydration: true,
        partialize: (s) => ({
          status: s.status,
          location: s.location,
          grantedAt: s.grantedAt,
          radiusMiles: s.radiusMiles,
        }),
      },
    ),
    {
      name: "UserLocationStore",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);
