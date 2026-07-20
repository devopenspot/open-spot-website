"use client";

import { useEffect, type ReactNode } from "react";
import type { Spot, Region, SpotTypeEntity } from "@/lib/types";
import type { SpotWeather } from "@/lib/weather/weather-cached";
import type { User } from "@/lib/user";
import { useSpotsStore } from "@/stores/spots-store";
import { HydrationGate } from "@/stores/HydrationGate";
import { WeatherProvider } from "../shell/WeatherContext";
import { UserProvider } from "@/lib/user-context";
import { SavedSpotsProvider } from "@/lib/saved-spots-context";
import { AppShell } from "./AppShell";
import type { SavedSpot } from "@/types/saved-spot";

export function SpotsProvider({
  children,
  initialSpots,
  initialRegions,
  initialSpotTypes,
  initialWeather,
  initialUser,
  initialSavedSpots,
}: {
  children: ReactNode;
  initialSpots: readonly Spot[];
  initialRegions: readonly Region[];
  initialSpotTypes: readonly SpotTypeEntity[];
  initialWeather: Record<string, SpotWeather>;
  initialUser: User | null;
  initialSavedSpots?: readonly SavedSpot[];
}) {
  const setSpots = useSpotsStore((s) => s.setSpots);
  const setRegions = useSpotsStore((s) => s.setRegions);
  const setSpotTypes = useSpotsStore((s) => s.setSpotTypes);

  useEffect(() => {
    setSpots(initialSpots);
  }, [initialSpots, setSpots]);

  useEffect(() => {
    setRegions(initialRegions);
  }, [initialRegions, setRegions]);

  useEffect(() => {
    setSpotTypes(initialSpotTypes);
  }, [initialSpotTypes, setSpotTypes]);

  return (
    <UserProvider user={initialUser}>
      <WeatherProvider initialWeather={initialWeather}>
        <SavedSpotsProvider initial={initialSavedSpots ?? []}>
          <HydrationGate>
            <AppShell>{children}</AppShell>
          </HydrationGate>
        </SavedSpotsProvider>
      </WeatherProvider>
    </UserProvider>
  );
}
