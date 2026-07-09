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
    features: ["Smooth Concrete"],
    sports: [],
    image: "https://example.com/img.png",
    communityNote: "n",
    crowdLevel: 25,
    crowdLevelLabel: "Low",
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
      />,
    );
    expect(screen.queryByRole("radiogroup")).toBeNull();
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
      />,
    );
    await user.click(screen.getByRole("radio", { name: "25 mi" }));
    expect(onRadiusChange).toHaveBeenCalledWith(25);
  });
});
