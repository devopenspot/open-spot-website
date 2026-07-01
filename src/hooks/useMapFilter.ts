import { useMemo } from "react";
import { useAppState } from "@/components/layout/AppStateProvider";
import { getRegions } from "@/lib/spots";
import type { Spot } from "@/lib/types";

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
  const { region, country, setRegion, setCountry, clearMapFilter } = useAppState();
  const regions = useMemo(() => getRegions(), []);

  const availableCountries = useMemo(() => {
    if (!region) {
      return regions.flatMap((r) => r.countries);
    }
    return regions.find((r) => r.name === region)?.countries ?? [];
  }, [region, regions]);

  const filteredSpots = useMemo(() => {
    if (!region) return spots.slice();
    return spots.filter((spot) => {
      if (spot.region !== region) return false;
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
