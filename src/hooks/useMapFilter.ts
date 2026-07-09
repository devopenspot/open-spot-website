"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, type ReadonlyURLSearchParams } from "next/navigation";
import { useSpotsStore } from "@/stores/spots-store";
import type { Spot } from "@/lib/types";

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSlugMaps(regions: ReadonlyArray<{ name: string; countries: readonly string[] }>): {
  regionSlugToName: ReadonlyMap<string, string>;
  countrySlugToName: ReadonlyMap<string, string>;
  nameToRegionSlug: ReadonlyMap<string, string>;
  nameToCountrySlug: ReadonlyMap<string, string>;
} {
  const regionSlugToName = new Map<string, string>();
  const nameToRegionSlug = new Map<string, string>();
  const countrySlugToName = new Map<string, string>();
  const nameToCountrySlug = new Map<string, string>();
  for (const r of regions) {
    const rSlug = slugify(r.name);
    regionSlugToName.set(rSlug, r.name);
    nameToRegionSlug.set(r.name, rSlug);
    for (const c of r.countries) {
      const cSlug = slugify(c);
      countrySlugToName.set(cSlug, c);
      nameToCountrySlug.set(c, cSlug);
    }
  }
  return { regionSlugToName, countrySlugToName, nameToRegionSlug, nameToCountrySlug };
}

export interface MapFilter {
  region: string | null;
  country: string | null;
  availableCountries: readonly string[];
  filteredSpots: Spot[];
  hasFilter: boolean;
  setRegion: (name: string | null) => void;
  setCountry: (name: string | null) => void;
  clearAll: () => void;
}

export interface UseMapFilterOptions {
  /**
   * When provided, setters navigate to this path (e.g. "/map") with the new
   * query string instead of updating the current page's URL in place. Uses
   * `router.push` when the current pathname differs from the target (so
   * back-button returns to the origin page) and `router.replace` when already
   * on the target path (no extra history entries).
   */
  targetPath?: string;
}

export function useMapFilter(
  spots: readonly Spot[],
  searchParams: ReadonlyURLSearchParams,
  options: UseMapFilterOptions = {},
): MapFilter {
  const router = useRouter();
  const pathname = usePathname();
  const { targetPath } = options;
  const regions = useSpotsStore((s) => s.regions);

  const slugs = useMemo(() => buildSlugMaps(regions), [regions]);
  const validRegionNames = useMemo(
    () => new Set(regions.map((r) => r.name)),
    [regions],
  );
  const validCountryNames = useMemo(
    () => new Set(regions.flatMap((r) => r.countries)),
    [regions],
  );

  const regionSlug = searchParams.get("region")?.toLowerCase() ?? null;
  const countrySlug = searchParams.get("country")?.toLowerCase() ?? null;

  const region = regionSlug ? slugs.regionSlugToName.get(regionSlug) ?? null : null;
  const country = countrySlug
    ? slugs.countrySlugToName.get(countrySlug) ?? null
    : null;

  const safeRegion =
    region && validRegionNames.has(region) ? region : null;
  const safeCountry =
    country && validCountryNames.has(country) ? country : null;

  const availableCountries = useMemo(() => {
    if (!safeRegion) {
      return regions.flatMap((r) => r.countries);
    }
    return regions.find((r) => r.name === safeRegion)?.countries ?? [];
  }, [safeRegion, regions]);

  const writeQuery = useCallback(
    (next: { region: string | null; country: string | null }) => {
      const params = new URLSearchParams(searchParams.toString());
      const regionSlugValue = next.region ? slugs.nameToRegionSlug.get(next.region) ?? null : null;
      const countrySlugValue = next.country
        ? slugs.nameToCountrySlug.get(next.country) ?? null
        : null;
      if (regionSlugValue) params.set("region", regionSlugValue);
      else params.delete("region");
      if (countrySlugValue) params.set("country", countrySlugValue);
      else params.delete("country");
      const query = params.toString();
      const destination = targetPath ?? pathname;
      const url = query ? `${destination}?${query}` : destination;
      const isCrossPageNavigation =
        typeof targetPath === "string" && targetPath !== pathname;
      if (isCrossPageNavigation) {
        router.push(url, { scroll: false });
      } else {
        router.replace(url, { scroll: false });
      }
    },
    [pathname, router, searchParams, slugs, targetPath],
  );

  const setRegion = useCallback(
    (name: string | null) => {
      if (name === null) {
        writeQuery({ region: null, country: null });
        return;
      }
      if (!validRegionNames.has(name)) return;
      const regionEntry = regions.find((r) => r.name === name);
      const nextCountry = safeCountry && regionEntry && !regionEntry.countries.includes(safeCountry)
        ? null
        : safeCountry;
      writeQuery({ region: name, country: nextCountry });
    },
    [regions, safeCountry, validRegionNames, writeQuery],
  );

  const setCountry = useCallback(
    (name: string | null) => {
      if (name === null) {
        writeQuery({ region: safeRegion, country: null });
        return;
      }
      if (!validCountryNames.has(name)) return;
      writeQuery({ region: safeRegion, country: name });
    },
    [safeRegion, validCountryNames, writeQuery],
  );

  const clearAll = useCallback(() => {
    writeQuery({ region: null, country: null });
  }, [writeQuery]);

  const filteredSpots = useMemo(() => {
    if (!safeRegion) return spots.slice();
    return spots.filter((spot) => {
      const regionEntry = regions.find((r) => r.countries.includes(spot.country));
      if (regionEntry?.name !== safeRegion) return false;
      if (safeCountry && spot.country !== safeCountry) return false;
      return true;
    });
  }, [spots, safeRegion, safeCountry, regions]);

  return {
    region: safeRegion,
    country: safeCountry,
    availableCountries,
    filteredSpots,
    hasFilter: safeRegion !== null || safeCountry !== null,
    setRegion,
    setCountry,
    clearAll,
  };
}
