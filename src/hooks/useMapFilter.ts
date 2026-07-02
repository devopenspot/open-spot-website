import { useMemo } from "react";
import { useMapFilterStore } from "@/stores/map-filter-store";
import { getRegions } from "@/lib/spots";
import { COUNTRY_TO_REGION } from "@/data";
import type { Spot } from "@/lib/types";

const DEFAULT_REGION = "Americas";

function deriveRegion(spot: Spot): string {
  return COUNTRY_TO_REGION[spot.country] ?? DEFAULT_REGION;
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

export function useMapFilter(spots: readonly Spot[]): MapFilter {
  const region = useMapFilterStore((s) => s.region);
  const country = useMapFilterStore((s) => s.country);
  const setRegionState = useMapFilterStore((s) => s.setRegion);
  const setCountry = useMapFilterStore((s) => s.setCountry);
  const clearMapFilter = useMapFilterStore((s) => s.clearMapFilter);
  const regions = useMemo(() => getRegions(), []);

  const availableCountries = useMemo(() => {
    if (!region) {
      return regions.flatMap((r) => r.countries);
    }
    return regions.find((r) => r.name === region)?.countries ?? [];
  }, [region, regions]);

  const setRegion = useMemo(() => {
    return (name: string | null) => {
      setRegionState(name);
      if (name === null) {
        setCountry(null);
        return;
      }
      const next = regions.find((r) => r.name === name);
      if (!next) return;
      if (country && !next.countries.includes(country)) setCountry(null);
    };
  }, [setRegionState, setCountry, regions, country]);

  const filteredSpots = useMemo(() => {
    if (!region) return spots.slice();
    return spots.filter((spot) => {
      if (deriveRegion(spot) !== region) return false;
      if (country && spot.country !== country) return false;
      return true;
    });
  }, [spots, region, country]);

  return {
    region,
    country,
    availableCountries,
    filteredSpots,
    hasFilter: region !== null || country !== null,
    setRegion,
    setCountry,
    clearAll: clearMapFilter,
  };
}
