import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const requireAdminMock = vi.fn()
const updateSpotMock = vi.fn()
const deleteSpotMock = vi.fn()

vi.mock("@/lib/auth/server", () => ({
  requireAdmin: () => requireAdminMock(),
}))

vi.mock("@/lib/services/spots", () => ({
  updateSpot: (...args: unknown[]) => updateSpotMock(...args),
  deleteSpot: (...args: unknown[]) => deleteSpotMock(...args),
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

const sampleSpot = {
  id: "spot-1",
  slug: "test",
  name: "Test",
  city: "Test",
  citySlug: "test",
  address: "x",
  types: [],
  sports: [],
  image: "x",
  crowdLevel: 0,
  country: "",
  countryCode: "",
  location: { lat: 0, lon: 0 },
  createdBy: null,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
}

function makeJsonRequest(method: string, body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/admin/spots/spot-1", {
    method,
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  requireAdminMock.mockResolvedValue({ id: "user-1" })
  updateSpotMock.mockResolvedValue(sampleSpot)
  deleteSpotMock.mockResolvedValue(undefined)
})

describe("PATCH /api/admin/spots/[id]", () => {
  it("returns 200 with the updated spot", async () => {
    const res = await PATCH(
      makeJsonRequest("PATCH", { name: "Updated" }),
      fakeContext("spot-1") as never,
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(sampleSpot)
    expect(updateSpotMock).toHaveBeenCalledWith("spot-1", expect.objectContaining({ name: "Updated" }))
  })

  it("returns 200 for the full admin-edit-form payload", async () => {
    // Mirrors the JSON shape `AdminEditSpotForm.handleAction` builds
    // from FormData: `image` (not `imageUrl`), `location: { lat, lon }`
    // (not flat `lat`/`lon`). Without those keys, the strict
    // `SpotPatchSchema` rejects with 400. This pins the form/schema
    // contract so a future drift is caught here, not in the browser.
    const fullPatch = {
      name: "Hubba Hideout",
      city: "San Francisco",
      citySlug: "san-francisco",
      address: "1 Embarcadero",
      country: "United States",
      countryCode: "US",
      types: ["plaza", "bowl"],
      sports: ["Skateboard"],
      crowdLevel: 42,
      image: "https://example.com/img.jpg",
      location: { lat: 37.7749, lon: -122.4194 },
    }
    const res = await PATCH(
      makeJsonRequest("PATCH", fullPatch),
      fakeContext("spot-1") as never,
    )
    expect(res.status).toBe(200)
    expect(updateSpotMock).toHaveBeenCalledWith("spot-1", fullPatch)
  })

  it("returns 400 when the payload has the wrong key shape", async () => {
    // Regression: the edit form used to send `imageUrl` and flat
    // `lat`/`lon` instead of `image` and `location: { lat, lon }`.
    // The strict schema rejects unrecognized keys with 400.
    const badPatch = {
      name: "Hubba Hideout",
      imageUrl: "https://example.com/img.jpg",
      lat: 37.7749,
      lon: -122.4194,
    }
    const res = await PATCH(
      makeJsonRequest("PATCH", badPatch),
      fakeContext("spot-1") as never,
    )
    expect(res.status).toBe(400)
    expect(updateSpotMock).not.toHaveBeenCalled()
  })

  it("returns 401 when not signed in", async () => {
    requireAdminMock.mockRejectedValue(new Error("Not signed in"))
    const res = await PATCH(
      makeJsonRequest("PATCH", { name: "x" }),
      fakeContext("spot-1") as never,
    )
    expect(res.status).toBe(401)
  })

  it("returns 403 when not admin", async () => {
    requireAdminMock.mockRejectedValue(new Error("Admin only"))
    const res = await PATCH(
      makeJsonRequest("PATCH", { name: "x" }),
      fakeContext("spot-1") as never,
    )
    expect(res.status).toBe(403)
  })

  it("returns 400 for invalid JSON", async () => {
    const res = await PATCH(
      new NextRequest("http://localhost/api/admin/spots/spot-1", {
        method: "PATCH",
        body: "{not json",
      }),
      fakeContext("spot-1") as never,
    )
    expect(res.status).toBe(400)
  })

  it("returns 200 for empty patch (no-op)", async () => {
    // `SpotPatchSchema` is strict with all fields optional, so `{}`
    // is a valid (no-op) patch. We assert the service is still
    // called and the response is the unchanged spot.
    const res = await PATCH(
      makeJsonRequest("PATCH", {}),
      fakeContext("spot-1") as never,
    )
    expect(res.status).toBe(200)
    expect(updateSpotMock).toHaveBeenCalled()
  })

  it("returns 404 when the spot does not exist", async () => {
    updateSpotMock.mockRejectedValue(new Error("Spot not found: x"))
    const res = await PATCH(
      makeJsonRequest("PATCH", { name: "x" }),
      fakeContext("x") as never,
    )
    expect(res.status).toBe(404)
  })
})

describe("DELETE /api/admin/spots/[id]", () => {
  it("returns 204", async () => {
    const res = await DELETE(
      new NextRequest("http://localhost/api/admin/spots/spot-1", {
        method: "DELETE",
      }),
      fakeContext("spot-1") as never,
    )
    expect(res.status).toBe(204)
    expect(deleteSpotMock).toHaveBeenCalledWith("spot-1")
  })

  it("returns 401 when not signed in", async () => {
    requireAdminMock.mockRejectedValue(new Error("Not signed in"))
    const res = await DELETE(
      new NextRequest("http://localhost/api/admin/spots/spot-1", {
        method: "DELETE",
      }),
      fakeContext("spot-1") as never,
    )
    expect(res.status).toBe(401)
  })

  it("returns 404 when the spot does not exist", async () => {
    deleteSpotMock.mockRejectedValue(new Error("Spot not found: x"))
    const res = await DELETE(
      new NextRequest("http://localhost/api/admin/spots/x", {
        method: "DELETE",
      }),
      fakeContext("x") as never,
    )
    expect(res.status).toBe(404)
  })
})
