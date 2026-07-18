import { describe, it, expect } from "vitest";
import {
  formatDistanceMiles,
  getSpotDistanceInfo,
  haversineMiles,
  SPOT_DISTANCE_CTA_LABEL,
} from "./geo";
import type { Spot } from "@/lib/types";

function makeSpot(lat: number, lon: number): Spot {
  return {
    id: "spot-1",
    slug: "spot-1",
    name: "Test Spot",
    city: "Test City",
    citySlug: "test-city",
    address: "1 Test St",
    types: [{ slug: "plaza", name: "Plaza" }],
    sports: [],
    image: "https://example.com/spot.jpg",
    crowdLevel: 0,
    country: "US",
    countryCode: "US",
    location: { lat, lon },
    createdBy: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
}

describe("haversineMiles", () => {
  it("returns 0 for the same point", () => {
    expect(haversineMiles(34.0522, -118.2437, 34.0522, -118.2437)).toBe(0);
  });

  it("computes a known short distance within tolerance", () => {
    const miles = haversineMiles(34.0522, -118.2437, 34.0622, -118.2437);
    expect(miles).toBeGreaterThan(0.65);
    expect(miles).toBeLessThan(0.75);
  });
});

describe("formatDistanceMiles", () => {
  it("formats sub-10 mile distances with one decimal", () => {
    expect(formatDistanceMiles(3.4)).toBe("3.4 MI AWAY");
  });

  it("rounds 10-100 mile distances to the nearest integer", () => {
    expect(formatDistanceMiles(47.4)).toBe("47 MI AWAY");
  });

  it("rounds 100+ mile distances to the nearest 10", () => {
    expect(formatDistanceMiles(347)).toBe("350 MI AWAY");
  });
});

describe("getSpotDistanceInfo", () => {
  const spot = makeSpot(34.0522, -118.2437);

  it("returns the CTA info when origin is null", () => {
    expect(getSpotDistanceInfo(spot, null)).toEqual({
      kind: "cta",
      label: SPOT_DISTANCE_CTA_LABEL,
    });
  });

  it("returns the distance info when origin is provided", () => {
    const info = getSpotDistanceInfo(spot, { lat: 34.0622, lon: -118.2437 });
    expect(info.kind).toBe("distance");
    if (info.kind !== "distance") return;
    expect(info.miles).toBeGreaterThan(0);
    expect(info.label).toMatch(/MI AWAY$/);
  });

  it("returns 0 miles when origin equals the spot location", () => {
    const info = getSpotDistanceInfo(spot, { lat: 34.0522, lon: -118.2437 });
    expect(info).toEqual({ kind: "distance", label: "0.0 MI AWAY", miles: 0 });
  });
});
