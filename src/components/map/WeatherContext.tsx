'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import type { SpotWeather } from '@/lib/weather/weather-cached';

interface WeatherContextValue {
  weather: Record<string, SpotWeather>;
  getWeather: (id: string) => SpotWeather | undefined;
}

const WeatherCtx = createContext<WeatherContextValue | null>(null);

export function WeatherProvider({
  initialWeather,
  children,
}: {
  initialWeather: Record<string, SpotWeather>;
  children: ReactNode;
}) {
  const getWeather = useCallback(
    (id: string) => initialWeather[id],
    [initialWeather],
  );
  const value = useMemo<WeatherContextValue>(
    () => ({ weather: initialWeather, getWeather }),
    [initialWeather, getWeather],
  );
  return <WeatherCtx.Provider value={value}>{children}</WeatherCtx.Provider>;
}

export function useWeather(): WeatherContextValue {
  const ctx = useContext(WeatherCtx);
  if (!ctx) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return ctx;
}