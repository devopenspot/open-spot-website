'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Spot } from '@/lib/types';
import { useSavedSpots } from '@/hooks/useSavedSpots';
import { getRegions } from '@/lib/spots';

interface AppStateValue {
  spots: Spot[];
  addSpot: (spot: Spot) => void;
  savedIds: Set<string>;
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  savedCount: number;
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  region: string | null;
  country: string | null;
  setRegion: (name: string | null) => void;
  setCountry: (name: string | null) => void;
  clearMapFilter: () => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({
  children,
  initialSpots,
}: {
  children: ReactNode;
  initialSpots: readonly Spot[];
}) {
  const [spots, setSpots] = useState<Spot[]>(() => [...initialSpots]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [region, setRegionState] = useState<string | null>(null);
  const [country, setCountryState] = useState<string | null>(null);

  const { savedIds, isSaved, toggle, count } = useSavedSpots();

  const addSpot = useCallback((spot: Spot) => {
    setSpots(prev => [spot, ...prev]);
  }, []);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  const toggleSearch = useCallback(
    () => setIsSearchOpen(prev => !prev),
    [],
  );
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleSaved = useCallback((id: string) => toggle(id), [toggle]);

  const setRegion = useCallback((name: string | null) => {
    setRegionState(name);
    if (name === null) {
      setCountryState(null);
      return;
    }
    setCountryState((prev) => {
      if (prev === null) return null;
      const next = getRegions().find((r) => r.name === name);
      if (!next) return null;
      return next.countries.includes(prev) ? prev : null;
    });
  }, []);

  const setCountry = useCallback((name: string | null) => {
    setCountryState(name);
  }, []);

  const clearMapFilter = useCallback(() => {
    setRegionState(null);
    setCountryState(null);
  }, []);

  const value = useMemo<AppStateValue>(
    () => ({
      spots,
      addSpot,
      savedIds,
      isSaved,
      toggleSaved,
      savedCount: count,
      isSearchOpen,
      openSearch,
      closeSearch,
      toggleSearch,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      region,
      country,
      setRegion,
      setCountry,
      clearMapFilter,
    }),
    [
      spots,
      addSpot,
      savedIds,
      isSaved,
      toggleSaved,
      count,
      isSearchOpen,
      openSearch,
      closeSearch,
      toggleSearch,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      region,
      country,
      setRegion,
      setCountry,
      clearMapFilter,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}
