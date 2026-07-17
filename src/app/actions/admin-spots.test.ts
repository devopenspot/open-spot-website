import { describe, it, expect, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import { DEV_USER_ID, type User } from "@/lib/user";

const requireAdminMock = vi.fn();
const getSpotRepositoryAsyncMock = vi.fn();
const uploadSpotImageMock = vi.fn();
const revalidatePathMock = vi.fn();

vi.mock("@/lib/auth/server", () => ({
  requireAdmin: () => requireAdminMock(),
}));

vi.mock("@/lib/repositories", () => ({
  getSpotRepositoryAsync: () => getSpotRepositoryAsyncMock(),
}));

vi.mock("@/lib/supabase/storage", () => ({
  uploadSpotImage: (...args: unknown[]) => uploadSpotImageMock(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

void revalidatePath;

import {
  createSpotFromLookupAction,
  deleteSpotAction,
  updateSpotAction,
} from "./admin-spots";

const adminUser: User = {
  id: DEV_USER_ID,
  name: "Active Scout",
  email: "devopenspot@gmail.com",
  initials: "OS",
  avatarUrl: null,
  isAdmin: true,
};

const createdSpot = {
  id: "spot-1",
  slug: "lyon-test-1",
  name: "TEST SPOT",
  city: "Lyon",
  citySlug: "lyon",
  address: "10 Rue de la République",
  types: [{ slug: "plaza", name: "Plaza" }],
  sports: ["Skateboard"] as const,
  image: "https://example.com/img.png",
  crowdLevel: 35,
  country: "France",
  countryCode: "FR",
  location: { lat: 45.7686, lon: 4.8369 },
  createdBy: adminUser.id,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

let createMock: ReturnType<typeof vi.fn>;
let updateMock: ReturnType<typeof vi.fn>;
let deleteMock: ReturnType<typeof vi.fn>;
let listAllSpotTypesMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetAllMocks();
  requireAdminMock.mockResolvedValue(adminUser);
  createMock = vi.fn().mockResolvedValue(createdSpot);
  updateMock = vi.fn().mockResolvedValue({ ...createdSpot, name: "UPDATED" });
  deleteMock = vi.fn().mockResolvedValue(undefined);
  listAllSpotTypesMock = vi.fn().mockResolvedValue([
    { slug: "plaza", name: "Plaza", sortOrder: 0 },
    { slug: "diy", name: "DIY", sortOrder: 1 },
    { slug: "stair", name: "Stair", sortOrder: 2 },
    { slug: "bowl", name: "Bowl", sortOrder: 3 },
    { slug: "skatepark", name: "Skatepark", sortOrder: 4 },
    { slug: "ledges", name: "Ledges", sortOrder: 5 },
    { slug: "pools", name: "Pools", sortOrder: 6 },
  ]);
  getSpotRepositoryAsyncMock.mockResolvedValue({
    create: createMock,
    update: updateMock,
    delete: deleteMock,
    listAllSpotTypes: listAllSpotTypesMock,
  });
  uploadSpotImageMock.mockResolvedValue({
    path: "spots/abc/photo.jpg",
    url: "https://example.com/photo.jpg",
  });
});

function makeFormData(entries: Array<[string, string]> = []): FormData {
  const fd = new FormData();
  for (const [k, v] of entries) fd.append(k, v);
  return fd;
}

describe("createSpotFromLookupAction", () => {
  it("requires admin before doing any work", async () => {
    requireAdminMock.mockRejectedValue(new Error("Admin only"));
    const fd = makeFormData([
      ["name", "Test"],
      ["city", "Lyon"],
      ["address", "10 Rue"],
      ["type", "plaza"],
      ["imageUrl", "https://example.com/img.png"],
      ["lat", "45.7"],
      ["lon", "4.8"],
    ]);
    await expect(createSpotFromLookupAction(fd)).rejects.toThrow("Admin only");
    expect(getSpotRepositoryAsyncMock).not.toHaveBeenCalled();
  });

  it("creates a spot with the parsed input and revalidates affected paths", async () => {
    const fd = makeFormData([
      ["name", "Test Spot"],
      ["city", "Lyon"],
      ["address", "10 Rue de la République"],
      ["type", "plaza"],
      ["imageUrl", "https://example.com/img.png"],
      ["sports", "Skateboard"],
      ["sports", "BMX"],
      ["crowdLevel", "35"],
      ["country", "France"],
      ["countryCode", "fr"],
      ["lat", "45.7686"],
      ["lon", "4.8369"],
    ]);

    const result = await createSpotFromLookupAction(fd);
    expect(result).toEqual(createdSpot);
    expect(createMock).toHaveBeenCalledOnce();
    const parsed = createMock.mock.calls[0]?.[0];
    expect(parsed).toMatchObject({
      name: "Test Spot",
      city: "Lyon",
      address: "10 Rue de la République",
      types: ["plaza"],
      image: "https://example.com/img.png",
      sports: ["Skateboard", "BMX"],
      crowdLevel: 35,
      country: "France",
      countryCode: "FR",
      location: { lat: 45.7686, lon: 4.8369 },
      createdBy: adminUser.id,
    });
    expect(parsed?.citySlug).toBe("lyon");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/spots");
  });

  it("rejects an unknown spot type before writing", async () => {
    const fd = makeFormData([
      ["name", "Test Spot"],
      ["city", "Lyon"],
      ["address", "10 Rue"],
      ["type", "not-a-real-type"],
      ["imageUrl", "https://example.com/img.png"],
      ["lat", "45.7"],
      ["lon", "4.8"],
    ]);
    await expect(createSpotFromLookupAction(fd)).rejects.toThrow(
      "Unknown spot type",
    );
    expect(createMock).not.toHaveBeenCalled();
  });

  it("normalizes a lowercase countryCode from the form to uppercase ISO", async () => {
    const fd = makeFormData([
      ["name", "Tokyo Spot"],
      ["city", "Tokyo"],
      ["address", "Aomi"],
      ["type", "skatepark"],
      ["imageUrl", "https://example.com/img.png"],
      ["country", "Japon"],
      ["countryCode", "jp"],
      ["lat", "35.64"],
      ["lon", "139.77"],
    ]);

    await createSpotFromLookupAction(fd);
    const parsed = createMock.mock.calls[0]?.[0];
    expect(parsed?.country).toBe("Japon");
    expect(parsed?.countryCode).toBe("JP");
  });

  it("omits the file upload path when no file is present", async () => {
    const fd = makeFormData([
      ["name", "Test"],
      ["city", "Lyon"],
      ["address", "10 Rue"],
      ["type", "plaza"],
      ["imageUrl", "https://example.com/img.png"],
      ["lat", "45.7"],
      ["lon", "4.8"],
    ]);
    await createSpotFromLookupAction(fd);
    expect(uploadSpotImageMock).not.toHaveBeenCalled();
    const parsed = createMock.mock.calls[0]?.[0];
    expect(parsed?.imagePath).toBeNull();
  });

  it("accepts multiple types in the form and threads them as an array", async () => {
    const fd = makeFormData([
      ["name", "Multi Type Spot"],
      ["city", "Lyon"],
      ["address", "10 Rue"],
      ["type", "plaza"],
      ["type", "bowl"],
      ["imageUrl", "https://example.com/img.png"],
      ["lat", "45.7"],
      ["lon", "4.8"],
    ]);
    await createSpotFromLookupAction(fd);
    const parsed = createMock.mock.calls[0]?.[0];
    expect(parsed?.types).toEqual(["plaza", "bowl"]);
  });
});

describe("updateSpotAction", () => {
  it("requires admin before doing any work", async () => {
    requireAdminMock.mockRejectedValue(new Error("Admin only"));
    await expect(
      updateSpotAction("spot-1", makeFormData([["name", "New"]])),
    ).rejects.toThrow("Admin only");
    expect(getSpotRepositoryAsyncMock).not.toHaveBeenCalled();
  });

  it("updates only the fields present in FormData", async () => {
    const fd = makeFormData([
      ["name", "Updated Name"],
      ["crowdLevel", "85"],
    ]);
    const result = await updateSpotAction("spot-1", fd);
    expect(result.name).toBe("UPDATED");
    expect(updateMock).toHaveBeenCalledOnce();
    const [id, patch] = updateMock.mock.calls[0] ?? [];
    expect(id).toBe("spot-1");
    expect(patch).toMatchObject({
      name: "Updated Name",
      crowdLevel: 85,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/spots/spot-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/spots");
  });

  it("threads the sports array when present", async () => {
    const fd = makeFormData([
      ["name", "Updated Name"],
      ["sports", "Rollerblade"],
      ["sports", "Scooter"],
    ]);
    await updateSpotAction("spot-1", fd);
    const [, patch] = updateMock.mock.calls[0] ?? [];
    expect(patch).toMatchObject({ sports: ["Rollerblade", "Scooter"] });
  });

  it("threads a countryCode in the patch when present", async () => {
    const fd = makeFormData([
      ["name", "Updated Name"],
      ["country", "Japon"],
      ["countryCode", "jp"],
    ]);
    await updateSpotAction("spot-1", fd);
    const [, patch] = updateMock.mock.calls[0] ?? [];
    expect(patch).toMatchObject({ country: "Japon", countryCode: "JP" });
  });

  it("threads a multi-type array in the patch when present", async () => {
    const fd = makeFormData([
      ["name", "Updated Name"],
      ["type", "plaza"],
      ["type", "bowl"],
    ]);
    await updateSpotAction("spot-1", fd);
    const [, patch] = updateMock.mock.calls[0] ?? [];
    expect(patch).toMatchObject({ types: ["plaza", "bowl"] });
  });

  it("rejects an unknown type in the patch before writing", async () => {
    const fd = makeFormData([
      ["name", "Updated Name"],
      ["type", "not-a-real-type"],
    ]);
    await expect(updateSpotAction("spot-1", fd)).rejects.toThrow(
      "Unknown spot type",
    );
    expect(updateMock).not.toHaveBeenCalled();
  });
});

describe("deleteSpotAction", () => {
  it("requires admin before doing any work", async () => {
    requireAdminMock.mockRejectedValue(new Error("Admin only"));
    await expect(deleteSpotAction("spot-1")).rejects.toThrow("Admin only");
    expect(getSpotRepositoryAsyncMock).not.toHaveBeenCalled();
  });

  it("deletes the spot and revalidates the affected paths", async () => {
    await deleteSpotAction("spot-1");
    expect(deleteMock).toHaveBeenCalledWith("spot-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/spots");
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
  });
});
