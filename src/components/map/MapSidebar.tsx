"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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

  //   const handleModeChange = useCallback(
  //     (next: "nearby" | "filtered") => {
  //       selectMode(next);
  //     },
  //     [selectMode],
  //   );

  //   const handleFilteredClick = useCallback(() => {
  //     selectMode("filtered");
  //     openSearch();
  //   }, [selectMode, openSearch]);

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
      <div className="py-2 mx-auto border-b border-outline-variant bg-surface-container-low">
        {hasFilter && filterLabel && !showRadiusChips && (
          <div id="map-active-filter" className="flex items-center gap-2">
            <span className="flex items-center gap-1 border border-secondary px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface">
              <span>{filterLabel}</span>
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
              className="font-mono text-[10px] font-bold tracking-widest text-on-surface uppercase pr-1"
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
                    "px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase border transition-all",
                    active
                      ? "bg-primary text-on-primary border-primary"
                      : "border-outline-variant text-on-surface hover:border-outline",
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
          <div className="p-6 text-center text-xs text-on-surface font-mono space-y-3">
            {hasFilter && filterLabel ? (
              <>
                <p>No spots in {filterLabel}.</p>
                {clearAll && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="font-mono text-xs font-bold tracking-widest uppercase text-primary hover:underline focus-visible:underline"
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
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "shrink-0 lg:shrink w-48 lg:w-full snap-start text-left transition-colors flex items-stretch border",
        isActive
          ? "border-primary bg-surface-container-high"
          : "border-outline-variant/60 bg-surface-container-low hover:border-outline hover:bg-surface-container",
      )}
    >
      <span className="relative h-14 w-14 bg-black overflow-hidden shrink-0">
        <Image
          src={spot.image}
          alt=""
          fill
          sizes="56px"
          className="object-cover"
          referrerPolicy="no-referrer"
          unoptimized
        />
        {isSaved && (
          <span
            aria-hidden="true"
            className="absolute top-0 right-0 h-2 w-2 bg-surface border-l border-b border-outline"
          />
        )}
      </span>

      <span className="flex-1 min-w-0 px-3 py-2 flex flex-col gap-1.5">
        <span className="flex items-center justify-between gap-2 min-w-0">
          {spot.types.length > 0 ? (
            <TypeBadges
              types={spot.types}
              variant="surface"
              className="text-[9px]"
            />
          ) : (
            <span className="font-mono text-[9px] font-bold text-secondary uppercase tracking-widest">
              Spot
            </span>
          )}
          <span className="font-mono text-[9px] font-bold text-secondary uppercase tracking-widest shrink-0">
            {distanceLabel}
          </span>
        </span>
        <span className="block font-display text-xs font-bold tracking-wide uppercase text-on-surface truncate">
          {spot.name}
        </span>
        <span className="flex items-center justify-between gap-2 min-w-0">
          <span className="flex items-center text-[10px] text-secondary min-w-0">
            <MapPin size={10} aria-hidden="true" className="mr-1 shrink-0" />
            <span className="truncate">{spot.city}</span>
          </span>
          <span className="font-mono text-[9px] text-secondary uppercase tracking-widest truncate">
            {spot.sports.join("|")}
          </span>
        </span>
        {isSaved && <span className="visually-hidden">Saved spot</span>}
      </span>
    </button>
  );
});

export const MapSidebar = memo(MapSidebarBase);
