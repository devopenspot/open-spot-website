import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const listEventsMock = vi.fn()

vi.mock("@/lib/services/events", () => ({
  listEvents: (...args: unknown[]) => listEventsMock(...args),
  listEventsRaw: vi.fn(),
  findFeaturedEvent: vi.fn(),
  findEventById: vi.fn(),
}))

vi.mock("@/lib/log", () => ({
  log: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { GET } from "./route"

function makeRequest(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/events${query}`)
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe("GET /api/events", () => {
  it("returns 200 with items from the service", async () => {
    listEventsMock.mockResolvedValue([{ id: "e1" }, { id: "e2" }])
    const res = await GET(makeRequest(""))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { items: unknown[] }
    expect(body.items).toEqual([{ id: "e1" }, { id: "e2" }])
  })

  it("coerces the limit query param from a string into a number", async () => {
    listEventsMock.mockResolvedValue([])
    await GET(makeRequest("?limit=10"))
    const call = listEventsMock.mock.calls[0] as [unknown] | undefined
    expect(call?.[0]).toMatchObject({ limit: 10 })
  })

  it("coerces the featured query param into a boolean", async () => {
    listEventsMock.mockResolvedValue([])
    await GET(makeRequest("?featured=true"))
    const call = listEventsMock.mock.calls[0] as [unknown] | undefined
    expect(call?.[0]).toMatchObject({ featured: true })
  })

  it("returns 400 on invalid tier", async () => {
    const res = await GET(makeRequest("?tier=invalid"))
    expect(res.status).toBe(400)
  })

  it("returns 400 on unknown query keys (strict schema)", async () => {
    const res = await GET(makeRequest("?garbage=x"))
    expect(res.status).toBe(400)
  })

  it("returns 500 when the service throws", async () => {
    listEventsMock.mockRejectedValue(new Error("db down"))
    const res = await GET(makeRequest(""))
    expect(res.status).toBe(500)
  })
})
