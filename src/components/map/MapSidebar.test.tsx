import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MapSidebar } from "./MapSidebar";
import type { Spot } from "@/lib/types";

function makeSpot(id: string, lat: number, lon: number): Spot {
  return {
    id,
    slug: id,
    name: id.toUpperCase(),
    city: "City",
    citySlug: "city",
    address: "1 Main St",
    type: "Plaza",
    typeSlug: "plaza",
    sports: [],
    image: "https://example.com/img.png",
    crowdLevel: 25,
    country: "United States",
    countryCode: "US",
    location: { lat, lon },
    createdBy: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
}

const ORIGIN = { lat: 34.0522, lon: -118.2437 };
const NEARBY = makeSpot("near", 34.06, -118.25);
const MEDIUM = makeSpot("medium", 34.5, -118.0);
const FAR = makeSpot("far", 40.0, -74.0);

describe("<MapSidebar> radius chips", () => {
  it("does not render chips when no userLocation is provided", () => {
    render(
      <MapSidebar
        spots={[NEARBY, MEDIUM, FAR]}
        activeId={null}
        savedIds={new Set()}
        onSelect={vi.fn()}
        mode="filtered"
        onSelectMode={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("radiogroup", { name: /nearby radius/i }),
    ).toBeNull();
    expect(screen.getByText("3 spots active")).toBeInTheDocument();
  });

  it("renders chips when userLocation is provided and reflects the active radius", () => {
    render(
      <MapSidebar
        spots={[NEARBY, MEDIUM, FAR]}
        activeId={null}
        savedIds={new Set()}
        onSelect={vi.fn()}
        userLocation={ORIGIN}
        radiusMiles={50}
        onRadiusChange={vi.fn()}
        mode="filtered"
        onSelectMode={vi.fn()}
      />,
    );
    const group = screen.getByRole("radiogroup", { name: /nearby radius/i });
    expect(group).toBeInTheDocument();
    const active = screen.getByRole("radio", { name: "50 mi" });
    expect(active).toHaveAttribute("aria-checked", "true");
  });

  it("renders every spot the parent passed in (no longer re-filters by radius)", () => {
    render(
      <MapSidebar
        spots={[NEARBY, MEDIUM, FAR]}
        activeId={null}
        savedIds={new Set()}
        onSelect={vi.fn()}
        userLocation={ORIGIN}
        radiusMiles={50}
        onRadiusChange={vi.fn()}
        mode="filtered"
        onSelectMode={vi.fn()}
      />,
    );
    expect(screen.getByText("NEAR")).toBeInTheDocument();
    expect(screen.getByText("MEDIUM")).toBeInTheDocument();
    expect(screen.getByText("FAR")).toBeInTheDocument();
  });

  it("shows the empty-state message when the parent passed no spots", () => {
    render(
      <MapSidebar
        spots={[]}
        activeId={null}
        savedIds={new Set()}
        onSelect={vi.fn()}
        userLocation={ORIGIN}
        radiusMiles={10}
        onRadiusChange={vi.fn()}
        mode="filtered"
        onSelectMode={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/No spots within 10 mi/i),
    ).toBeInTheDocument();
  });

  it("calls onRadiusChange when a chip is clicked", async () => {
    const onRadiusChange = vi.fn();
    const user = userEvent.setup();
    render(
      <MapSidebar
        spots={[NEARBY, MEDIUM, FAR]}
        activeId={null}
        savedIds={new Set()}
        onSelect={vi.fn()}
        userLocation={ORIGIN}
        radiusMiles={50}
        onRadiusChange={onRadiusChange}
        mode="filtered"
        onSelectMode={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("radio", { name: "25 mi" }));
    expect(onRadiusChange).toHaveBeenCalledWith(25);
  });
});

describe("<MapSidebar> active filter chip", () => {
  it("renders the chip with 'Country (Region)' when both are set", () => {
    render(
      <MapSidebar
        spots={[]}
        activeId={null}
        savedIds={new Set()}
        onSelect={vi.fn()}
        region="Europe"
        country="France"
        onClearFilter={vi.fn()}
        mode="filtered"
        onSelectMode={vi.fn()}
      />,
    );
    expect(screen.getByText("France (Europe)")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /clear region and country filter/i }),
    ).toBeInTheDocument();
  });

  it("renders the chip with just the region when no country is set", () => {
    render(
      <MapSidebar
        spots={[]}
        activeId={null}
        savedIds={new Set()}
        onSelect={vi.fn()}
        region="Europe"
        onClearFilter={vi.fn()}
        mode="filtered"
        onSelectMode={vi.fn()}
      />,
    );
    expect(screen.getByText("Europe")).toBeInTheDocument();
    expect(screen.queryByText(/Europe.*Europe/)).not.toBeInTheDocument();
  });

  it("does not render the chip when no filter is set", () => {
    render(
      <MapSidebar
        spots={[NEARBY]}
        activeId={null}
        savedIds={new Set()}
        onSelect={vi.fn()}
        onClearFilter={vi.fn()}
        mode="filtered"
        onSelectMode={vi.fn()}
      />,
    );
    expect(screen.queryByText(/^Filter$/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /clear region and country filter/i }),
    ).not.toBeInTheDocument();
  });

  it("calls onClearFilter when the chip's X is clicked", async () => {
    const onClearFilter = vi.fn();
    const user = userEvent.setup();
    render(
      <MapSidebar
        spots={[]}
        activeId={null}
        savedIds={new Set()}
        onSelect={vi.fn()}
        region="Europe"
        country="France"
        onClearFilter={onClearFilter}
        mode="filtered"
        onSelectMode={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /clear region and country filter/i }),
    );

    expect(onClearFilter).toHaveBeenCalledTimes(1);
  });

  it("names the filter in the empty state and offers a clear action", () => {
    render(
      <MapSidebar
        spots={[]}
        activeId={null}
        savedIds={new Set()}
        onSelect={vi.fn()}
        region="Europe"
        country="France"
        onClearFilter={vi.fn()}
        mode="filtered"
        onSelectMode={vi.fn()}
      />,
    );
    expect(screen.getByText(/No spots in France \(Europe\)/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^clear filter$/i }),
    ).toBeInTheDocument();
  });
});

describe("<MapSidebar> mode switcher", () => {
  it("renders both options with the matching aria-checked for mode='filtered'", () => {
    render(
      <MapSidebar
        spots={[]}
        activeId={null}
        savedIds={new Set()}
        onSelect={vi.fn()}
        mode="filtered"
        onSelectMode={vi.fn()}
      />,
    );
    const group = screen.getByRole("radiogroup", { name: /map mode/i });
    expect(group).toBeInTheDocument();
    const filtered = screen.getByRole("radio", { name: /filtered/i });
    const nearby = screen.getByRole("radio", { name: /nearby/i });
    expect(filtered).toHaveAttribute("aria-checked", "true");
    expect(nearby).toHaveAttribute("aria-checked", "false");
  });

  it("renders both options with the matching aria-checked for mode='nearby'", () => {
    render(
      <MapSidebar
        spots={[]}
        activeId={null}
        savedIds={new Set()}
        onSelect={vi.fn()}
        mode="nearby"
        onSelectMode={vi.fn()}
      />,
    );
    const filtered = screen.getByRole("radio", { name: /filtered/i });
    const nearby = screen.getByRole("radio", { name: /nearby/i });
    expect(filtered).toHaveAttribute("aria-checked", "false");
    expect(nearby).toHaveAttribute("aria-checked", "true");
  });

  it("calls onSelectMode with the clicked mode", async () => {
    const onSelectMode = vi.fn();
    const user = userEvent.setup();
    render(
      <MapSidebar
        spots={[]}
        activeId={null}
        savedIds={new Set()}
        onSelect={vi.fn()}
        mode="filtered"
        onSelectMode={onSelectMode}
      />,
    );

    await user.click(screen.getByRole("radio", { name: /nearby/i }));
    expect(onSelectMode).toHaveBeenCalledWith("nearby");

    await user.click(screen.getByRole("radio", { name: /filtered/i }));
    expect(onSelectMode).toHaveBeenCalledWith("filtered");
    expect(onSelectMode).toHaveBeenCalledTimes(2);
  });
});
