'use client';

import { useEffect, type ReactNode } from 'react';
import type { Spot } from '@/lib/types';
import type { CachedSpotWeather } from '@/lib/weather/weather-cached';
import { useSpotsStore } from '@/stores/spots-store';
import { HydrationGate } from '@/stores/HydrationGate';
import { WeatherProvider } from './WeatherContext';
import { AppShell } from './AppShell';
import type { SavedSpot } from '@/types/saved-spot';

export function SpotsProvider({
  children,
  initialSpots,
  initialWeather,
  savedSpots,
}: {
  children: ReactNode;
  initialSpots: readonly Spot[];
  initialWeather: Record<string, CachedSpotWeather>;
  savedSpots?: readonly SavedSpot[];
}) {
  const setSpots = useSpotsStore((s) => s.setSpots);

  useEffect(() => {
    setSpots(initialSpots);
  }, [initialSpots, setSpots]);
  void savedSpots;

  return (
    <WeatherProvider initialWeather={initialWeather}>
      <HydrationGate>
        <AppShell>{children}</AppShell>
      </HydrationGate>
    </WeatherProvider>
  );
}