import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegionFilter } from "./RegionFilter";
import { useSpotsStore } from "@/stores/spots-store";
import type { Region, Spot } from "@/lib/types";

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

const SPOTS: readonly Spot[] = [
  makeSpot("us-1", "United States"),
  makeSpot("us-2", "United States"),
  makeSpot("fr-1", "France"),
  makeSpot("fr-2", "France"),
  makeSpot("fr-3", "France"),
  makeSpot("de-1", "Germany"),
];

interface HarnessProps {
  initialRegion?: string | null;
  initialCountry?: string | null;
  onAfterChange?: () => void;
  onCommit?: () => void;
}

function Harness({
  initialRegion = null,
  initialCountry = null,
  onAfterChange,
  onCommit,
}: HarnessProps) {
  const [region, setRegionState] = useState<string | null>(initialRegion);
  const [country, setCountryState] = useState<string | null>(initialCountry);
  const setRegion = (name: string | null) => setRegionState(name);
  const setCountry = (name: string | null) => setCountryState(name);
  const availableCountries = region
    ? TEST_REGIONS.find((r) => r.name === region)?.countries ?? []
    : TEST_REGIONS.flatMap((r) => r.countries);
  const hasFilter = region !== null || country !== null;
  return (
    <RegionFilter
      region={region}
      country={country}
      availableCountries={availableCountries}
      hasFilter={hasFilter}
      setRegion={setRegion}
      setCountry={setCountry}
      clearAll={vi.fn()}
      onAfterChange={onAfterChange}
      onCommit={onCommit}
      allSpots={SPOTS}
    />
  );
}

beforeEach(() => {
  useSpotsStore.setState({ regions: TEST_REGIONS, spots: [...SPOTS] });
});

describe("<RegionFilter> picker mode", () => {
  it("renders the region list when no region is selected", () => {
    render(<Harness onCommit={vi.fn()} />);
    const list = screen.getByRole("list", { name: /available regions/i });
    expect(within(list).getByText("Americas")).toBeInTheDocument();
    expect(within(list).getByText("Europe")).toBeInTheDocument();
    expect(screen.queryByText(/countries in/i)).not.toBeInTheDocument();
  });

  it("clicking a region reveals the country list without closing", async () => {
    const user = userEvent.setup();
    const onAfterChange = vi.fn();
    render(<Harness onAfterChange={onAfterChange} onCommit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Europe/i }));

    expect(onAfterChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole("list", { name: /countries in europe/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("France")).toBeInTheDocument();
    expect(screen.getByText("Germany")).toBeInTheDocument();
    expect(screen.getByText("Italy")).toBeInTheDocument();
  });

  it("clicking a country triggers both onAfterChange and onCommit", async () => {
    const user = userEvent.setup();
    const onAfterChange = vi.fn();
    const onCommit = vi.fn();
    render(
      <Harness
        initialRegion="Europe"
        onAfterChange={onAfterChange}
        onCommit={onCommit}
      />,
    );

    await user.click(screen.getByRole("button", { name: /France/i }));

    expect(onAfterChange).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("clicking 'View all {region} spots' triggers both callbacks", async () => {
    const user = userEvent.setup();
    const onAfterChange = vi.fn();
    const onCommit = vi.fn();
    render(
      <Harness
        initialRegion="Europe"
        onAfterChange={onAfterChange}
        onCommit={onCommit}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /view all europe spots/i }),
    );

    expect(onAfterChange).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("clicking the back link clears the region without closing", async () => {
    const user = userEvent.setup();
    const onAfterChange = vi.fn();
    render(
      <Harness
        initialRegion="Europe"
        onAfterChange={onAfterChange}
        onCommit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("list", { name: /countries in europe/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /all regions/i }));

    expect(onAfterChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole("list", { name: /available regions/i }),
    ).toBeInTheDocument();
  });

  it("displays the per-country spot count from allSpots", () => {
    render(
      <Harness initialRegion="Europe" onCommit={vi.fn()} />,
    );

    const list = screen.getByRole("list", { name: /countries in europe/i });
    expect(within(list).getByText("3 spots")).toBeInTheDocument();
    expect(within(list).getByText("1 spot")).toBeInTheDocument();
  });

  it("reflects the active country with aria-pressed", () => {
    render(
      <Harness
        initialRegion="Europe"
        initialCountry="France"
        onCommit={vi.fn()}
      />,
    );
    const france = screen.getByRole("button", { name: /France/i });
    const germany = screen.getByRole("button", { name: /Germany/i });
    expect(france).toHaveAttribute("aria-pressed", "true");
    expect(germany).toHaveAttribute("aria-pressed", "false");
  });

  it("hides the back link and 'View all' CTA when not in picker mode", () => {
    render(
      <Harness initialRegion="Europe" onCommit={undefined} />,
    );
    expect(
      screen.queryByRole("button", { name: /all regions/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /view all europe spots/i }),
    ).not.toBeInTheDocument();
  });
});

describe("<RegionFilter> legacy mode (no onCommit)", () => {
  it("clicking a region fires onAfterChange and never reaches the country list", async () => {
    const user = userEvent.setup();
    const onAfterChange = vi.fn();
    render(<Harness onAfterChange={onAfterChange} onCommit={undefined} />);

    await user.click(screen.getByRole("button", { name: /Europe/i }));

    expect(onAfterChange).toHaveBeenCalledTimes(1);
  });
});
