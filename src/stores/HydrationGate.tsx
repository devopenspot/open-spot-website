"use client"

import { useEffect, type ReactNode } from "react"
import { useUIStore } from "./ui-store"
import { usePreferencesStore } from "./preferences-store"

export function HydrationGate({ children }: { children: ReactNode }) {
  useEffect(() => {
    useUIStore.persist.rehydrate()
    usePreferencesStore.persist.rehydrate()
  }, [])
  return <>{children}</>
}
