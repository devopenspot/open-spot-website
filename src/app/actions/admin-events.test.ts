import { describe, it, expect, vi, beforeEach } from "vitest"
import { DEV_USER_ID, type User } from "@/lib/user"

const requireAdminMock = vi.fn()
const getEventRepositoryAsyncMock = vi.fn()
const revalidateTagMock = vi.fn()
const revalidatePathMock = vi.fn()

vi.mock("@/lib/auth/server", () => ({
  requireAdmin: () => requireAdminMock(),
}))

vi.mock("@/lib/repositories", () => ({
  getEventRepositoryAsync: () => getEventRepositoryAsyncMock(),
}))

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTagMock(...args),
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}))

import {
  createEventAction,
  deleteEventAction,
  updateEventAction,
} from "./admin-events"

const adminUser: User = {
  id: DEV_USER_ID,
  name: "Active Scout",
  email: "devopenspot@gmail.com",
  initials: "OS",
  avatarUrl: null,
  isAdmin: true,
}

const sampleEvent = {
  id: "event-1",
  slug: "world-skate-games-2026",
  name: "World Skate Games 2026",
  shortName: "WSG26",
  url: "https://example.com/wsg",
  image: "https://example.com/img.png",
  description: "Annual championship",
  sports: ["Skateboard", "Inline"] as const,
  startDate: "2026-09-01",
  endDate: "2026-09-10",
  location: {
    city: "Barcelona",
    country: "Spain",
    countryCode: "ES",
    venue: "Olympic Stadium",
    latitude: 41.4,
    longitude: 2.15,
  },
  tier: "championship" as const,
  featured: true,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
}

let createMock: ReturnType<typeof vi.fn>
let updateMock: ReturnType<typeof vi.fn>
let deleteMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.resetAllMocks()
  requireAdminMock.mockResolvedValue(adminUser)
  createMock = vi.fn().mockResolvedValue(sampleEvent)
  updateMock = vi.fn().mockResolvedValue({ ...sampleEvent, name: "UPDATED" })
  deleteMock = vi.fn().mockResolvedValue(undefined)
  getEventRepositoryAsyncMock.mockResolvedValue({
    create: createMock,
    update: updateMock,
    delete: deleteMock,
  })
})

function makeFormData(entries: Array<[string, string]> = []): FormData {
  const fd = new FormData()
  for (const [k, v] of entries) fd.append(k, v)
  return fd
}

describe("createEventAction", () => {
  it("requires admin before doing any work", async () => {
    requireAdminMock.mockRejectedValue(new Error("Admin only"))
    const fd = makeFormData([
      ["name", "X"],
      ["url", "https://example.com"],
      ["image", "https://example.com/img.png"],
      ["city", "Bcn"],
      ["country", "ES"],
      ["tier", "championship"],
      ["startDate", "2026-09-01"],
    ])
    await expect(createEventAction(fd)).rejects.toThrow("Admin only")
    expect(getEventRepositoryAsyncMock).not.toHaveBeenCalled()
  })

  it("creates an event with the parsed input and bumps the cache", async () => {
    const fd = makeFormData([
      ["name", "World Skate Games 2026"],
      ["shortName", "WSG26"],
      ["url", "https://example.com/wsg"],
      ["image", "https://example.com/img.png"],
      ["description", "Annual championship"],
      ["sports", "Skateboard"],
      ["sports", "Inline"],
      ["startDate", "2026-09-01"],
      ["endDate", "2026-09-10"],
      ["city", "Barcelona"],
      ["country", "Spain"],
      ["countryCode", "ES"],
      ["venue", "Olympic Stadium"],
      ["latitude", "41.4"],
      ["longitude", "2.15"],
      ["tier", "championship"],
      ["featured", "on"],
    ])

    const result = await createEventAction(fd)
    expect(result).toEqual(sampleEvent)
    expect(createMock).toHaveBeenCalledOnce()
    const parsed = createMock.mock.calls[0]?.[0]
    expect(parsed).toMatchObject({
      name: "World Skate Games 2026",
      shortName: "WSG26",
      url: "https://example.com/wsg",
      image: "https://example.com/img.png",
      description: "Annual championship",
      sports: ["Skateboard", "Inline"],
      startDate: "2026-09-01",
      endDate: "2026-09-10",
      city: "Barcelona",
      country: "Spain",
      countryCode: "ES",
      venue: "Olympic Stadium",
      latitude: 41.4,
      longitude: 2.15,
      tier: "championship",
      featured: true,
    })
    expect(revalidateTagMock).toHaveBeenCalledWith("sport-events", "max")
    expect(revalidatePathMock).toHaveBeenCalledWith("/sport-events")
  })

  it("omits the sports array when not provided", async () => {
    const fd = makeFormData([
      ["name", "Quick event"],
      ["url", "https://example.com"],
      ["image", "https://example.com/img.png"],
      ["city", "Bcn"],
      ["country", "ES"],
      ["tier", "festival"],
      ["startDate", "2026-09-01"],
    ])
    await createEventAction(fd)
    const parsed = createMock.mock.calls[0]?.[0]
    expect(parsed?.sports).toEqual([])
  })
})

describe("updateEventAction", () => {
  it("requires admin before doing any work", async () => {
    requireAdminMock.mockRejectedValue(new Error("Admin only"))
    await expect(
      updateEventAction("event-1", makeFormData([["name", "New"]])),
    ).rejects.toThrow("Admin only")
    expect(getEventRepositoryAsyncMock).not.toHaveBeenCalled()
  })

  it("updates only the fields present in FormData", async () => {
    const fd = makeFormData([
      ["name", "Renamed"],
      ["tier", "federation"],
    ])
    const result = await updateEventAction("event-1", fd)
    expect(result.name).toBe("UPDATED")
    expect(updateMock).toHaveBeenCalledOnce()
    const [id, patch] = updateMock.mock.calls[0] ?? []
    expect(id).toBe("event-1")
    expect(patch).toMatchObject({
      name: "Renamed",
      tier: "federation",
    })
    expect(revalidateTagMock).toHaveBeenCalledWith("sport-events", "max")
  })

  it("threads the sports array when present", async () => {
    const fd = makeFormData([
      ["name", "Renamed"],
      ["sports", "BMX"],
      ["sports", "Scooter"],
    ])
    await updateEventAction("event-1", fd)
    const [, patch] = updateMock.mock.calls[0] ?? []
    expect(patch).toMatchObject({ sports: ["BMX", "Scooter"] })
  })

  it("clears shortName when an empty string is submitted", async () => {
    const fd = makeFormData([
      ["name", "Renamed"],
      ["shortName", ""],
    ])
    await updateEventAction("event-1", fd)
    const [, patch] = updateMock.mock.calls[0] ?? []
    expect(patch).toMatchObject({ shortName: undefined })
  })
})

describe("deleteEventAction", () => {
  it("requires admin before doing any work", async () => {
    requireAdminMock.mockRejectedValue(new Error("Admin only"))
    await expect(deleteEventAction("event-1")).rejects.toThrow("Admin only")
    expect(getEventRepositoryAsyncMock).not.toHaveBeenCalled()
  })

  it("deletes the event and bumps the cache", async () => {
    await deleteEventAction("event-1")
    expect(deleteMock).toHaveBeenCalledWith("event-1")
    expect(revalidateTagMock).toHaveBeenCalledWith("sport-events", "max")
    expect(revalidatePathMock).toHaveBeenCalledWith("/sport-events")
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/events")
  })
})
