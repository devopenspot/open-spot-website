import { describe, it, expect, vi, beforeEach } from "vitest"
import { revalidatePath } from "next/cache"
import { DEV_USER_ID, type User } from "@/lib/user"

const requireAdminMock = vi.fn()
const getSpotRepositoryAsyncMock = vi.fn()
const uploadSpotImageMock = vi.fn()
const revalidatePathMock = vi.fn()

vi.mock("@/lib/auth/server", () => ({
  requireAdmin: () => requireAdminMock(),
}))

vi.mock("@/lib/repositories", () => ({
  getSpotRepositoryAsync: () => getSpotRepositoryAsyncMock(),
}))

vi.mock("@/lib/supabase/storage", () => ({
  uploadSpotImage: (...args: unknown[]) => uploadSpotImageMock(...args),
}))

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}))

void revalidatePath

import {
  createSpotFromLookupAction,
  deleteSpotAction,
  updateSpotAction,
} from "./admin-spots"

const adminUser: User = {
  id: DEV_USER_ID,
  name: "Active Scout",
  email: "devopenspot@gmail.com",
  initials: "OS",
  avatarUrl: null,
  isAdmin: true,
}

const createdSpot = {
  id: "spot-1",
  slug: "lyon-test-1",
  name: "TEST SPOT",
  city: "Lyon",
  citySlug: "lyon",
  address: "10 Rue de la République",
  type: "Plaza" as const,
  features: ["Smooth Concrete"],
  sports: ["Skateboard"] as const,
  image: "https://example.com/img.png",
  communityNote: "",
  crowdLevel: 35,
  crowdLevelLabel: "Low Crowd (Ideal)",
  country: "France",
  location: { lat: 45.7686, lon: 4.8369 },
  createdBy: adminUser.id,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
}

let createMock: ReturnType<typeof vi.fn>
let updateMock: ReturnType<typeof vi.fn>
let deleteMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.resetAllMocks()
  requireAdminMock.mockResolvedValue(adminUser)
  createMock = vi.fn().mockResolvedValue(createdSpot)
  updateMock = vi.fn().mockResolvedValue({ ...createdSpot, name: "UPDATED" })
  deleteMock = vi.fn().mockResolvedValue(undefined)
  getSpotRepositoryAsyncMock.mockResolvedValue({
    create: createMock,
    update: updateMock,
    delete: deleteMock,
  })
  uploadSpotImageMock.mockResolvedValue({
    path: "spots/abc/photo.jpg",
    url: "https://example.com/photo.jpg",
  })
})

function makeFormData(entries: Array<[string, string]> = []): FormData {
  const fd = new FormData()
  for (const [k, v] of entries) fd.append(k, v)
  return fd
}

describe("createSpotFromLookupAction", () => {
  it("requires admin before doing any work", async () => {
    requireAdminMock.mockRejectedValue(new Error("Admin only"))
    const fd = makeFormData([
      ["name", "Test"],
      ["city", "Lyon"],
      ["address", "10 Rue"],
      ["type", "Plaza"],
      ["imageUrl", "https://example.com/img.png"],
      ["lat", "45.7"],
      ["lon", "4.8"],
    ])
    await expect(createSpotFromLookupAction(fd)).rejects.toThrow("Admin only")
    expect(getSpotRepositoryAsyncMock).not.toHaveBeenCalled()
  })

  it("creates a spot with the parsed input and revalidates affected paths", async () => {
    const fd = makeFormData([
      ["name", "Test Spot"],
      ["city", "Lyon"],
      ["address", "10 Rue de la République"],
      ["type", "Plaza"],
      ["imageUrl", "https://example.com/img.png"],
      ["features", "Smooth Concrete,Red Curb"],
      ["sports", "Skateboard"],
      ["sports", "BMX"],
      ["crowdLevel", "35"],
      ["country", "France"],
      ["countryCode", "fr"],
      ["lat", "45.7686"],
      ["lon", "4.8369"],
    ])

    const result = await createSpotFromLookupAction(fd)
    expect(result).toEqual(createdSpot)
    expect(createMock).toHaveBeenCalledOnce()
    const parsed = createMock.mock.calls[0]?.[0]
    expect(parsed).toMatchObject({
      name: "Test Spot",
      city: "Lyon",
      address: "10 Rue de la République",
      type: "Plaza",
      image: "https://example.com/img.png",
      features: ["Smooth Concrete", "Red Curb"],
      sports: ["Skateboard", "BMX"],
      crowdLevel: 35,
      country: "France",
      countryCode: "FR",
      location: { lat: 45.7686, lon: 4.8369 },
      createdBy: adminUser.id,
    })
    expect(parsed?.citySlug).toBe("lyon")
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/spots")
  })

  it("normalizes a lowercase countryCode from the form to uppercase ISO", async () => {
    const fd = makeFormData([
      ["name", "Tokyo Spot"],
      ["city", "Tokyo"],
      ["address", "Aomi"],
      ["type", "Park"],
      ["imageUrl", "https://example.com/img.png"],
      ["country", "Japon"],
      ["countryCode", "jp"],
      ["lat", "35.64"],
      ["lon", "139.77"],
    ])

    await createSpotFromLookupAction(fd)
    const parsed = createMock.mock.calls[0]?.[0]
    expect(parsed?.country).toBe("Japon")
    expect(parsed?.countryCode).toBe("JP")
  })

  it("omits the file upload path when no file is present", async () => {
    const fd = makeFormData([
      ["name", "Test"],
      ["city", "Lyon"],
      ["address", "10 Rue"],
      ["type", "Plaza"],
      ["imageUrl", "https://example.com/img.png"],
      ["lat", "45.7"],
      ["lon", "4.8"],
    ])
    await createSpotFromLookupAction(fd)
    expect(uploadSpotImageMock).not.toHaveBeenCalled()
    const parsed = createMock.mock.calls[0]?.[0]
    expect(parsed?.imagePath).toBeNull()
  })
})

describe("updateSpotAction", () => {
  it("requires admin before doing any work", async () => {
    requireAdminMock.mockRejectedValue(new Error("Admin only"))
    await expect(
      updateSpotAction("spot-1", makeFormData([["name", "New"]])),
    ).rejects.toThrow("Admin only")
    expect(getSpotRepositoryAsyncMock).not.toHaveBeenCalled()
  })

  it("updates only the fields present in FormData", async () => {
    const fd = makeFormData([
      ["name", "Updated Name"],
      ["crowdLevel", "85"],
    ])
    const result = await updateSpotAction("spot-1", fd)
    expect(result.name).toBe("UPDATED")
    expect(updateMock).toHaveBeenCalledOnce()
    const [id, patch] = updateMock.mock.calls[0] ?? []
    expect(id).toBe("spot-1")
    expect(patch).toMatchObject({
      name: "Updated Name",
      crowdLevel: 85,
      crowdLevelLabel: "High (Busy)",
    })
    expect(revalidatePathMock).toHaveBeenCalledWith("/spots/spot-1")
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/spots")
  })

  it("threads the sports array when present", async () => {
    const fd = makeFormData([
      ["name", "Updated Name"],
      ["sports", "Inline"],
      ["sports", "Scooter"],
    ])
    await updateSpotAction("spot-1", fd)
    const [, patch] = updateMock.mock.calls[0] ?? []
    expect(patch).toMatchObject({ sports: ["Inline", "Scooter"] })
  })

  it("threads a countryCode in the patch when present", async () => {
    const fd = makeFormData([
      ["name", "Updated Name"],
      ["country", "Japon"],
      ["countryCode", "jp"],
    ])
    await updateSpotAction("spot-1", fd)
    const [, patch] = updateMock.mock.calls[0] ?? []
    expect(patch).toMatchObject({ country: "Japon", countryCode: "JP" })
  })
})

describe("deleteSpotAction", () => {
  it("requires admin before doing any work", async () => {
    requireAdminMock.mockRejectedValue(new Error("Admin only"))
    await expect(deleteSpotAction("spot-1")).rejects.toThrow("Admin only")
    expect(getSpotRepositoryAsyncMock).not.toHaveBeenCalled()
  })

  it("deletes the spot and revalidates the affected paths", async () => {
    await deleteSpotAction("spot-1")
    expect(deleteMock).toHaveBeenCalledWith("spot-1")
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/spots")
    expect(revalidatePathMock).toHaveBeenCalledWith("/")
  })
})
