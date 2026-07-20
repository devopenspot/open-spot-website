"use client";

import { useCallback } from "react";

import { MapPin, SlidersHorizontal } from "lucide-react";
import { useMapStore } from "@/stores/map-store";
import { useMapActions } from "@/components/map/use-map-actions";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/cn";

export function SwitchFilteredNearby() {
  const mapMode = useMapStore((s) => s.mapMode);
  const { selectMode } = useMapActions();
  const openSearch = useUIStore((s) => s.openSearch);
  const handleFilteredClick = useCallback(() => {
    selectMode("filtered");
    openSearch();
  }, [selectMode, openSearch]);

  const handleModeChange = useCallback(
    (next: "nearby" | "filtered") => {
      selectMode(next);
    },
    [selectMode],
  );
  return (
    <div
      id="map-mode-switcher"
      role="radiogroup"
      aria-label="Map mode"
      className="flex items-stretch border border-outline-variant w-1/2 mx-2"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mapMode === "filtered"}
        onClick={handleFilteredClick}
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
  );
}
