import { describe, it, expect, beforeEach } from "vitest"
import { useSpotsStore } from "./spots-store"
import type { Spot } from "@/lib/types"

function fakeSpot(over: Partial<Spot> = {}): Spot {
  return {
    id: "spot-1",
    slug: "spot-1",
    name: "SPOT 1",
    city: "LA",
    citySlug: "la",
    address: "1 Main",
    type: "Plaza",
    features: ["Smooth Concrete"],
    image: "https://example.com/img.png",
    communityNote: "note",
    crowdLevel: 30,
    crowdLevelLabel: "Low",
    country: "United States",
    location: { lat: 0, lon: 0 },
    createdBy: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...over,
  }
}

describe("useSpotsStore", () => {
  beforeEach(() => {
    useSpotsStore.setState({ spots: [] })
  })

  it("starts empty", () => {
    expect(useSpotsStore.getState().spots).toEqual([])
  })

  it("setSpots replaces the list", () => {
    const spots = [fakeSpot({ id: "a" }), fakeSpot({ id: "b" })]
    useSpotsStore.getState().setSpots(spots)
    expect(useSpotsStore.getState().spots).toHaveLength(2)
    expect(useSpotsStore.getState().spots[0]?.id).toBe("a")
  })
})