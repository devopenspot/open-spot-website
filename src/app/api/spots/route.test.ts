import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const listSpotsMock = vi.fn()

vi.mock("@/lib/services/spots", () => ({
  listSpots: (...args: unknown[]) => listSpotsMock(...args),
}))

vi.mock("@/lib/log", () => ({
  log: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { GET } from "./route"

function makeRequest(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/spots${query}`)
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe("GET /api/spots", () => {
  it("returns 200 with the list result for an empty query", async () => {
    const expected = { items: [], nextCursor: null }
    listSpotsMock.mockResolvedValue(expected)
    const res = await GET(makeRequest(""))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(expected)
  })

  it("coerces comma-separated types into an array", async () => {
    listSpotsMock.mockResolvedValue({ items: [], nextCursor: null })
    await GET(makeRequest("?types=skatepark,bowl"))
    expect(listSpotsMock).toHaveBeenCalledOnce()
    const call = listSpotsMock.mock.calls[0] as [unknown] | undefined
    expect(call?.[0]).toMatchObject({ types: ["skatepark", "bowl"] })
  })

  it("coerces comma-separated ids into an array", async () => {
    listSpotsMock.mockResolvedValue({ items: [], nextCursor: null })
    await GET(makeRequest("?ids=a,b,c"))
    const call = listSpotsMock.mock.calls[0] as [unknown] | undefined
    expect(call?.[0]).toMatchObject({ ids: ["a", "b", "c"] })
  })

  it("coerces the near parameter (lat,lon,radiusMeters) into an object", async () => {
    listSpotsMock.mockResolvedValue({ items: [], nextCursor: null })
    await GET(makeRequest("?near=45.7,4.8,5000"))
    const call = listSpotsMock.mock.calls[0] as [unknown] | undefined
    expect(call?.[0]).toMatchObject({
      near: { lat: 45.7, lon: 4.8, radiusMeters: 5000 },
    })
  })

  it("coerces limit from a string into a number", async () => {
    listSpotsMock.mockResolvedValue({ items: [], nextCursor: null })
    await GET(makeRequest("?limit=10"))
    const call = listSpotsMock.mock.calls[0] as [unknown] | undefined
    expect(call?.[0]).toMatchObject({ limit: 10 })
  })

  it("returns 400 on invalid query (negative radius)", async () => {
    const res = await GET(makeRequest("?near=45.7,4.8,-1"))
    expect(res.status).toBe(400)
    expect(listSpotsMock).not.toHaveBeenCalled()
  })

  it("returns 400 on unknown query keys (strict schema)", async () => {
    const res = await GET(makeRequest("?garbage=x"))
    expect(res.status).toBe(400)
  })

  it("returns 500 when the service throws", async () => {
    listSpotsMock.mockRejectedValue(new Error("db down"))
    const res = await GET(makeRequest(""))
    expect(res.status).toBe(500)
  })
})
