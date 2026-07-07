"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useSpotsStore } from "@/stores/spots-store";
import { useWeather } from "@/components/layout/WeatherContext";
import { useSavedSpots } from "@/hooks/useSavedSpots";
import { useUser } from "@/hooks/useUser";
import { useMapFilter } from "@/hooks/useMapFilter";
import { MAP_VIEWPORT_OFFSET_PX } from "@/lib/constants";
import { ROUTES } from "@/lib/nav";
import { MapSidebar } from "./MapSidebar";
import { MapInfoPopup } from "./MapInfoPopup";
import { MapLegend } from "./MapLegend";
import type { Spot } from "@/lib/types";
import type { LeafletCanvasHandle } from "./LeafletCanvas";

const LeafletCanvas = dynamic(
  () => import("./LeafletCanvas").then((m) => m.LeafletCanvas),
  { ssr: false, loading: () => <div className="flex-1 border border-outline-variant bg-surface-container-low animate-pulse" /> },
);

export default function MapTab() {
  const router = useRouter();
  const spots = useSpotsStore((s) => s.spots);
  const user = useUser();
  const { savedIds, toggle: toggleSaved } = useSavedSpots(user.id);
  const { weather } = useWeather();
  const { region, country, filteredSpots } = useMapFilter(spots);
  const [activePin, setActivePin] = useState<Spot | null>(null);
  const leafletRef = useRef<LeafletCanvasHandle | null>(null);

  const handleResetMap = useCallback(() => {
    leafletRef.current?.fitBoundsToSpots();
    setActivePin(null);
  }, []);

  const handlePinToggle = useCallback((spot: Spot) => {
    setActivePin((prev) => (prev?.id === spot.id ? null : spot));
  }, []);

  const handleSidebarSelect = useCallback((spot: Spot) => {
    setActivePin(spot);
    leafletRef.current?.flyTo(spot);
  }, []);

  const openSpot = useCallback(
    (spot: Spot) => router.push(ROUTES.spot(spot.id)),
    [router],
  );

  const gridTitle = region
    ? country
      ? `${country} (${region})`
      : region
    : "Global grid";

  return (
    <section
      id="map-tab"
      role="tabpanel"
      aria-labelledby="nav-btn-map"
      className="flex flex-col lg:flex-row gap-6 pb-24 animate-fade-in min-h-[500px]"
      style={{ height: `calc(100vh - ${MAP_VIEWPORT_OFFSET_PX.DESKTOP}px)` }}
    >
      <h1 className="visually-hidden">Spot Map</h1>

      <MapSidebar
        spots={filteredSpots}
        activeId={activePin?.id ?? null}
        savedIds={savedIds}
        onSelect={handleSidebarSelect}
      />

      <div className="flex-1 flex flex-col">
        <div
          id="map-canvas-container"
          className="flex-1 border border-outline-variant rounded-2xl bg-surface-container-low overflow-hidden relative flex flex-col"
        >
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
            <div className="flex items-center space-x-2 bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-outline-variant shadow-sm pointer-events-auto">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"
              />
              <span className="font-mono text-[10px] font-bold tracking-wider text-on-surface uppercase">
                {gridTitle} Active
              </span>
            </div>

            <div className="flex items-center space-x-1 bg-surface/90 backdrop-blur-md p-1 rounded-lg border border-outline-variant shadow-sm pointer-events-auto">
              <button
                type="button"
                onClick={handleResetMap}
                className="px-2 py-1 text-[9px] font-mono font-bold tracking-wider uppercase text-primary hover:bg-surface-container rounded transition-all"
              >
                Reset view
              </button>
            </div>
          </div>

          <LeafletCanvas
            ref={leafletRef}
            spots={filteredSpots}
            activeId={activePin?.id ?? null}
            onTogglePin={handlePinToggle}
          />
        </div>
        <MapLegend />
      </div>

      {activePin && (
        <MapInfoPopup
          spot={activePin}
          weather={weather}
          isSaved={savedIds.has(activePin.id)}
          onClose={() => setActivePin(null)}
          onOpen={openSpot}
          onToggleSave={toggleSaved}
        />
      )}
    </section>
  );
}
