import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchOverlay } from "./SearchOverlay";
import { useSpotsStore } from "@/stores/spots-store";
import type { Region, Spot } from "@/lib/types";

vi.mock("@/components/feedback/Overlay", () => ({
  Overlay: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const useMapFilterMock = vi.fn();
vi.mock("@/hooks/useMapFilter", () => ({
  useMapFilter: (...args: unknown[]) =>
    (useMapFilterMock as (...a: unknown[]) => unknown)(...args),
}));

const useUIStoreState: { openSearch: () => void } = {
  openSearch: vi.fn(),
};
vi.mock("@/stores/ui-store", () => ({
  useUIStore: (selector: (s: typeof useUIStoreState) => unknown) =>
    selector(useUIStoreState),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/",
}));

const TEST_REGIONS: readonly Region[] = [
  {
    name: "Americas",
    desc: "The birthplace of modern street skating.",
    count: "1.2k Spots",
    image: "https://example.com/americas.png",
    link: "/map?region=americas",
    countries: ["United States", "Canada", "Brazil"],
  },
  {
    name: "Europe",
    desc: "Marble plazas and historic architecture.",
    count: "840 Spots",
    image: "https://example.com/europe.png",
    link: "/map?region=europe",
    countries: ["France", "Germany", "Italy"],
  },
];

function makeSpot(id: string, country: string, name: string): Spot {
  return {
    id,
    slug: id,
    name,
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

const SPOTS: readonly Spot[] = [
  makeSpot("us-1", "United States", "BROOKLYN BANKS"),
  makeSpot("us-2", "United States", "VENICE BEACH"),
  makeSpot("fr-1", "France", "PARIS PLAZA"),
];

function setMapFilter(overrides: Partial<{
  region: string | null;
  country: string | null;
  availableCountries: readonly string[];
  filteredSpots: readonly Spot[];
  setRegion: ReturnType<typeof vi.fn>;
  setCountry: ReturnType<typeof vi.fn>;
  clearAll: ReturnType<typeof vi.fn>;
  commit: ReturnType<typeof vi.fn>;
  cancelPending: ReturnType<typeof vi.fn>;
  hasFilter: boolean;
  hasPending: boolean;
}> = {}) {
  useMapFilterMock.mockReturnValue({
    region: null,
    country: null,
    availableCountries: TEST_REGIONS.flatMap((r) => r.countries),
    filteredSpots: SPOTS,
    hasFilter: false,
    hasPending: false,
    setRegion: vi.fn(),
    setCountry: vi.fn(),
    clearAll: vi.fn(),
    commit: vi.fn(),
    cancelPending: vi.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  useMapFilterMock.mockReset();
  useUIStoreState.openSearch = vi.fn();
  useSpotsStore.setState({ regions: TEST_REGIONS, spots: [...SPOTS] });
});

describe("<SearchOverlay> picker mode", () => {
  it("shows the region list and the 'Step 01' breadcrumb when no region is selected", () => {
    setMapFilter();
    render(
      <SearchOverlay
        isOpen
        onClose={vi.fn()}
        spots={SPOTS}
        onSelectSpot={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("list", { name: /available regions/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Step 01 · Regions/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: /countries in/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the country drill-down and 'Step 02 · {Region}' breadcrumb when a region is selected", () => {
    setMapFilter({
      region: "Europe",
      availableCountries: TEST_REGIONS[1]!.countries,
      hasFilter: true,
    });
    render(
      <SearchOverlay
        isOpen
        onClose={vi.fn()}
        spots={SPOTS}
        onSelectSpot={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("list", { name: /countries in europe/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Step 02 · Europe/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: /available regions/i }),
    ).not.toBeInTheDocument();
  });

  it("calls cancelPending and onClose when the Close button is clicked", async () => {
    const cancelPending = vi.fn();
    const onClose = vi.fn();
    setMapFilter({ cancelPending });
    const user = userEvent.setup();
    render(
      <SearchOverlay
        isOpen
        onClose={onClose}
        spots={SPOTS}
        onSelectSpot={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(cancelPending).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("<SearchOverlay> query mode", () => {
  it("shows the matched spots list when the input has text", async () => {
    setMapFilter({
      filteredSpots: [SPOTS[0]!],
    });
    const user = userEvent.setup();
    render(
      <SearchOverlay
        isOpen
        onClose={vi.fn()}
        spots={SPOTS}
        onSelectSpot={vi.fn()}
      />,
    );

    const input = screen.getByRole("searchbox");
    await user.type(input, "BROOKLYN");

    const list = screen.getByRole("list", { name: /matched spots/i });
    expect(within(list).getByText("BROOKLYN BANKS")).toBeInTheDocument();
    expect(screen.getByText(/Matched codes \(1\)/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: /available regions/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the empty state when the query matches no spots", async () => {
    setMapFilter({ filteredSpots: [] });
    const user = userEvent.setup();
    render(
      <SearchOverlay
        isOpen
        onClose={vi.fn()}
        spots={SPOTS}
        onSelectSpot={vi.fn()}
      />,
    );

    const input = screen.getByRole("searchbox");
    await user.type(input, "ZZZZZ");

    expect(screen.getByText(/No plots detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Matched codes \(0\)/i)).toBeInTheDocument();
  });

  it("calls onSelectSpot and onClose when a matched spot is clicked", async () => {
    const onSelectSpot = vi.fn();
    const onClose = vi.fn();
    setMapFilter({ filteredSpots: [SPOTS[0]!] });
    const user = userEvent.setup();
    render(
      <SearchOverlay
        isOpen
        onClose={onClose}
        spots={SPOTS}
        onSelectSpot={onSelectSpot}
      />,
    );

    const input = screen.getByRole("searchbox");
    await user.type(input, "BROOKLYN");

    const list = screen.getByRole("list", { name: /matched spots/i });
    await user.click(within(list).getByText("BROOKLYN BANKS"));

    expect(onSelectSpot).toHaveBeenCalledWith(SPOTS[0]!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("<SearchOverlay> deferred integration", () => {
  it("uses defer: true and the map target path when calling useMapFilter", () => {
    setMapFilter();
    render(
      <SearchOverlay
        isOpen
        onClose={vi.fn()}
        spots={SPOTS}
        onSelectSpot={vi.fn()}
      />,
    );
    expect(useMapFilterMock).toHaveBeenCalledTimes(1);
    const [spotsArg, paramsArg, options] = useMapFilterMock.mock.calls[0]!;
    expect(spotsArg).toBe(SPOTS);
    expect(paramsArg).toBeInstanceOf(URLSearchParams);
    expect(options).toEqual({
      targetPath: "/map",
      defer: true,
    });
  });

  it("toggles between query mode and picker mode when the input changes", async () => {
    setMapFilter();
    const user = userEvent.setup();
    render(
      <SearchOverlay
        isOpen
        onClose={vi.fn()}
        spots={SPOTS}
        onSelectSpot={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("list", { name: /available regions/i }),
    ).toBeInTheDocument();

    const input = screen.getByRole("searchbox");
    await user.type(input, "B");

    expect(
      screen.queryByRole("list", { name: /available regions/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: /matched spots/i }),
    ).toBeInTheDocument();

    await user.clear(input);

    expect(
      screen.getByRole("list", { name: /available regions/i }),
    ).toBeInTheDocument();
  });
});
