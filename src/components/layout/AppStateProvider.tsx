'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Spot } from '@/lib/types';
import { useSavedSpots } from '@/hooks/useSavedSpots';

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
