import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import type { Spot } from "@/lib/types"

const createSignedUrlsMock = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    storage: {
      from: () => ({
        createSignedUrls: (...args: unknown[]) => createSignedUrlsMock(...args),
      }),
    },
  }),
}))

import { withImageUrls, getSpotImageUrls } from "../storage"

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
    image: "https://example.com/fallback.png",
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

describe("withImageUrls", () => {
  beforeEach(() => {
    createSignedUrlsMock.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("returns spots unchanged when no entry has an imagePath", async () => {
    const entries = [
      { spot: fakeSpot({ id: "a" }), imagePath: null },
      { spot: fakeSpot({ id: "b" }), imagePath: null },
    ]
    const out = await withImageUrls(entries)
    expect(out).toHaveLength(2)
    expect(out[0]?.image).toBe("https://example.com/fallback.png")
    expect(createSignedUrlsMock).not.toHaveBeenCalled()
  })

  it("replaces imagePath entries with their signed URL", async () => {
    createSignedUrlsMock.mockResolvedValueOnce({
      data: [
        { path: "spots/abc/x.png", signedUrl: "https://signed.example.com/x.png" },
      ],
      error: null,
    })
    const entries = [
      {
        spot: fakeSpot({ id: "a", image: "spots/abc/x.png" }),
        imagePath: "spots/abc/x.png",
      },
      { spot: fakeSpot({ id: "b" }), imagePath: null },
    ]
    const out = await withImageUrls(entries)
    expect(out[0]?.image).toBe("https://signed.example.com/x.png")
    expect(out[1]?.image).toBe("https://example.com/fallback.png")
  })

  it("deduplicates paths before calling the storage API", async () => {
    createSignedUrlsMock.mockResolvedValueOnce({
      data: [
        { path: "spots/abc/x.png", signedUrl: "https://signed.example.com/x.png" },
      ],
      error: null,
    })
    const entries = [
      { spot: fakeSpot({ id: "a" }), imagePath: "spots/abc/x.png" },
      { spot: fakeSpot({ id: "b" }), imagePath: "spots/abc/x.png" },
    ]
    await withImageUrls(entries)
    expect(createSignedUrlsMock).toHaveBeenCalledTimes(1)
    const firstCall = createSignedUrlsMock.mock.calls[0]
    expect(firstCall?.[0]).toEqual(["spots/abc/x.png"])
  })

  it("throws on a storage error", async () => {
    createSignedUrlsMock.mockResolvedValueOnce({
      data: null,
      error: { message: "boom" },
    })
    await expect(
      withImageUrls([{ spot: fakeSpot(), imagePath: "spots/x/y.png" }]),
    ).rejects.toThrow(/boom/)
  })
})

describe("getSpotImageUrls", () => {
  beforeEach(() => {
    createSignedUrlsMock.mockReset()
  })

  it("returns an empty map for no paths", async () => {
    const map = await getSpotImageUrls([])
    expect(map.size).toBe(0)
    expect(createSignedUrlsMock).not.toHaveBeenCalled()
  })
})
