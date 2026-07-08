"use client";

import Image from "next/image";
import { useCallback } from "react";
import { cn } from "@/lib/cn";
import type { Spot } from "@/lib/types";
import type { LatLon } from "@/lib/spots/geo";
import { getSpotDistanceLabel, haversineMiles } from "@/lib/spots/geo";
import {
  NEARBY_RADIUS_OPTIONS,
  type NearbyRadiusMiles,
} from "@/stores/user-location-store";

interface MapSidebarProps {
  spots: readonly Spot[];
  activeId: string | null;
  savedIds: Set<string>;
  onSelect: (spot: Spot) => void;
  userLocation?: LatLon | null;
  radiusMiles?: NearbyRadiusMiles;
  onRadiusChange?: (miles: NearbyRadiusMiles) => void;
}

function withinRadius(
  spot: Spot,
  origin: LatLon,
  radiusMiles: NearbyRadiusMiles,
): boolean {
  return haversineMiles(origin.lat, origin.lon, spot.location.lat, spot.location.lon) <= radiusMiles;
}

export function MapSidebar({
  spots,
  activeId,
  savedIds,
  onSelect,
  userLocation = null,
  radiusMiles,
  onRadiusChange,
}: MapSidebarProps) {
  const showChips =
    userLocation !== null && radiusMiles !== undefined && onRadiusChange !== undefined;

  const visibleSpots = showChips && userLocation && radiusMiles
    ? spots.filter((s) => withinRadius(s, userLocation as LatLon, radiusMiles))
    : spots;

  const handleChipClick = useCallback(
    (miles: NearbyRadiusMiles) => {
      onRadiusChange?.(miles);
    },
    [onRadiusChange],
  );

  return (
    <aside
      id="map-sidebar"
      aria-label="Spot list"
      className="w-full lg:w-80 flex flex-col border border-outline-variant rounded-2xl bg-surface-bright overflow-hidden sm:h-[150px] lg:h-full"
    >
      <div className="p-4 border-b border-outline-variant bg-surface-container-low">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] font-bold tracking-widest text-secondary uppercase">
            Results
          </span>
          <span
            className="bg-primary/10 px-2 py-0.5 text-[9px] font-mono font-semibold text-primary"
            aria-live="polite"
          >
            {visibleSpots.length} spots active
          </span>
        </div>
        {showChips && radiusMiles && (
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
                  onClick={() => handleChipClick(miles)}
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
        className="flex-1 flex flex-row lg:flex-col overflow-x-auto lg:overflow-y-auto p-3 space-x-2 lg:space-x-0 lg:space-y-2 no-scrollbar snap-x lg:snap-none snap-mandatory"
      >
        {visibleSpots.map((spot) => {
          const isHovered = activeId === spot.id;
          const isSaved = savedIds.has(spot.id);
          const distanceOrigin = showChips ? userLocation : null;
          return (
            <button
              key={spot.id}
              id={`sidebar-spot-item-${spot.id}`}
              type="button"
              onClick={() => onSelect(spot)}
              className={`shrink-0 lg:shrink w-48 lg:w-full snap-start p-3 rounded-xl border text-left transition-all flex space-x-3 items-center ${
                isHovered
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
                  className="object-cover grayscale"
                  referrerPolicy="no-referrer"
                  unoptimized
                />
              </span>

              <span className="flex-1 min-w-0">
                <span className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-semibold text-secondary uppercase">
                    {spot.type}
                  </span>
                  <span className="text-[8px] font-mono font-medium text-secondary">
                    {getSpotDistanceLabel(spot, distanceOrigin)}
                  </span>
                </span>
                <span className="block font-display text-xs font-bold uppercase tracking-wide truncate text-on-surface">
                  {spot.name}
                </span>
                <span className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-secondary truncate">{spot.city}</span>
                  <span className="flex items-center space-x-1">
                    <span
                      aria-hidden="true"
                      className="h-1 w-1 rounded-full bg-primary"
                    />
                    <span className="text-[8px] font-mono text-secondary">
                      CRD: {spot.crowdLevel}%
                    </span>
                  </span>
                </span>
                {isSaved && <span className="visually-hidden">Saved spot</span>}
              </span>
            </button>
          );
        })}
        {visibleSpots.length === 0 && (
          <div className="p-6 text-center text-xs text-secondary font-mono">
            {showChips
              ? `No spots within ${radiusMiles} mi — expand the grid.`
              : "No locations match filter"}
          </div>
        )}
      </div>
    </aside>
  );
}
