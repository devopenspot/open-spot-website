"use client";

import { useCallback } from "react";
import {
  useUserLocationStore,
  NEARBY_RADIUS_OPTIONS,
  type NearbyRadiusMiles,
  type UserLocation,
  type UserLocationStatus,
} from "@/stores/user-location-store";

const STALE_GRANT_MS = 10 * 60 * 1000;
const POSITION_TIMEOUT_MS = 8000;

export interface UseUserLocationResult {
  status: UserLocationStatus;
  location: UserLocation | null;
  grantedAt: number | null;
  radiusMiles: NearbyRadiusMiles;
  radiusOptions: readonly NearbyRadiusMiles[];
  setRadiusMiles: (miles: NearbyRadiusMiles) => void;
  request: () => Promise<UserLocationStatus>;
  clear: () => void;
}

function mapPositionError(code: number): UserLocationStatus {
  if (code === 1) return "denied";
  return "unavailable";
}

function isValidRadius(value: number): value is NearbyRadiusMiles {
  return (NEARBY_RADIUS_OPTIONS as readonly number[]).includes(value);
}

export function useUserLocation(): UseUserLocationResult {
  const status = useUserLocationStore((s) => s.status);
  const location = useUserLocationStore((s) => s.location);
  const grantedAt = useUserLocationStore((s) => s.grantedAt);
  const radiusMiles = useUserLocationStore((s) => s.radiusMiles);
  const setRadiusMilesRaw = useUserLocationStore((s) => s.setRadiusMiles);
  const setGranted = useUserLocationStore((s) => s.setGranted);
  const setStatus = useUserLocationStore((s) => s.setStatus);
  const clear = useUserLocationStore((s) => s.clear);

  const setRadiusMiles = useCallback(
    (miles: NearbyRadiusMiles) => {
      if (!isValidRadius(miles)) return;
      setRadiusMilesRaw(miles);
    },
    [setRadiusMilesRaw],
  );

  const request = useCallback(async (): Promise<UserLocationStatus> => {
    if (typeof window === "undefined") return "unavailable";
    const win = window as unknown as {
      isSecureContext?: boolean;
      navigator?: { geolocation?: Geolocation };
    };
    if (win.isSecureContext === false) {
      setStatus("unavailable");
      return "unavailable";
    }
    const geo = win.navigator?.geolocation;
    if (!geo) {
      setStatus("unavailable");
      return "unavailable";
    }

    const state = useUserLocationStore.getState();
    const isFresh =
      state.status === "granted" &&
      state.grantedAt !== null &&
      Date.now() - state.grantedAt < STALE_GRANT_MS &&
      state.location !== null;
    if (isFresh && state.location) {
      return "granted";
    }

    setStatus("requesting");
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        geo.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: POSITION_TIMEOUT_MS,
          maximumAge: 0,
        });
      });
      const loc: UserLocation = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
      setGranted(loc);
      return "granted";
    } catch (err) {
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? Number((err as { code: unknown }).code)
          : NaN;
      const next: UserLocationStatus = Number.isFinite(code)
        ? mapPositionError(code)
        : "unavailable";
      setStatus(next);
      return next;
    }
  }, [setGranted, setStatus]);

  return {
    status,
    location,
    grantedAt,
    radiusMiles,
    radiusOptions: NEARBY_RADIUS_OPTIONS,
    setRadiusMiles,
    request,
    clear,
  };
}
