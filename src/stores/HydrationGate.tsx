"use client"

import { useEffect, type ReactNode } from "react"
import { useUIStore } from "./ui-store"
import { useMapFilterStore } from "./map-filter-store"

export function HydrationGate({ children }: { children: ReactNode }) {
  useEffect(() => {
    useUIStore.persist.rehydrate()
    useMapFilterStore.persist.rehydrate()
  }, [])
  return <>{children}</>
}