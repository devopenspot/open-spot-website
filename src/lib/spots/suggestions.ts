import { haversineMiles, hashToUnitInterval, type LatLon } from "@/lib/spots/geo";
import type { Region, Spot } from "@/lib/types";

export const SUGGESTED_SPOTS_LIMIT = 8;
export const SUGGESTED_SPOTS_MIN = 3;

export type SuggestedScope = "country" | "region";

export interface SuggestedSpotsParams {
  current: Spot;
  all: readonly Spot[];
  regions: readonly Region[];
  origin: LatLon | null;
  limit?: number;
}

export interface SuggestedSpotsResult {
  spots: readonly Spot[];
  scope: SuggestedScope | null;
  scopeLabel: string;
}

export function findRegionForCountry(
  country: string,
  regions: readonly Region[],
): Region | undefined {
  if (!country) return undefined;
  return regions.find((r) => r.countries.includes(country));
}

function excludeCurrent(all: readonly Spot[], currentId: string): Spot[] {
  return all.filter((s) => s.id !== currentId);
}

function rankByDistance(
  pool: readonly Spot[],
  origin: LatLon,
): Spot[] {
  return [...pool]
    .map((s) => ({
      s,
      d: haversineMiles(origin.lat, origin.lon, s.location.lat, s.location.lon),
    }))
    .sort((a, b) => a.d - b.d)
    .map((x) => x.s);
}

function rankBySeed(pool: readonly Spot[], seedKey: string): Spot[] {
  return [...pool]
    .map((s) => ({ s, k: hashToUnitInterval(`${seedKey}:${s.id}`) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.s);
}

export function buildSuggestedSpots(
  params: SuggestedSpotsParams,
): SuggestedSpotsResult {
  const { current, all, regions, origin } = params;
  const limit = params.limit ?? SUGGESTED_SPOTS_LIMIT;
  const others = excludeCurrent(all, current.id);

  const countryMatch = others.filter((s) => s.country === current.country);
  if (countryMatch.length >= SUGGESTED_SPOTS_MIN) {
    const ordered = origin
      ? rankByDistance(countryMatch, origin)
      : rankBySeed(countryMatch, current.id);
    return {
      spots: ordered.slice(0, limit),
      scope: "country",
      scopeLabel: `More spots in ${current.country}`,
    };
  }

  const region = findRegionForCountry(current.country, regions);
  if (region) {
    const regionMatch = others.filter((s) => region.countries.includes(s.country));
    if (regionMatch.length >= SUGGESTED_SPOTS_MIN) {
      const ordered = origin
        ? rankByDistance(regionMatch, origin)
        : rankBySeed(regionMatch, current.id);
      return {
        spots: ordered.slice(0, limit),
        scope: "region",
        scopeLabel: `More spots in ${region.name}`,
      };
    }
  }

  return { spots: [], scope: null, scopeLabel: "" };
}
