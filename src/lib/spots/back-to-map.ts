import type { ReadonlyURLSearchParams } from "next/navigation";
import { findRegionForCountry } from "@/lib/spots/suggestions";
import { ROUTES } from "@/lib/nav";
import type { Region, Spot } from "@/lib/types";

const KEPT_PARAMS = ["region", "country", "nearby"] as const;

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function findCountrySlug(
  countryName: string,
  regions: readonly Region[],
): string | null {
  if (!countryName) return null;
  for (const r of regions) {
    for (const c of r.countries) {
      if (c === countryName) return slugify(c);
    }
  }
  return null;
}

export function buildBackToMapUrl(
  current: ReadonlyURLSearchParams,
  spot: Spot,
  regions: readonly Region[],
): string {
  const next = new URLSearchParams();
  for (const key of KEPT_PARAMS) {
    const value = current.get(key);
    if (value) next.set(key, value);
  }
  if (!next.has("country")) {
    const countrySlug = findCountrySlug(spot.country, regions);
    if (countrySlug) next.set("country", countrySlug);
  }
  if (!next.has("region")) {
    const region = findRegionForCountry(spot.country, regions);
    if (region) next.set("region", slugify(region.name));
  }
  const query = next.toString();
  return query ? `${ROUTES.map}?${query}` : ROUTES.map;
}
