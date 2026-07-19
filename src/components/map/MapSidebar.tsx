"use client";

import Image from "next/image";
import { memo, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { MapPin, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSpotsStore } from "@/stores/spots-store";
import { useMapStore } from "@/stores/map-store";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useSavedSpots } from "@/hooks/useSavedSpots";
import { useUser } from "@/hooks/useUser";
import { useMapFilter } from "@/hooks/useMapFilter";
import {
  NEARBY_RADIUS_OPTIONS,
  type NearbyRadiusMiles,
} from "@/stores/user-location-store";
import { useMapActions } from "./use-map-actions";
import type { Spot } from "@/lib/types";
import { getSpotDistanceInfo, haversineMiles } from "@/lib/spots/geo";
import { TypeBadges } from "@/components/spot/TypeBadges";

interface MapSidebarProps {
  spots: readonly Spot[];
}

function MapSidebarBase({ spots }: MapSidebarProps) {
  const fullSpots = useSpotsStore((s) => s.spots);
  const activeId = useMapStore((s) => s.activePinId);
  const mapMode = useMapStore((s) => s.mapMode);
  const setActivePin = useMapStore((s) => s.setActivePin);
  const flyToSpot = useMapStore((s) => s.flyToSpot);
  const user = useUser();
  const { savedIds } = useSavedSpots(user?.id ?? null);
  const {
    location: userLocation,
    radiusMiles,
    setRadiusMiles,
  } = useUserLocation();
  const { selectMode } = useMapActions();
  const searchParams = useSearchParams();
  const { region, country, clearAll } = useMapFilter(fullSpots, searchParams);

  const showRadiusChips = mapMode === "nearby";
  const showChips = showRadiusChips && userLocation !== null;

  const hasFilter = region !== null || country !== null;
  const filterLabel = country ? `${country} (${region})` : region;

  const handleRadiusChip = useCallback(
    (miles: NearbyRadiusMiles) => {
      setRadiusMiles(miles);
    },
    [setRadiusMiles],
  );

  const handleSelect = useCallback(
    (spot: Spot) => {
      setActivePin(spot.id);
      flyToSpot(spot);
    },
    [setActivePin, flyToSpot],
  );

  const handleModeChange = useCallback(
    (next: "nearby" | "filtered") => {
      selectMode(next);
    },
    [selectMode],
  );

  const distanceOrigin = showChips ? userLocation : null;

  const sortedSpots = useMemo(() => {
    if (distanceOrigin === null) return spots;
    const origin = distanceOrigin;
    return [...spots].sort(
      (a, b) =>
        haversineMiles(origin.lat, origin.lon, a.location.lat, a.location.lon) -
        haversineMiles(origin.lat, origin.lon, b.location.lat, b.location.lon),
    );
  }, [spots, distanceOrigin]);

  return (
    <aside
      id="map-sidebar"
      aria-label="Spot list"
      className="w-full lg:w-80 flex flex-col border border-outline-variant rounded-2xl bg-surface-bright overflow-hidden sm:h-[150px] lg:h-full"
    >
      <div className="p-4 border-b border-outline-variant bg-surface-container-low">
        <div
          id="map-mode-switcher"
          role="radiogroup"
          aria-label="Map mode"
          className="flex items-stretch border border-outline-variant mb-3"
        >
          <button
            type="button"
            role="radio"
            aria-checked={mapMode === "filtered"}
            onClick={() => handleModeChange("filtered")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[9px] font-mono font-bold tracking-wider uppercase transition-all",
              mapMode === "filtered"
                ? "bg-primary text-on-primary"
                : "text-secondary hover:text-on-surface hover:bg-surface-container",
            )}
          >
            <SlidersHorizontal size={11} aria-hidden="true" />
            <span>Filtered</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mapMode === "nearby"}
            onClick={() => handleModeChange("nearby")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[9px] font-mono font-bold tracking-wider uppercase transition-all border-l border-outline-variant",
              mapMode === "nearby"
                ? "bg-primary text-on-primary"
                : "text-secondary hover:text-on-surface hover:bg-surface-container",
            )}
          >
            <MapPin size={11} aria-hidden="true" />
            <span>Nearby</span>
          </button>
        </div>
        {/* <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] font-bold tracking-widest text-secondary uppercase">
            Results
          </span>
          <span
            className="bg-primary/10 px-2 py-0.5 text-[9px] font-mono font-semibold text-primary"
            aria-live="polite"
          >
            {spots.length} spots active
          </span>
        </div> */}
        {hasFilter && filterLabel && !showRadiusChips && (
          <div id="map-active-filter" className="flex items-center gap-2">
            <span className="font-mono text-[9px] font-bold tracking-widest uppercase text-secondary">
              Filter
            </span>
            <span className="flex items-center gap-1 border border-primary px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-primary">
              <span>{filterLabel}</span>
              {clearAll && (
                <button
                  type="button"
                  onClick={clearAll}
                  aria-label="Clear region and country filter"
                  className="ml-0.5 -mr-1 p-0.5 hover:bg-primary hover:text-on-primary focus-visible:bg-primary focus-visible:text-on-primary"
                >
                  <X size={10} aria-hidden="true" />
                </button>
              )}
            </span>
          </div>
        )}
        {showChips && (
          <div
            id="map-radius-chips"
            role="radiogroup"
            aria-label="Nearby radius in miles"
            className="flex items-center space-x-1"
          >
            <span
              aria-hidden="true"
              className="font-mono text-[9px] font-bold tracking-widest text-secondary uppercase pr-1"
            >
              Radius
            </span>
            {NEARBY_RADIUS_OPTIONS.map((miles) => {
              const active = miles === radiusMiles;
              return (
                <button
                  key={miles}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => handleRadiusChip(miles)}
                  className={cn(
                    "px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider uppercase border transition-all",
                    active
                      ? "bg-primary text-on-primary border-primary"
                      : "border-outline-variant text-secondary hover:border-outline hover:text-on-surface",
                  )}
                >
                  {miles} mi
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div
        id="sidebar-spots-list"
        aria-label="Filtered spots"
        className="ml-1 md:ml-0 flex-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-y-auto space-x-1 lg:space-x-0 lg:space-y-2 no-scrollbar snap-x lg:snap-none snap-mandatory"
      >
        <div className="hidden md:flex flex-col">
          {sortedSpots.map((spot) => (
            <SidebarSpotItem
              key={spot.id}
              spot={spot}
              isActive={activeId === spot.id}
              isSaved={savedIds.has(spot.id)}
              distanceOrigin={distanceOrigin}
              onSelect={handleSelect}
            />
          ))}
        </div>
        {spots.length === 0 && (
          <div className="p-6 text-center text-xs text-secondary font-mono space-y-3">
            {hasFilter && filterLabel ? (
              <>
                <p>No spots in {filterLabel}.</p>
                {clearAll && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="font-mono text-[10px] font-bold tracking-widest uppercase text-primary hover:underline focus-visible:underline"
                  >
                    Clear filter
                  </button>
                )}
              </>
            ) : showChips ? (
              `No spots within ${radiusMiles} mi — expand the grid.`
            ) : (
              "No locations match filter"
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

interface SidebarSpotItemProps {
  spot: Spot;
  isActive: boolean;
  isSaved: boolean;
  distanceOrigin: { lat: number; lon: number } | null;
  onSelect: (spot: Spot) => void;
}

const SidebarSpotItem = memo(function SidebarSpotItem({
  spot,
  isActive,
  isSaved,
  distanceOrigin,
  onSelect,
}: SidebarSpotItemProps) {
  const distanceInfo = getSpotDistanceInfo(spot, distanceOrigin);
  const distanceLabel =
    distanceInfo.kind === "distance" ? distanceInfo.label : "—";

  const handleClick = useCallback(() => onSelect(spot), [onSelect, spot]);

  return (
    <button
      id={`sidebar-spot-item-${spot.id}`}
      type="button"
      onClick={handleClick}
      className={`shrink-0 lg:shrink w-48 lg:w-full snap-start p-3 rounded-xl border text-left transition-all flex space-x-3 items-center ${
        isActive
          ? "border-primary bg-surface-container-high shadow-sm"
          : "border-outline-variant/60 bg-surface-container-low hover:border-outline hover:bg-surface-container"
      }`}
    >
      <span className="relative h-12 w-12 rounded-lg bg-black overflow-hidden shrink-0">
        <Image
          src={spot.image}
          alt=""
          fill
          sizes="48px"
          className="object-cover"
          referrerPolicy="no-referrer"
          unoptimized
        />
      </span>

      <span className="flex-1 min-w-0">
        <span className="flex flex-col md:flex-row items-start justify-between">
          {spot.types.length > 0 ? (
            <TypeBadges
              types={spot.types}
              variant="surface"
              className="text-[8px]"
            />
          ) : null}
          <span className="text-[8px] font-mono font-medium text-secondary">
            {distanceLabel}
          </span>
        </span>
        <span className="block font-display text-xs font-bold uppercase tracking-wide truncate text-on-surface">
          {spot.name}
        </span>
        <span className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-secondary">{spot.city}</span>
          <span className="flex items-center space-x-1 truncate">
            <span
              aria-hidden="true"
              className="h-1 w-1 rounded-full bg-primary"
            />
            <span className="text-[8px] font-mono text-secondary">
              {spot.sports.join("|")}
            </span>
          </span>
        </span>
        {isSaved && <span className="visually-hidden">Saved spot</span>}
      </span>
    </button>
  );
});

export const MapSidebar = memo(MapSidebarBase);
