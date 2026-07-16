"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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
  filteredSpots: readonly Spot[];
  hasFilter: boolean;
  setRegion: (name: string | null) => void;
  setCountry: (name: string | null) => void;
  clearAll: () => void;
  /**
   * Flush the pending selection to the URL via the configured `targetPath`.
   * No-op when `defer` is false, or when no pending changes exist.
   */
  commit: () => void;
  /** Discard any pending selection without touching the URL. */
  cancelPending: () => void;
  /** True while a deferred selection is staged but not yet committed. */
  hasPending: boolean;
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
  /**
   * When true, setters stage the change in a local `pending` state instead
   * of writing to the URL. Reads (`region`, `country`, `availableCountries`,
   * `filteredSpots`) reflect the pending values when present, falling back
   * to the URL otherwise. Call `commit()` to flush pending to the URL, or
   * `cancelPending()` to discard. Default `false` (write through).
   */
  defer?: boolean;
}

interface PendingSelection {
  region: string | null;
  country: string | null;
}

export function useMapFilter(
  spots: readonly Spot[],
  searchParams: ReadonlyURLSearchParams,
  options: UseMapFilterOptions = {},
): MapFilter {
  const router = useRouter();
  const pathname = usePathname();
  const { targetPath, defer = false } = options;
  const regions = useSpotsStore((s) => s.regions);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const pendingRef = useRef<PendingSelection | null>(null);

  const stage = useCallback((next: PendingSelection | null) => {
    pendingRef.current = next;
    setPending(next);
  }, []);

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

  const regionFromUrl = regionSlug ? slugs.regionSlugToName.get(regionSlug) ?? null : null;
  const countryFromUrl = countrySlug
    ? slugs.countrySlugToName.get(countrySlug) ?? null
    : null;

  const safeRegionFromUrl =
    regionFromUrl && validRegionNames.has(regionFromUrl) ? regionFromUrl : null;
  const safeCountryFromUrl =
    countryFromUrl && validCountryNames.has(countryFromUrl) ? countryFromUrl : null;

  const region = defer && pending ? pending.region : safeRegionFromUrl;
  const country = defer && pending ? pending.country : safeCountryFromUrl;

  const availableCountries = useMemo(() => {
    if (!region) {
      return regions.flatMap((r) => r.countries);
    }
    return regions.find((r) => r.name === region)?.countries ?? [];
  }, [region, regions]);

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
        if (defer) {
          stage({ region: null, country: null });
          return;
        }
        writeQuery({ region: null, country: null });
        return;
      }
      if (!validRegionNames.has(name)) return;
      const regionEntry = regions.find((r) => r.name === name);
      const nextCountry =
        country && regionEntry && !regionEntry.countries.includes(country)
          ? null
          : country;
      if (defer) {
        stage({ region: name, country: nextCountry });
        return;
      }
      writeQuery({ region: name, country: nextCountry });
    },
    [country, defer, regions, stage, validRegionNames, writeQuery],
  );

  const setCountry = useCallback(
    (name: string | null) => {
      if (name === null) {
        if (defer) {
          stage({ region, country: null });
          return;
        }
        writeQuery({ region, country: null });
        return;
      }
      if (!validCountryNames.has(name)) return;
      if (defer) {
        stage({ region, country: name });
        return;
      }
      writeQuery({ region, country: name });
    },
    [defer, region, stage, validCountryNames, writeQuery],
  );

  const clearAll = useCallback(() => {
    if (defer) {
      stage({ region: null, country: null });
      return;
    }
    writeQuery({ region: null, country: null });
  }, [defer, stage, writeQuery]);

  const commit = useCallback(() => {
    if (!defer) return;
    const next = pendingRef.current;
    if (!next) return;
    writeQuery(next);
    pendingRef.current = null;
    setPending(null);
  }, [defer, writeQuery]);

  const cancelPending = useCallback(() => {
    if (!defer) return;
    pendingRef.current = null;
    setPending(null);
  }, [defer]);

  const filteredSpots = useMemo(() => {
    if (!region) return spots.slice();
    return spots.filter((spot) => {
      const regionEntry = regions.find((r) => r.countries.includes(spot.country));
      if (regionEntry?.name !== region) return false;
      if (country && spot.country !== country) return false;
      return true;
    });
  }, [spots, region, country, regions]);

  return {
    region,
    country,
    availableCountries,
    filteredSpots,
    hasFilter: region !== null || country !== null,
    setRegion,
    setCountry,
    clearAll,
    commit,
    cancelPending,
    hasPending: defer && pending !== null,
  };
}
