import { describe, it, expect, beforeEach } from "vitest"
import { useUIStore } from "./ui-store"

describe("useUIStore", () => {
  beforeEach(() => {
    useUIStore.setState({ isSearchOpen: false, isDrawerOpen: false })
  })

  it("toggles search and drawer independently", () => {
    useUIStore.getState().openSearch()
    expect(useUIStore.getState().isSearchOpen).toBe(true)
    expect(useUIStore.getState().isDrawerOpen).toBe(false)

    useUIStore.getState().openDrawer()
    expect(useUIStore.getState().isSearchOpen).toBe(true)
    expect(useUIStore.getState().isDrawerOpen).toBe(true)

    useUIStore.getState().closeSearch()
    expect(useUIStore.getState().isSearchOpen).toBe(false)
    expect(useUIStore.getState().isDrawerOpen).toBe(true)
  })

  it("toggleSearch flips the boolean", () => {
    useUIStore.getState().toggleSearch()
    expect(useUIStore.getState().isSearchOpen).toBe(true)
    useUIStore.getState().toggleSearch()
    expect(useUIStore.getState().isSearchOpen).toBe(false)
  })
})