import { createJSONStorage } from "zustand/middleware"
import type { PersistStorage } from "zustand/middleware"

export const isClient = typeof window !== "undefined"

export function safeStorage<T>(
  getStore: () => Storage | undefined,
): PersistStorage<T> | undefined {
  if (!isClient) return undefined
  const store = getStore()
  if (!store) return undefined
  return createJSONStorage(() => store) as PersistStorage<T>
}