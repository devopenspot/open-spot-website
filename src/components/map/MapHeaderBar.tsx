"use client";

import { memo } from "react";
import { useSearchParams } from "next/navigation";
import { useSpotsStore } from "@/stores/spots-store";
import { useMapStore } from "@/stores/map-store";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useMapFilter } from "@/hooks/useMapFilter";
import { useMapActions } from "./use-map-actions";
import { NearbyControl } from "./NearbyControl";

function MapHeaderBarBase() {
  const fullSpots = useSpotsStore((s) => s.spots);
  const mapMode = useMapStore((s) => s.mapMode);
  const { status, location } = useUserLocation();
  const { resetView } = useMapActions();
  const searchParams = useSearchParams();
  const { region, country } = useMapFilter(fullSpots, searchParams);

  const nearYou =
    mapMode === "nearby" && status === "granted" && location !== null;

  const gridTitle = region
    ? country
      ? `${country} (${region})`
      : region
    : "Global grid";

  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
      <div className="flex items-center space-x-2 bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-outline-variant shadow-sm pointer-events-auto">
        <span
          aria-hidden="true"
          className={`h-2 w-2 rounded-full ${nearYou ? "bg-primary" : "bg-emerald-500 animate-ping"}`}
        />
        <span className="font-mono text-[10px] font-bold tracking-wider text-on-surface uppercase">
          {nearYou ? `Near you · ${gridTitle}` : `${gridTitle} Active`}
        </span>
      </div>

      <div className="flex items-center space-x-1 pointer-events-auto">
        <NearbyControl />
        <div className="flex items-center space-x-1 bg-surface/90 backdrop-blur-md p-1 rounded-lg border border-outline-variant shadow-sm">
          <button
            type="button"
            onClick={resetView}
            className="px-2 py-1 text-[9px] font-mono font-bold tracking-wider uppercase text-primary hover:bg-surface-container rounded transition-all"
          >
            Reset view
          </button>
        </div>
      </div>
    </div>
  );
}

export const MapHeaderBar = memo(MapHeaderBarBase);
