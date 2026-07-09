'use client';

import { useEffect, type ReactNode } from 'react';
import type { Spot, Region, PresetImage } from '@/lib/types';
import type { CachedSpotWeather } from '@/lib/weather/weather-cached';
import type { User } from '@/lib/user';
import { useSpotsStore } from '@/stores/spots-store';
import { HydrationGate } from '@/stores/HydrationGate';
import { WeatherProvider } from './WeatherContext';
import { UserProvider } from '@/lib/user-context';
import { SavedSpotsProvider } from '@/lib/saved-spots-context';
import { AppShell } from './AppShell';
import type { SavedSpot } from '@/types/saved-spot';

export function SpotsProvider({
  children,
  initialSpots,
  initialRegions,
  initialPresetImages,
  initialWeather,
  initialUser,
  initialSavedSpots,
}: {
  children: ReactNode;
  initialSpots: readonly Spot[];
  initialRegions: readonly Region[];
  initialPresetImages: readonly PresetImage[];
  initialWeather: Record<string, CachedSpotWeather>;
  initialUser: User;
  initialSavedSpots?: readonly SavedSpot[];
}) {
  const setSpots = useSpotsStore((s) => s.setSpots);
  const setRegions = useSpotsStore((s) => s.setRegions);
  const setPresetImages = useSpotsStore((s) => s.setPresetImages);

  useEffect(() => {
    setSpots(initialSpots);
  }, [initialSpots, setSpots]);

  useEffect(() => {
    setRegions(initialRegions);
  }, [initialRegions, setRegions]);

  useEffect(() => {
    setPresetImages(initialPresetImages);
  }, [initialPresetImages, setPresetImages]);

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
