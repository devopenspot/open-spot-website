"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Search, X, MapPin, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Overlay } from "@/components/feedback/Overlay";
import { SEARCH_FOCUS_DELAY_MS } from "@/lib/constants";
import { ROUTES } from "@/lib/nav";
import { useUIStore } from "@/stores/ui-store";
import { useSpotsStore } from "@/stores/spots-store";
import { useUserLocation } from "@/hooks/useUserLocation";
import { getSpotDistanceInfo } from "@/lib/spots/geo";
import type { Spot } from "@/lib/types";
import { RegionFilter } from "@/components/search/RegionFilter";
import { useMapFilter } from "@/hooks/useMapFilter";
import { TypeBadges } from "@/components/spot/TypeBadges";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  spots: readonly Spot[];
  onSelectSpot: (spot: Spot) => void;
}

export function SearchOverlay({
  isOpen,
  onClose,
  spots,
  onSelectSpot,
}: SearchOverlayProps) {
  const titleId = useId();
  const inputId = useId();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const openSearch = useUIStore((s) => s.openSearch);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const regions = useSpotsStore((s) => s.regions);
  const { location: userLocation } = useUserLocation();

  const getDistanceLabel = useCallback(
    (spot: Spot) => {
      const info = getSpotDistanceInfo(
        spot,
        userLocation ? { lat: userLocation.lat, lon: userLocation.lon } : null,
      );
      return info.kind === "distance" ? info.label : "—";
    },
    [userLocation],
  );

  const {
    region,
    country,
    availableCountries,
    filteredSpots,
    setRegion,
    setCountry,
    clearAll,
    commit,
    cancelPending,
  } = useMapFilter(spots, searchParams, {
    targetPath: ROUTES.map,
    defer: true,
  });

  useEffect(() => {
    if (isOpen) {
      const id = window.setTimeout(
        () => inputRef.current?.focus(),
        SEARCH_FOCUS_DELAY_MS,
      );
      return () => window.clearTimeout(id);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) openSearch();
  }, [isOpen, openSearch]);

  const searchRegionName = searchParams.get("searchRegion");
  useEffect(() => {
    if (!isOpen) return;
    if (!searchRegionName) return;
    if (!regions.some((r) => r.name === searchRegionName)) return;
    setRegion(searchRegionName);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("searchRegion");
    const cleaned = params.toString();
    router.replace(cleaned ? `${pathname}?${cleaned}` : pathname, {
      scroll: false,
    });
  }, [
    isOpen,
    searchRegionName,
    regions,
    setRegion,
    searchParams,
    router,
    pathname,
  ]);

  const handleClose = () => {
    cancelPending();
    onClose();
  };

  const handlePick = (spot: Spot) => {
    onSelectSpot(spot);
    onClose();
  };

  const inQueryMode = deferredQuery.trim() !== "";
  const stepLabel = inQueryMode
    ? "Search"
    : region
      ? `Step 02 · ${region}`
      : "Step 01 · Regions";

  return (
    <Overlay
      isOpen={isOpen}
      onClose={handleClose}
      labelledBy={titleId}
      flush
      containerClassName="bg-surface-bright"
      panelClassName="bg-surface-bright overflow-y-auto"
    >
      <div className="mx-auto w-full max-w-3xl p-4 md:p-8">
        <div className="flex items-center justify-between border-b border-outline pb-4 mb-6 gap-4">
          <h2 id={titleId} className="visually-hidden">
            Search spots
          </h2>
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <label htmlFor={inputId} className="visually-hidden">
              Search spots by name, city, or style
            </label>
            <Search
              size={20}
              className="text-secondary shrink-0"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              id={inputId}
              type="search"
              role="searchbox"
              autoComplete="off"
              placeholder="Search spots by name, city, or style..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-lg font-medium text-on-surface focus:outline-none placeholder:text-secondary"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="text-secondary hover:text-on-surface"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              aria-hidden="true"
              className="hidden md:inline font-mono text-[9px] font-bold tracking-widest uppercase text-secondary"
            >
              {stepLabel}
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-10 items-center space-x-1 px-4 border border-outline text-xs font-bold tracking-widest uppercase hover:bg-primary hover:text-surface focus-visible:bg-primary focus-visible:text-surface transition-colors"
            >
              <span>Close</span>
              <kbd
                aria-hidden="true"
                className="hidden md:inline px-1 py-0.5 text-[9px] font-mono opacity-70"
              >
                ESC
              </kbd>
            </button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-3xl flex-1">
          {inQueryMode ? (
            <MatchedSpots
              query={deferredQuery}
              spots={filteredSpots}
              onPick={handlePick}
              distanceLabel={getDistanceLabel}
            />
          ) : (
            <RegionFilter
              region={region}
              country={country}
              availableCountries={availableCountries}
              hasFilter={region !== null || country !== null}
              setRegion={setRegion}
              setCountry={setCountry}
              clearAll={clearAll}
              onAfterChange={handleClose}
              onCommit={commit}
              allSpots={spots}
            />
          )}
        </div>
      </div>
    </Overlay>
  );
}

interface MatchedSpotsProps {
  query: string;
  spots: readonly Spot[];
  onPick: (spot: Spot) => void;
  distanceLabel: (spot: Spot) => string;
}

function MatchedSpots({
  query,
  spots,
  onPick,
  distanceLabel,
}: MatchedSpotsProps) {
  return (
    <div className="space-y-4">
      <h3
        aria-live="polite"
        aria-atomic="true"
        className="font-mono text-[10px] font-bold tracking-widest text-secondary uppercase mb-2"
      >
        Matched codes ({spots.length})
      </h3>

      {spots.length > 0 ? (
        <ul className="space-y-3" aria-label="Matched spots">
          {spots.map((spot) => (
            <li key={spot.id}>
              <button
                type="button"
                onClick={() => onPick(spot)}
                className="w-full p-4 border border-outline-variant bg-surface hover:border-primary hover:bg-primary hover:text-surface focus-visible:border-primary focus-visible:bg-primary focus-visible:text-surface flex space-x-4 items-center transition-colors text-left"
              >
                <span className="relative h-16 w-16 bg-black overflow-hidden shrink-0">
                  <Image
                    src={spot.image}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                    unoptimized
                  />
                </span>

                <span className="flex-1 min-w-0">
                  <span className="flex items-center justify-between text-[9px] font-mono text-current opacity-70 mb-0.5">
                    {spot.types.length > 0 ? (
                      <TypeBadges
                        types={spot.types}
                        variant="surface"
                        className="text-[8px]"
                      />
                    ) : null}
                    <span>{distanceLabel(spot)}</span>
                  </span>
                  <span className="block font-display text-sm font-bold tracking-wide uppercase truncate">
                    {spot.name}
                  </span>
                  <span className="text-xs flex items-center mt-1 opacity-80">
                    <MapPin
                      size={11}
                      className="mr-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    {spot.city}
                  </span>
                </span>

                <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-12 text-center text-xs font-mono text-secondary border border-dashed border-outline-variant">
          No plots detected for &ldquo;
          {query.toUpperCase()}&rdquo;
        </div>
      )}
    </div>
  );
}
