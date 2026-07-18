import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const requireAdminMock = vi.fn()
const createEventMock = vi.fn()

vi.mock("@/lib/auth/server", () => ({
  requireAdmin: () => requireAdminMock(),
}))

vi.mock("@/lib/services/events", () => ({
  createEvent: (...args: unknown[]) => createEventMock(...args),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock("@/lib/log", () => ({
  log: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { POST } from "./route"

const sampleEvent = {
  id: "event-1",
  slug: "fise-2025",
  name: "FISE 2025",
  url: "https://example.com",
  image: "https://example.com/img.png",
  description: "Festival",
  sports: ["Skateboard"],
  startDate: "2025-07-01",
  endDate: "2025-07-05",
  location: { city: "Montpellier", country: "France" },
  tier: "festival" as const,
  tierName: "Festival",
  featured: false,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
}

function makeJsonRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/admin/events", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

const validBody = {
  name: "FISE 2025",
  url: "https://example.com",
  image: "https://example.com/img.png",
  description: "Festival",
  sports: ["Skateboard"],
  startDate: "2025-07-01",
  endDate: "2025-07-05",
  city: "Montpellier",
  country: "France",
  tier: "festival" as const,
  featured: false,
}

beforeEach(() => {
  vi.resetAllMocks()
  requireAdminMock.mockResolvedValue({ id: "user-1" })
  createEventMock.mockResolvedValue(sampleEvent)
})

describe("POST /api/admin/events", () => {
  it("returns 201 with the created event", async () => {
    const res = await POST(makeJsonRequest(validBody))
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(sampleEvent)
    expect(createEventMock).toHaveBeenCalled()
  })

  it("returns 401 when not signed in", async () => {
    requireAdminMock.mockRejectedValue(new Error("Not signed in"))
    const res = await POST(makeJsonRequest(validBody))
    expect(res.status).toBe(401)
  })

  it("returns 403 when not admin", async () => {
    requireAdminMock.mockRejectedValue(new Error("Admin only"))
    const res = await POST(makeJsonRequest(validBody))
    expect(res.status).toBe(403)
  })

  it("returns 400 for invalid JSON", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/admin/events", {
        method: "POST",
        body: "{not json",
      }),
    )
    expect(res.status).toBe(400)
  })

  it("returns 400 for missing required fields", async () => {
    const res = await POST(makeJsonRequest({ name: "x" }))
    expect(res.status).toBe(400)
  })

  it("returns 500 when the service throws", async () => {
    createEventMock.mockRejectedValue(new Error("db down"))
    const res = await POST(makeJsonRequest(validBody))
    expect(res.status).toBe(500)
  })
})
