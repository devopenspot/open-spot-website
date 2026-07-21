"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useUser } from "@/hooks/useUser";
import { ROUTES } from "@/lib/nav";
import {
  useMapStore,
  type MapController,
  type MapMode,
} from "@/stores/map-store";
import type { Spot } from "@/lib/types";

export interface MapActions {
  selectMode: (next: MapMode) => void;
  toggleActivePin: (id: string) => void;
  clearActivePin: () => void;
  bindController: (controller: MapController | null) => void;
  resetView: () => void;
  reCenter: () => void;
  dismissNearby: () => void;
  dismissSaved: () => void;
  clearLocationAndNearby: () => void;
  openSpot: (spot: Spot) => void;
}

function buildNearbyUrl(searchParams: URLSearchParams): string {
  const query = searchParams.toString();
  return query ? `${ROUTES.map}?${query}` : ROUTES.map;
}

export function useMapActions(): MapActions {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { radiusMiles, request: requestLocation, clear: clearLocation } =
    useUserLocation();
  const setMapMode = useMapStore((s) => s.setMapMode);
  const setActivePin = useMapStore((s) => s.setActivePin);
  const toggleActivePinStore = useMapStore((s) => s.toggleActivePin);
  const fitBoundsToSpots = useMapStore((s) => s.fitBoundsToSpots);
  const fitRadius = useMapStore((s) => s.fitRadius);
  const bindController = useMapStore((s) => s.bindController);
  const user = useUser();
  const [, startTransition] = useTransition();

  const selectMode = useCallback(
    (next: MapMode) => {
      if (next === "saved" && user === null) {
        startTransition(() => {
          router.push(
            `/login?next=${encodeURIComponent(`${ROUTES.map}?saved=1`)}`,
          );
        });
        return;
      }
      setMapMode(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === "nearby") {
        params.set("nearby", "1");
        params.delete("saved");
      } else if (next === "saved") {
        params.set("saved", "1");
        params.delete("nearby");
      } else {
        params.delete("nearby");
        params.delete("saved");
      }
      const url = buildNearbyUrl(params);
      startTransition(() => {
        router.replace(url, { scroll: false });
      });
      if (next === "nearby") {
        void requestLocation();
      }
    },
    [router, searchParams, requestLocation, setMapMode, user],
  );

  const dismissNearby = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("nearby");
    const url = buildNearbyUrl(params);
    startTransition(() => {
      router.replace(url, { scroll: false });
    });
  }, [router, searchParams]);

  const dismissSaved = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("saved");
    const url = buildNearbyUrl(params);
    startTransition(() => {
      router.replace(url, { scroll: false });
    });
  }, [router, searchParams]);

  const clearLocationAndNearby = useCallback(() => {
    clearLocation();
    dismissNearby();
  }, [clearLocation, dismissNearby]);

  const resetView = useCallback(() => {
    fitBoundsToSpots();
    setActivePin(null);
  }, [fitBoundsToSpots, setActivePin]);

  const reCenter = useCallback(() => {
    fitRadius(radiusMiles * 1609.344);
  }, [fitRadius, radiusMiles]);

  const openSpot = useCallback(
    (spot: Spot) => {
      startTransition(() => {
        router.push(ROUTES.spot(spot.id));
      });
    },
    [router],
  );

  return {
    selectMode,
    toggleActivePin: toggleActivePinStore,
    clearActivePin: () => setActivePin(null),
    bindController,
    resetView,
    reCenter,
    dismissNearby,
    dismissSaved,
    clearLocationAndNearby,
    openSpot,
  };
}
