import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const requireAdminMock = vi.fn()
const updateEventMock = vi.fn()
const deleteEventMock = vi.fn()

vi.mock("@/lib/auth/server", () => ({
  requireAdmin: () => requireAdminMock(),
}))

vi.mock("@/lib/services/events", () => ({
  updateEvent: (...args: unknown[]) => updateEventMock(...args),
  deleteEvent: (...args: unknown[]) => deleteEventMock(...args),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock("@/lib/log", () => ({
  log: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { DELETE, PATCH } from "./route"

const fakeContext = (id: string) => ({ params: Promise.resolve({ id }) })

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

function makeJsonRequest(method: string, body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/admin/events/event-1", {
    method,
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  requireAdminMock.mockResolvedValue({ id: "user-1" })
  updateEventMock.mockResolvedValue(sampleEvent)
  deleteEventMock.mockResolvedValue(undefined)
})

describe("PATCH /api/admin/events/[id]", () => {
  it("returns 200 with the updated event", async () => {
    const res = await PATCH(
      makeJsonRequest("PATCH", { name: "Updated" }),
      fakeContext("event-1") as never,
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(sampleEvent)
    expect(updateEventMock).toHaveBeenCalledWith("event-1", expect.objectContaining({ name: "Updated" }))
  })

  it("returns 401 when not signed in", async () => {
    requireAdminMock.mockRejectedValue(new Error("Not signed in"))
    const res = await PATCH(
      makeJsonRequest("PATCH", { name: "x" }),
      fakeContext("event-1") as never,
    )
    expect(res.status).toBe(401)
  })

  it("returns 403 when not admin", async () => {
    requireAdminMock.mockRejectedValue(new Error("Admin only"))
    const res = await PATCH(
      makeJsonRequest("PATCH", { name: "x" }),
      fakeContext("event-1") as never,
    )
    expect(res.status).toBe(403)
  })

  it("returns 200 for empty patch (no-op)", async () => {
    // `SportEventPatchSchema` allows optional fields, so `{}` is a
    // valid no-op patch. We assert the service is still called.
    const res = await PATCH(
      makeJsonRequest("PATCH", {}),
      fakeContext("event-1") as never,
    )
    expect(res.status).toBe(200)
    expect(updateEventMock).toHaveBeenCalled()
  })

  it("returns 404 when the event does not exist", async () => {
    updateEventMock.mockRejectedValue(new Error("Sport event not found: x"))
    const res = await PATCH(
      makeJsonRequest("PATCH", { name: "x" }),
      fakeContext("x") as never,
    )
    expect(res.status).toBe(404)
  })
})

describe("DELETE /api/admin/events/[id]", () => {
  it("returns 204", async () => {
    const res = await DELETE(
      new NextRequest("http://localhost/api/admin/events/event-1", {
        method: "DELETE",
      }),
      fakeContext("event-1") as never,
    )
    expect(res.status).toBe(204)
    expect(deleteEventMock).toHaveBeenCalledWith("event-1")
  })

  it("returns 401 when not signed in", async () => {
    requireAdminMock.mockRejectedValue(new Error("Not signed in"))
    const res = await DELETE(
      new NextRequest("http://localhost/api/admin/events/event-1", {
        method: "DELETE",
      }),
      fakeContext("event-1") as never,
    )
    expect(res.status).toBe(401)
  })

  it("returns 404 when the event does not exist", async () => {
    deleteEventMock.mockRejectedValue(new Error("Sport event not found: x"))
    const res = await DELETE(
      new NextRequest("http://localhost/api/admin/events/x", {
        method: "DELETE",
      }),
      fakeContext("x") as never,
    )
    expect(res.status).toBe(404)
  })
})
