import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"

vi.mock("@/app/actions/saved-spots", () => ({
  toggleSavedAction: vi.fn(async () => true),
}))

import { useSavedSpots, __resetUserStoresForTests, __migrateLegacyForTests } from "./useSavedSpots"

const STORAGE_KEY_VERSION = "v2"
const storageKey = (userId: string) => `openspot_saved_ids_${STORAGE_KEY_VERSION}:${userId}`

async function mountSavedSpots(userId: string) {
  const result = renderHook(() => useSavedSpots(userId))
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0))
  })
  return result
}

describe("useSavedSpots", () => {
  beforeEach(() => {
    window.localStorage.clear()
    __resetUserStoresForTests()
  })

  it("starts with an empty set for a fresh user", async () => {
    const { result } = await mountSavedSpots("alice")
    expect(result.current.savedIds.size).toBe(0)
    expect(result.current.count).toBe(0)
    expect(result.current.isSaved("spot-1")).toBe(false)
  })

  it("toggle adds and removes ids, and persists to localStorage after hydration", async () => {
    const { result } = await mountSavedSpots("alice")
    await act(async () => {
      await result.current.toggle("spot-1")
    })
    expect(result.current.savedIds.has("spot-1")).toBe(true)
    expect(result.current.count).toBe(1)
    expect(window.localStorage.getItem(storageKey("alice"))).toContain("spot-1")
    await act(async () => {
      await result.current.toggle("spot-1")
    })
    expect(result.current.savedIds.has("spot-1")).toBe(false)
    expect(result.current.count).toBe(0)
  })

  it("isolates per-user storage keys", async () => {
    const { result: alice } = await mountSavedSpots("alice")
    const { result: bob } = await mountSavedSpots("bob")
    await act(async () => {
      await alice.current.toggle("spot-1")
    })
    await act(async () => {
      await bob.current.toggle("spot-2")
    })
    expect(alice.current.savedIds.has("spot-1")).toBe(true)
    expect(alice.current.savedIds.has("spot-2")).toBe(false)
    expect(bob.current.savedIds.has("spot-1")).toBe(false)
    expect(bob.current.savedIds.has("spot-2")).toBe(true)
    expect(window.localStorage.getItem(storageKey("alice"))).toContain("spot-1")
    expect(window.localStorage.getItem(storageKey("bob"))).toContain("spot-2")
  })

  it("migrates legacy v1 key (default 'dev' user) into the dev v2 key", () => {
    window.localStorage.setItem("openspot_saved_ids_v1", JSON.stringify(["legacy-1"]))
    __migrateLegacyForTests("dev")
    expect(window.localStorage.getItem(storageKey("dev"))).toContain("legacy-1")
    expect(window.localStorage.getItem("openspot_saved_ids_v1")).toBe(null)
  })

  it("does not migrate the v1 key for non-default users", () => {
    window.localStorage.setItem("openspot_saved_ids_v1", JSON.stringify(["legacy-1"]))
    __migrateLegacyForTests("alice")
    expect(window.localStorage.getItem(storageKey("alice"))).toBe(null)
    expect(window.localStorage.getItem("openspot_saved_ids_v1")).toBe(null)
  })

  it("round-trips via storage: persisted ids are reflected on a fresh mount", async () => {
    window.localStorage.setItem(storageKey("alice"), JSON.stringify(["persisted-1"]))
    const { result } = await mountSavedSpots("alice")
    await waitFor(() => {
      expect(result.current.savedIds.has("persisted-1")).toBe(true)
    })
  })

  it("ignores malformed JSON in storage", async () => {
    window.localStorage.setItem(storageKey("alice"), "not-json-{")
    const { result } = await mountSavedSpots("alice")
    await waitFor(() => {
      expect(result.current.savedIds.size).toBe(0)
    })
  })

  it("ignores non-string entries in storage", async () => {
    window.localStorage.setItem(storageKey("alice"), JSON.stringify(["ok", 42, null]))
    const { result } = await mountSavedSpots("alice")
    await waitFor(() => {
      expect(result.current.savedIds.has("ok")).toBe(true)
    })
    expect(result.current.savedIds.size).toBe(1)
  })

  it("storage-write effect does not run before hydration (regression for Pass 1 data-loss bug)", async () => {
    const setItem = vi.spyOn(window.localStorage, "setItem")
    await mountSavedSpots("regression")
    expect(setItem).not.toHaveBeenCalled()
    setItem.mockRestore()
  })
})