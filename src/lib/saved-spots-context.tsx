'use client';

import { createContext, useContext, type ReactNode } from 'react'
import type { SavedSpot } from '@/types/saved-spot'

const Ctx = createContext<readonly SavedSpot[]>([])

export function SavedSpotsProvider({
  initial,
  children,
}: {
  initial: readonly SavedSpot[]
  children: ReactNode
}) {
  return <Ctx.Provider value={initial}>{children}</Ctx.Provider>
}

export function useInitialSavedSpots(): readonly SavedSpot[] {
  return useContext(Ctx)
}