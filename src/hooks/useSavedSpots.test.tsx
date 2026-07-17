import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, type RenderHookResult } from "@testing-library/react";
import { useSavedSpots, __resetUserStoresForTests } from "./useSavedSpots";
import { SavedSpotsProvider } from "@/lib/saved-spots-context";
import { UserProvider } from "@/lib/user-context";
import { DEV_USER_ID, type User } from "@/lib/user";
import type { SavedSpot } from "@/types/saved-spot";

const toggleSavedActionMock = vi.fn();
const showToastMock = vi.fn();

vi.mock("@/app/actions/saved-spots", () => ({
  toggleSavedAction: (...args: unknown[]) => toggleSavedActionMock(...args),
}));

vi.mock("./useToast", () => ({
  showToast: (...args: unknown[]) => showToastMock(...args),
}));

const devUser: User = {
  id: DEV_USER_ID,
  name: "Active Scout",
  email: "devopenspot@gmail.com",
  initials: "OS",
  avatarUrl: null,
  isAdmin: true,
};

const sample: SavedSpot[] = [
  { userId: DEV_USER_ID, spotId: "spot-a", createdAt: "2024-01-01T00:00:00.000Z" },
  { userId: DEV_USER_ID, spotId: "spot-b", createdAt: "2024-01-02T00:00:00.000Z" },
];

function renderWithProviders(
  initial: readonly SavedSpot[] = [],
  userId: string = DEV_USER_ID,
  user: User = { ...devUser, id: userId },
): RenderHookResult<ReturnType<typeof useSavedSpots>, unknown> {
  return renderHook(
    () => useSavedSpots(userId, initial),
    {
      wrapper: ({ children }) => (
        <UserProvider user={user}>
          <SavedSpotsProvider initial={initial}>{children}</SavedSpotsProvider>
        </UserProvider>
      ),
    },
  );
}

function trackLocalStorage() {
  const reads: string[] = [];
  const writes: { key: string; value: string | null }[] = [];
  const removals: string[] = [];
  const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation((key: string) => {
    reads.push(key);
    return null;
  });
  const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(
    (key: string, value: string) => {
      writes.push({ key, value });
    },
  );
  const removeItem = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(
    (key: string) => {
      removals.push(key);
    },
  );
  return { reads, writes, removals, getItem, setItem, removeItem };
}

beforeEach(() => {
  __resetUserStoresForTests();
  window.localStorage.clear();
  toggleSavedActionMock.mockReset();
  showToastMock.mockReset();
  toggleSavedActionMock.mockResolvedValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useSavedSpots — server-only persistence", () => {
  it("seeds the in-memory set from the SavedSpotsProvider initial", () => {
    const { result } = renderWithProviders(sample);
    expect(Array.from(result.current.savedIds)).toEqual(["spot-a", "spot-b"]);
    expect(result.current.count).toBe(2);
    expect(result.current.isSaved("spot-a")).toBe(true);
    expect(result.current.isSaved("spot-c")).toBe(false);
  });

  it("returns an empty set when no initial spots are provided", () => {
    const { result } = renderWithProviders([]);
    expect(result.current.savedIds.size).toBe(0);
    expect(result.current.count).toBe(0);
  });

  it("does not read or write localStorage at any point", async () => {
    const tracker = trackLocalStorage();
    const { result } = renderWithProviders(sample);

    await act(async () => {
      await result.current.toggle("spot-c");
    });

    // The hook may legitimately *delete* legacy keys on first mount, but it
    // must never read from or write to localStorage for current state.
    expect(tracker.writes).toEqual([]);
    expect(tracker.reads.filter((k) => k.startsWith("openspot_saved_ids_"))).toEqual([]);

    tracker.getItem.mockRestore();
    tracker.setItem.mockRestore();
    tracker.removeItem.mockRestore();
  });

  it("toggle optimistically adds a spot and calls toggleSavedAction once", async () => {
    const { result } = renderWithProviders([]);

    await act(async () => {
      await result.current.toggle("spot-x");
    });

    expect(result.current.isSaved("spot-x")).toBe(true);
    expect(result.current.count).toBe(1);
    expect(toggleSavedActionMock).toHaveBeenCalledTimes(1);
    expect(toggleSavedActionMock).toHaveBeenCalledWith("spot-x");
  });

  it("toggle optimistically removes a spot and calls toggleSavedAction once", async () => {
    const { result } = renderWithProviders(sample);

    await act(async () => {
      await result.current.toggle("spot-a");
    });

    expect(result.current.isSaved("spot-a")).toBe(false);
    expect(result.current.count).toBe(1);
    expect(toggleSavedActionMock).toHaveBeenCalledTimes(1);
    expect(toggleSavedActionMock).toHaveBeenCalledWith("spot-a");
  });

  it("reverts the optimistic change and shows a toast when the server throws", async () => {
    toggleSavedActionMock.mockRejectedValueOnce(new Error("Network down"));
    const { result } = renderWithProviders(sample);

    await act(async () => {
      await result.current.toggle("spot-c");
    });

    expect(result.current.isSaved("spot-c")).toBe(false);
    expect(result.current.isSaved("spot-a")).toBe(true);
    expect(result.current.isSaved("spot-b")).toBe(true);
    expect(showToastMock).toHaveBeenCalledWith(
      "Could not sync saved spot: Network down",
      "error",
    );
  });

  it("removes legacy localStorage keys on first mount", async () => {
    window.localStorage.setItem("openspot_saved_ids_v1", '["legacy-spot"]');
    window.localStorage.setItem(
      "openspot_saved_ids_v2:dev",
      '["legacy-spot-2"]',
    );
    window.localStorage.setItem("openspot_saved_ids_v2:other-user", '["x"]');
    window.localStorage.setItem("unrelated_key", "leave-me");

    const { result } = renderWithProviders([]);

    expect(result.current.count).toBe(0);
    expect(window.localStorage.getItem("openspot_saved_ids_v1")).toBeNull();
    expect(window.localStorage.getItem("openspot_saved_ids_v2:dev")).toBeNull();
    expect(
      window.localStorage.getItem("openspot_saved_ids_v2:other-user"),
    ).toBeNull();
    expect(window.localStorage.getItem("unrelated_key")).toBe("leave-me");
  });

  it("isolates state per userId", () => {
    const { result: a } = renderWithProviders(sample, "user-a", {
      ...devUser,
      id: "user-a",
    });
    const { result: b } = renderWithProviders([], "user-b", {
      ...devUser,
      id: "user-b",
    });

    expect(a.current.count).toBe(2);
    expect(b.current.count).toBe(0);
  });
});

describe("useSavedSpots — save/unsave toasts", () => {
  it("shows a success toast with the spot name after a save", async () => {
    const { result } = renderWithProviders([]);

    await act(async () => {
      await result.current.toggle("spot-x", { name: "Downtown Plaza" });
    });

    expect(showToastMock).toHaveBeenCalledWith(
      "Saved Downtown Plaza",
      "success",
      expect.objectContaining({ title: "Favorites" }),
    );
  });

  it("falls back to a generic success message when no name is provided", async () => {
    const { result } = renderWithProviders([]);

    await act(async () => {
      await result.current.toggle("spot-x");
    });

    expect(showToastMock).toHaveBeenCalledWith(
      "Saved to favorites",
      "success",
      expect.objectContaining({ title: "Favorites" }),
    );
  });

  it("shows an info toast with an Undo action after a remove", async () => {
    const { result } = renderWithProviders(sample);

    await act(async () => {
      await result.current.toggle("spot-a", { name: "Hubba Hideout" });
    });

    const call = showToastMock.mock.calls.find(
      (c) => c[0] === "Removed Hubba Hideout",
    );
    expect(call).toBeDefined();
    const [, tone, options] = call as [
      string,
      string,
      { title?: string; durationMs?: number; action?: { label: string; onClick: () => void } },
    ];
    expect(tone).toBe("info");
    expect(options.title).toBe("Favorites");
    expect(options.durationMs).toBe(5000);
    expect(options.action?.label).toBe("Undo");
  });

  it("Undo restores the spot via the toggle pipeline", async () => {
    const { result } = renderWithProviders(sample);

    await act(async () => {
      await result.current.toggle("spot-a", { name: "Hubba Hideout" });
    });
    expect(result.current.isSaved("spot-a")).toBe(false);

    const removeCall = showToastMock.mock.calls.find(
      (c) => c[0] === "Removed Hubba Hideout",
    );
    const undo = (
      removeCall?.[2] as {
        action?: { label: string; onClick: () => void };
      }
    )?.action?.onClick;
    expect(undo).toBeDefined();

    await act(async () => {
      undo?.();
    });

    expect(result.current.isSaved("spot-a")).toBe(true);
    expect(toggleSavedActionMock).toHaveBeenCalledTimes(2);
    expect(toggleSavedActionMock).toHaveBeenNthCalledWith(2, "spot-a");
  });
});
