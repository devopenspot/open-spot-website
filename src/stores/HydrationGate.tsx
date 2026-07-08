"use client"

import { useEffect, type ReactNode } from "react"
import { useUIStore } from "./ui-store"

export function HydrationGate({ children }: { children: ReactNode }) {
  useEffect(() => {
    useUIStore.persist.rehydrate()
  }, [])
  return <>{children}</>
}
