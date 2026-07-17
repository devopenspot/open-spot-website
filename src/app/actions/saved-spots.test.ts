import { describe, it, expect, vi, beforeEach } from "vitest";
import { DEV_USER_ID, type User } from "@/lib/user";

const requireUserMock = vi.fn();
const getSavedSpotsRepositoryAsyncMock = vi.fn();
const getSpotRepositoryAsyncMock = vi.fn();
const revalidatePathMock = vi.fn();

vi.mock("@/lib/auth/server", () => ({
  requireUser: () => requireUserMock(),
}));

vi.mock("@/lib/repositories", () => ({
  getSavedSpotsRepositoryAsync: () => getSavedSpotsRepositoryAsyncMock(),
  getSpotRepositoryAsync: () => getSpotRepositoryAsyncMock(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

import { toggleSavedAction, listSavedSpotsAction } from "./saved-spots";

const user: User = {
  id: DEV_USER_ID,
  name: "Active Scout",
  email: "devopenspot@gmail.com",
  initials: "OS",
  avatarUrl: null,
  isAdmin: true,
};

let savedRepo: {
  isSaved: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  unsave: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
};
let spotRepo: { findById: ReturnType<typeof vi.fn> };

beforeEach(() => {
  vi.resetAllMocks();
  requireUserMock.mockResolvedValue(user);
  savedRepo = {
    isSaved: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined),
    unsave: vi.fn().mockResolvedValue(undefined),
    list: vi.fn(),
  };
  spotRepo = { findById: vi.fn().mockResolvedValue({ id: "spot-1" }) };
  getSavedSpotsRepositoryAsyncMock.mockResolvedValue(savedRepo);
  getSpotRepositoryAsyncMock.mockResolvedValue(spotRepo);
  revalidatePathMock.mockReset();
});

describe("toggleSavedAction", () => {
  it("saves a spot that is not yet saved and revalidates /saved", async () => {
    savedRepo.isSaved.mockResolvedValue(false);
    const result = await toggleSavedAction("spot-1");
    expect(savedRepo.isSaved).toHaveBeenCalledWith(user.id, "spot-1");
    expect(savedRepo.save).toHaveBeenCalledWith(user.id, "spot-1");
    expect(savedRepo.unsave).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/saved");
    expect(result).toBe(true);
  });

  it("unsaves a spot that is already saved and revalidates /saved", async () => {
    savedRepo.isSaved.mockResolvedValue(true);
    const result = await toggleSavedAction("spot-1");
    expect(savedRepo.unsave).toHaveBeenCalledWith(user.id, "spot-1");
    expect(savedRepo.save).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/saved");
    expect(result).toBe(false);
  });

  it("throws when the spot does not exist", async () => {
    spotRepo.findById.mockResolvedValue(null);
    await expect(toggleSavedAction("missing")).rejects.toThrow(
      "Spot not found: missing",
    );
    expect(savedRepo.isSaved).not.toHaveBeenCalled();
    expect(savedRepo.save).not.toHaveBeenCalled();
    expect(savedRepo.unsave).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("propagates the 'Not signed in' error from requireUser", async () => {
    requireUserMock.mockRejectedValue(new Error("Not signed in"));
    await expect(toggleSavedAction("spot-1")).rejects.toThrow("Not signed in");
    expect(spotRepo.findById).not.toHaveBeenCalled();
    expect(savedRepo.isSaved).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});

describe("listSavedSpotsAction", () => {
  it("returns the repository list for the current user", async () => {
    const expected = { items: [], nextCursor: null };
    savedRepo.list.mockResolvedValue(expected);
    const result = await listSavedSpotsAction();
    expect(savedRepo.list).toHaveBeenCalledWith(user.id, { limit: 200 });
    expect(result).toBe(expected);
  });

  it("propagates the 'Not signed in' error from requireUser", async () => {
    requireUserMock.mockRejectedValue(new Error("Not signed in"));
    await expect(listSavedSpotsAction()).rejects.toThrow("Not signed in");
    expect(savedRepo.list).not.toHaveBeenCalled();
  });
});
