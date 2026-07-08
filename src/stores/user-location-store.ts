import { create } from "zustand";
import { devtools } from "zustand/middleware";

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
  radiusMiles: NearbyRadiusMiles;
  setGranted: (loc: UserLocation) => void;
  setStatus: (status: UserLocationStatus) => void;
  setRadiusMiles: (miles: NearbyRadiusMiles) => void;
  clear: () => void;
}

export const useUserLocationStore = create<UserLocationState>()(
  devtools(
    (set) => ({
      status: "idle",
      location: null,
      radiusMiles: DEFAULT_NEARBY_RADIUS_MI,
      setGranted: (loc) =>
        set({
          status: "granted",
          location: loc,
        }),
      setStatus: (status) => set({ status }),
      setRadiusMiles: (miles) => set({ radiusMiles: miles }),
      clear: () =>
        set({
          status: "idle",
          location: null,
        }),
    }),
    {
      name: "UserLocationStore",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);
