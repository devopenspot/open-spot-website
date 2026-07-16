"use client";

import Image from "next/image";
import { useCallback } from "react";
import { MapPin, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Spot } from "@/lib/types";
import type { LatLon } from "@/lib/spots/geo";
import { getSpotDistanceInfo } from "@/lib/spots/geo";
import {
  NEARBY_RADIUS_OPTIONS,
  type NearbyRadiusMiles,
} from "@/stores/user-location-store";

export type MapMode = "nearby" | "filtered";

interface MapSidebarProps {
  spots: readonly Spot[];
  activeId: string | null;
  savedIds: Set<string>;
  onSelect: (spot: Spot) => void;
  userLocation?: LatLon | null;
  radiusMiles?: NearbyRadiusMiles;
  onRadiusChange?: (miles: NearbyRadiusMiles) => void;
  showRadiusChips?: boolean;
  region?: string | null;
  country?: string | null;
  onClearFilter?: () => void;
  mode: MapMode;
  onSelectMode: (mode: MapMode) => void;
}

export function MapSidebar({
  spots,
  activeId,
  savedIds,
  onSelect,
  userLocation = null,
  radiusMiles,
  onRadiusChange,
  showRadiusChips = true,
  region = null,
  country = null,
  onClearFilter,
  mode,
  onSelectMode,
}: MapSidebarProps) {
  const showChips =
    showRadiusChips &&
    userLocation !== null &&
    radiusMiles !== undefined &&
    onRadiusChange !== undefined;

  const hasFilter = region !== null || country !== null;
  const filterLabel = country ? `${country} (${region})` : region;

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
        <div
          id="map-mode-switcher"
          role="radiogroup"
          aria-label="Map mode"
          className="flex items-stretch border border-outline-variant mb-3"
        >
          <button
            type="button"
            role="radio"
            aria-checked={mode === "filtered"}
            onClick={() => onSelectMode("filtered")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[9px] font-mono font-bold tracking-wider uppercase transition-all",
              mode === "filtered"
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
            aria-checked={mode === "nearby"}
            onClick={() => onSelectMode("nearby")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[9px] font-mono font-bold tracking-wider uppercase transition-all border-l border-outline-variant",
              mode === "nearby"
                ? "bg-primary text-on-primary"
                : "text-secondary hover:text-on-surface hover:bg-surface-container",
            )}
          >
            <MapPin size={11} aria-hidden="true" />
            <span>Nearby</span>
          </button>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] font-bold tracking-widest text-secondary uppercase">
            Results
          </span>
          <span
            className="bg-primary/10 px-2 py-0.5 text-[9px] font-mono font-semibold text-primary"
            aria-live="polite"
          >
            {spots.length} spots active
          </span>
        </div>
        {hasFilter && filterLabel && !radiusMiles && (
          <div id="map-active-filter" className="flex items-center gap-2">
            <span className="font-mono text-[9px] font-bold tracking-widest uppercase text-secondary">
              Filter
            </span>
            <span className="flex items-center gap-1 border border-primary px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-primary">
              <span>{filterLabel}</span>
              {onClearFilter && (
                <button
                  type="button"
                  onClick={onClearFilter}
                  aria-label="Clear region and country filter"
                  className="ml-0.5 -mr-1 p-0.5 hover:bg-primary hover:text-on-primary focus-visible:bg-primary focus-visible:text-on-primary"
                >
                  <X size={10} aria-hidden="true" />
                </button>
              )}
            </span>
          </div>
        )}
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
        {spots.map((spot) => {
          const isHovered = activeId === spot.id;
          const isSaved = savedIds.has(spot.id);
          const distanceOrigin = showChips ? userLocation : null;
          const distanceInfo = getSpotDistanceInfo(spot, distanceOrigin);
          const distanceLabel =
            distanceInfo.kind === "distance" ? distanceInfo.label : "—";
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
                  className="object-cover"
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
                    {distanceLabel}
                  </span>
                </span>
                <span className="block font-display text-xs font-bold uppercase tracking-wide truncate text-on-surface">
                  {spot.name}
                </span>
                <span className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-secondary truncate">
                    {spot.city}
                  </span>
                  <span className="flex items-center space-x-1">
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
        })}
        {spots.length === 0 && (
          <div className="p-6 text-center text-xs text-secondary font-mono space-y-3">
            {hasFilter && filterLabel ? (
              <>
                <p>No spots in {filterLabel}.</p>
                {onClearFilter && (
                  <button
                    type="button"
                    onClick={onClearFilter}
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
