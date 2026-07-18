import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, type RenderHookResult } from "@testing-library/react";
import { useSavedSpots, __resetUserStoresForTests } from "./useSavedSpots";
import { SavedSpotsProvider } from "@/lib/saved-spots-context";
import { UserProvider } from "@/lib/user-context";
import { DEV_USER_ID, type User } from "@/lib/user";
import type { SavedSpot } from "@/types/saved-spot";

const fetchMock = vi.fn();
const showToastMock = vi.fn();

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

function okJson(body: unknown = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function noContent(): Response {
  return new Response(null, { status: 204 });
}

beforeEach(() => {
  __resetUserStoresForTests();
  window.localStorage.clear();
  fetchMock.mockReset();
  showToastMock.mockReset();
  // Default: every fetch succeeds (save → 200, unsave → 204)
  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.endsWith("/api/saved-spots")) return okJson({ ok: true });
    return noContent();
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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

    expect(tracker.writes).toEqual([]);
    expect(tracker.reads.filter((k) => k.startsWith("openspot_saved_ids_"))).toEqual([]);

    tracker.getItem.mockRestore();
    tracker.setItem.mockRestore();
    tracker.removeItem.mockRestore();
  });

  it("toggle optimistically adds a spot and POSTs to /api/saved-spots", async () => {
    const { result } = renderWithProviders([]);

    await act(async () => {
      await result.current.toggle("spot-x");
    });

    expect(result.current.isSaved("spot-x")).toBe(true);
    expect(result.current.count).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/saved-spots");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ spotId: "spot-x" });
  });

  it("toggle optimistically removes a spot and DELETEs /api/saved-spots/<id>", async () => {
    const { result } = renderWithProviders(sample);

    await act(async () => {
      await result.current.toggle("spot-a");
    });

    expect(result.current.isSaved("spot-a")).toBe(false);
    expect(result.current.count).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/saved-spots/spot-a");
    expect(init.method).toBe("DELETE");
  });

  it("reverts the optimistic change and shows a toast when the server throws", async () => {
    fetchMock.mockImplementationOnce(
      async () =>
        new Response(JSON.stringify({ error: "Network down" }), { status: 500 }),
    );
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
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondCall = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(secondCall[0]).toBe("/api/saved-spots");
    expect(secondCall[1].method).toBe("POST");
    expect(JSON.parse(secondCall[1].body as string)).toEqual({ spotId: "spot-a" });
  });
});
