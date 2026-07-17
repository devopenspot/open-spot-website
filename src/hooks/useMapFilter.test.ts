import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, type RenderHookResult } from "@testing-library/react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useMapFilter, type UseMapFilterOptions } from "./useMapFilter";
import { useSpotsStore } from "@/stores/spots-store";
import type { Spot, Region } from "@/lib/types";

const routerReplace = vi.fn();
const routerPush = vi.fn();
let mockSearchParams = new URLSearchParams();
let mockPathname = "/map";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace, push: routerPush }),
  usePathname: () => mockPathname,
}));

const TEST_REGIONS: readonly Region[] = [
  {
    name: "Americas",
    desc: "The birthplace of modern street skating.",
    count: "1.2k Spots",
    image: "https://example.com/americas.png",
    link: "/map?region=americas",
    countries: ["United States", "Canada", "Mexico", "Brazil", "Argentina"],
  },
  {
    name: "Europe",
    desc: "Marble plazas and historic architecture.",
    count: "840 Spots",
    image: "https://example.com/europe.png",
    link: "/map?region=europe",
    countries: [
      "France",
      "Germany",
      "United Kingdom",
      "Italy",
      "Spain",
      "Netherlands",
      "Portugal",
      "Sweden",
    ],
  },
  {
    name: "Asia",
    desc: "Infinite concrete possibilities.",
    count: "620 Spots",
    image: "https://example.com/asia.png",
    link: "/map?region=asia",
    countries: [
      "Japan",
      "South Korea",
      "China",
      "Thailand",
      "Singapore",
      "Indonesia",
      "Philippines",
      "Malaysia",
    ],
  },
];

function makeSpot(id: string, country: string): Spot {
  return {
    id,
    slug: id,
    name: id.toUpperCase(),
    city: "City",
    citySlug: "city",
    address: "1 Main St",
    types: [{ slug: "plaza", name: "Plaza" }],
    sports: [],
    image: "https://example.com/img.png",
    crowdLevel: 25,
    country,
    countryCode: "US",
    location: { lat: 0, lon: 0 },
    createdBy: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
}

const US = makeSpot("us-1", "United States");
const FR = makeSpot("fr-1", "France");
const JP = makeSpot("jp-1", "Japan");

function render(
  options?: UseMapFilterOptions,
): RenderHookResult<ReturnType<typeof useMapFilter>, unknown> {
  return renderHook(() =>
    useMapFilter([US, FR, JP], mockSearchParams as unknown as ReadonlyURLSearchParams, options),
  );
}

beforeEach(() => {
  routerReplace.mockReset();
  routerPush.mockReset();
  mockSearchParams = new URLSearchParams();
  mockPathname = "/map";
  useSpotsStore.setState({ regions: TEST_REGIONS, spots: [] });
});

describe("useMapFilter", () => {
  it("returns null filters when no params are set", () => {
    const { result } = render();
    expect(result.current.region).toBeNull();
    expect(result.current.country).toBeNull();
    expect(result.current.hasFilter).toBe(false);
    expect(result.current.filteredSpots).toHaveLength(3);
    expect(result.current.availableCountries).toEqual(
      expect.arrayContaining(["United States", "France", "Japan"]),
    );
  });

  it("reads region from the URL slug", () => {
    mockSearchParams = new URLSearchParams("region=europe");
    const { result } = render();
    expect(result.current.region).toBe("Europe");
    expect(result.current.country).toBeNull();
    expect(result.current.hasFilter).toBe(true);
    expect(result.current.filteredSpots.map((s) => s.id)).toEqual(["fr-1"]);
    expect(result.current.availableCountries).toEqual(
      expect.arrayContaining(["France", "Germany"]),
    );
  });

  it("reads country from the URL slug", () => {
    mockSearchParams = new URLSearchParams("region=asia&country=japan");
    const { result } = render();
    expect(result.current.region).toBe("Asia");
    expect(result.current.country).toBe("Japan");
    expect(result.current.filteredSpots.map((s) => s.id)).toEqual(["jp-1"]);
  });

  it("normalises slugs to lowercase and supports multi-word slugs", () => {
    mockSearchParams = new URLSearchParams("region=AMERICAS&country=united-states");
    const { result } = render();
    expect(result.current.region).toBe("Americas");
    expect(result.current.country).toBe("United States");
  });

  it("drops invalid slugs back to null (no crash, no leak)", () => {
    mockSearchParams = new URLSearchParams("region=antarctica&country=mars");
    const { result } = render();
    expect(result.current.region).toBeNull();
    expect(result.current.country).toBeNull();
    expect(result.current.hasFilter).toBe(false);
    expect(result.current.filteredSpots).toHaveLength(3);
  });

  it("setRegion(name) writes region=… and preserves the country when still valid", () => {
    mockSearchParams = new URLSearchParams("region=europe&country=france");
    const { result } = render();
    act(() => {
      result.current.setRegion("Asia");
    });
    expect(routerReplace).toHaveBeenCalledTimes(1);
    const [url, options] = routerReplace.mock.calls[0] as [string, { scroll: boolean }];
    expect(url).toBe("/map?region=asia");
    expect(options).toEqual({ scroll: false });
  });

  it("setRegion(name) clears the country when it no longer belongs to the region", () => {
    mockSearchParams = new URLSearchParams("region=europe&country=france");
    const { result } = render();
    act(() => {
      result.current.setRegion("Americas");
    });
    const [url] = routerReplace.mock.calls[0] as [string, unknown];
    expect(url).toBe("/map?region=americas");
  });

  it("setRegion(null) clears both region and country", () => {
    mockSearchParams = new URLSearchParams("region=europe&country=france");
    const { result } = render();
    act(() => {
      result.current.setRegion(null);
    });
    const [url] = routerReplace.mock.calls[0] as [string, unknown];
    expect(url).toBe("/map");
  });

  it("setCountry(name) writes country=… and keeps the current region", () => {
    mockSearchParams = new URLSearchParams("region=americas");
    const { result } = render();
    act(() => {
      result.current.setCountry("Brazil");
    });
    const [url] = routerReplace.mock.calls[0] as [string, unknown];
    expect(url).toBe("/map?region=americas&country=brazil");
  });

  it("setCountry(null) drops only the country param", () => {
    mockSearchParams = new URLSearchParams("region=europe&country=france");
    const { result } = render();
    act(() => {
      result.current.setCountry(null);
    });
    const [url] = routerReplace.mock.calls[0] as [string, unknown];
    expect(url).toBe("/map?region=europe");
  });

  it("clearAll() wipes both params", () => {
    mockSearchParams = new URLSearchParams("region=asia&country=japan");
    const { result } = render();
    act(() => {
      result.current.clearAll();
    });
    const [url] = routerReplace.mock.calls[0] as [string, unknown];
    expect(url).toBe("/map");
  });

  it("preserves unrelated query params when writing", () => {
    mockSearchParams = new URLSearchParams("nearby=1&region=americas");
    const { result } = render();
    act(() => {
      result.current.setCountry("Brazil");
    });
    const [url] = routerReplace.mock.calls[0] as [string, unknown];
    expect(url).toBe("/map?nearby=1&region=americas&country=brazil");
  });

  it("ignores setRegion calls with an unknown region name", () => {
    mockSearchParams = new URLSearchParams();
    const { result } = render();
    act(() => {
      result.current.setRegion("Atlantis");
    });
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("ignores setCountry calls with an unknown country name", () => {
    mockSearchParams = new URLSearchParams();
    const { result } = render();
    act(() => {
      result.current.setCountry("Atlantis");
    });
    expect(routerReplace).not.toHaveBeenCalled();
  });
});

describe("useMapFilter with targetPath", () => {
  it("pushes to the target path when the current page is not the target", () => {
    mockPathname = "/";
    const { result } = render({ targetPath: "/map" });
    act(() => {
      result.current.setRegion("Americas");
    });
    expect(routerPush).toHaveBeenCalledTimes(1);
    expect(routerReplace).not.toHaveBeenCalled();
    const [url, options] = routerPush.mock.calls[0] as [string, { scroll: boolean }];
    expect(url).toBe("/map?region=americas");
    expect(options).toEqual({ scroll: false });
  });

  it("pushes to /map with both params when a country is selected from another page", () => {
    mockPathname = "/";
    mockSearchParams = new URLSearchParams("region=americas");
    const { result } = render({ targetPath: "/map" });
    act(() => {
      result.current.setCountry("Brazil");
    });
    const [url] = routerPush.mock.calls[0] as [string, unknown];
    expect(url).toBe("/map?region=americas&country=brazil");
  });

  it("replaces in place when already on the target path", () => {
    mockPathname = "/map";
    const { result } = render({ targetPath: "/map" });
    act(() => {
      result.current.setRegion("Europe");
    });
    expect(routerReplace).toHaveBeenCalledTimes(1);
    expect(routerPush).not.toHaveBeenCalled();
    const [url] = routerReplace.mock.calls[0] as [string, unknown];
    expect(url).toBe("/map?region=europe");
  });

  it("pushes to /map when clearAll is called from another page", () => {
    mockPathname = "/";
    mockSearchParams = new URLSearchParams("region=americas&country=brazil");
    const { result } = render({ targetPath: "/map" });
    act(() => {
      result.current.clearAll();
    });
    expect(routerPush).toHaveBeenCalledTimes(1);
    const [url] = routerPush.mock.calls[0] as [string, unknown];
    expect(url).toBe("/map");
  });

  it("preserves unrelated query params on the target URL", () => {
    mockPathname = "/";
    mockSearchParams = new URLSearchParams("nearby=1");
    const { result } = render({ targetPath: "/map" });
    act(() => {
      result.current.setRegion("Asia");
    });
    const [url] = routerPush.mock.calls[0] as [string, unknown];
    expect(url).toBe("/map?nearby=1&region=asia");
  });

  it("ignores invalid names even with targetPath", () => {
    mockPathname = "/";
    const { result } = render({ targetPath: "/map" });
    act(() => {
      result.current.setRegion("Atlantis");
    });
    expect(routerPush).not.toHaveBeenCalled();
    expect(routerReplace).not.toHaveBeenCalled();
  });
});

describe("useMapFilter with defer", () => {
  function renderDeferred(
    options?: UseMapFilterOptions,
  ): RenderHookResult<ReturnType<typeof useMapFilter>, unknown> {
    return renderHook(() =>
      useMapFilter(
        [US, FR, JP],
        mockSearchParams as unknown as ReadonlyURLSearchParams,
        { defer: true, ...options },
      ),
    );
  }

  it("stages setRegion in pending without touching the URL", () => {
    const { result } = renderDeferred({ targetPath: "/map" });
    act(() => {
      result.current.setRegion("Asia");
    });
    expect(routerReplace).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
    expect(result.current.region).toBe("Asia");
    expect(result.current.country).toBeNull();
    expect(result.current.hasPending).toBe(true);
    expect(result.current.hasFilter).toBe(true);
  });

  it("reflects pending on availableCountries and filteredSpots", () => {
    const { result } = renderDeferred();
    act(() => {
      result.current.setRegion("Europe");
    });
    expect(result.current.availableCountries).toEqual(
      expect.arrayContaining(["France", "Germany"]),
    );
    expect(result.current.filteredSpots.map((s) => s.id)).toEqual(["fr-1"]);
  });

  it("setRegion clears the country when it no longer belongs to the new region", () => {
    mockSearchParams = new URLSearchParams("region=europe&country=france");
    const { result } = renderDeferred();
    act(() => {
      result.current.setRegion("Americas");
    });
    expect(result.current.region).toBe("Americas");
    expect(result.current.country).toBeNull();
  });

  it("setCountry stages the country without writing the URL", () => {
    const { result } = renderDeferred();
    act(() => {
      result.current.setRegion("Asia");
    });
    act(() => {
      result.current.setCountry("Japan");
    });
    expect(routerReplace).not.toHaveBeenCalled();
    expect(result.current.region).toBe("Asia");
    expect(result.current.country).toBe("Japan");
    expect(result.current.filteredSpots.map((s) => s.id)).toEqual(["jp-1"]);
  });

  it("clearAll stages null/null without writing the URL", () => {
    mockSearchParams = new URLSearchParams("region=asia&country=japan");
    const { result } = renderDeferred({ targetPath: "/map" });
    act(() => {
      result.current.clearAll();
    });
    expect(routerReplace).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
    expect(result.current.region).toBeNull();
    expect(result.current.country).toBeNull();
    expect(result.current.hasPending).toBe(true);
  });

  it("commit() flushes pending to the URL via targetPath with push when on a different page", () => {
    mockPathname = "/";
    const { result } = renderDeferred({ targetPath: "/map" });
    act(() => {
      result.current.setRegion("Americas");
    });
    act(() => {
      result.current.setCountry("Brazil");
    });
    act(() => {
      result.current.commit();
    });
    expect(routerPush).toHaveBeenCalledTimes(1);
    expect(routerReplace).not.toHaveBeenCalled();
    const [url, options] = routerPush.mock.calls[0] as [string, { scroll: boolean }];
    expect(url).toBe("/map?region=americas&country=brazil");
    expect(options).toEqual({ scroll: false });
    expect(result.current.hasPending).toBe(false);
  });

  it("commit() uses replace when already on the target path", () => {
    mockPathname = "/map";
    const { result } = renderDeferred({ targetPath: "/map" });
    act(() => {
      result.current.setRegion("Europe");
    });
    act(() => {
      result.current.commit();
    });
    expect(routerReplace).toHaveBeenCalledTimes(1);
    expect(routerPush).not.toHaveBeenCalled();
    const [url] = routerReplace.mock.calls[0] as [string, unknown];
    expect(url).toBe("/map?region=europe");
  });

  it("commit() is a no-op when nothing is pending", () => {
    const { result } = renderDeferred({ targetPath: "/map" });
    act(() => {
      result.current.commit();
    });
    expect(routerPush).not.toHaveBeenCalled();
    expect(routerReplace).not.toHaveBeenCalled();
    expect(result.current.hasPending).toBe(false);
  });

  it("commit() writes the country to the URL when setCountry, commit, and cancelPending share one tick (picker flow)", () => {
    mockPathname = "/";
    mockSearchParams = new URLSearchParams("region=europe");
    const { result } = renderDeferred({ targetPath: "/map" });
    act(() => {
      result.current.setCountry("France");
      result.current.commit();
      result.current.cancelPending();
    });
    expect(routerPush).toHaveBeenCalledTimes(1);
    expect(routerReplace).not.toHaveBeenCalled();
    const [url, options] = routerPush.mock.calls[0] as [string, { scroll: boolean }];
    expect(url).toBe("/map?region=europe&country=france");
    expect(options).toEqual({ scroll: false });
    expect(result.current.hasPending).toBe(false);
  });

  it("commit() flushes the staged region for 'View all' within the same tick as cancelPending", () => {
    mockPathname = "/";
    const { result } = renderDeferred({ targetPath: "/map" });
    act(() => {
      result.current.setRegion("Asia");
      result.current.commit();
      result.current.cancelPending();
    });
    expect(routerPush).toHaveBeenCalledTimes(1);
    expect(routerReplace).not.toHaveBeenCalled();
    const [url] = routerPush.mock.calls[0] as [string, unknown];
    expect(url).toBe("/map?region=asia");
    expect(result.current.hasPending).toBe(false);
  });

  it("cancelPending() discards pending and restores URL-derived reads", () => {
    mockSearchParams = new URLSearchParams("region=europe");
    const { result } = renderDeferred({ targetPath: "/map" });
    act(() => {
      result.current.setCountry("Germany");
    });
    expect(result.current.country).toBe("Germany");
    expect(result.current.hasPending).toBe(true);
    act(() => {
      result.current.cancelPending();
    });
    expect(result.current.country).toBeNull();
    expect(result.current.region).toBe("Europe");
    expect(result.current.hasPending).toBe(false);
    expect(routerPush).not.toHaveBeenCalled();
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("ignores invalid names in deferred mode (no write, no stage)", () => {
    const { result } = renderDeferred();
    act(() => {
      result.current.setRegion("Atlantis");
    });
    act(() => {
      result.current.setCountry("Atlantis");
    });
    expect(routerReplace).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
    expect(result.current.hasPending).toBe(false);
  });
});
