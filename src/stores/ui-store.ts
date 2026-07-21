import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { createJSONStorage } from "zustand/middleware"
import { usePreferencesStore } from "@/stores/preferences-store"

type PendingAction = () => void

interface UIState {
  isSearchOpen: boolean
  isDrawerOpen: boolean
  isOnboardingOpen: boolean
  pendingOnboardingAction: PendingAction | null
  openSearch: () => void
  closeSearch: () => void
  toggleSearch: () => void
  /**
   * Run `action` if the user has already completed onboarding, otherwise
   * open the onboarding dialog and resume `action` after the user submits.
   */
  tryRun: (action: () => void) => void
  /** Alias kept for callers that semantically want to open the search. */
  tryOpenSearch: () => void
  openOnboarding: () => void
  closeOnboarding: () => void
  openDrawer: () => void
  closeDrawer: () => void
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        isSearchOpen: false,
        isDrawerOpen: false,
        isOnboardingOpen: false,
        pendingOnboardingAction: null,
        openSearch: () => set({ isSearchOpen: true }),
        closeSearch: () => set({ isSearchOpen: false }),
        toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),
        tryRun: (action) => {
          const { onboarded } = usePreferencesStore.getState()
          if (onboarded) {
            action()
            return
          }
          set({
            pendingOnboardingAction: action,
            isOnboardingOpen: true,
          })
        },
        tryOpenSearch: () => {
          get().tryRun(() => set({ isSearchOpen: true }))
        },
        openOnboarding: () => set({ isOnboardingOpen: true }),
        closeOnboarding: () =>
          set({
            isOnboardingOpen: false,
            pendingOnboardingAction: null,
          }),
        openDrawer: () => set({ isDrawerOpen: true }),
        closeDrawer: () => set({ isDrawerOpen: false }),
      }),
      {
        name: "openspot-ui-v1",
        storage: createJSONStorage(() => sessionStorage),
        skipHydration: true,
        partialize: (s) => ({
          isSearchOpen: s.isSearchOpen,
          isOnboardingOpen: s.isOnboardingOpen,
        }),
      },
    ),
    { name: "UIStore", enabled: process.env.NODE_ENV === "development" },
  ),
)
