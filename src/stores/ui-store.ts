import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { createJSONStorage } from "zustand/middleware"

interface UIState {
  isSearchOpen: boolean
  isDrawerOpen: boolean
  openSearch: () => void
  closeSearch: () => void
  toggleSearch: () => void
  openDrawer: () => void
  closeDrawer: () => void
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        isSearchOpen: false,
        isDrawerOpen: false,
        openSearch: () => set({ isSearchOpen: true }),
        closeSearch: () => set({ isSearchOpen: false }),
        toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),
        openDrawer: () => set({ isDrawerOpen: true }),
        closeDrawer: () => set({ isDrawerOpen: false }),
      }),
      {
        name: "openspot-ui-v1",
        storage: createJSONStorage(() => sessionStorage),
        skipHydration: true,
        partialize: (s) => ({ isSearchOpen: s.isSearchOpen }),
      },
    ),
    { name: "UIStore", enabled: process.env.NODE_ENV === "development" },
  ),
)