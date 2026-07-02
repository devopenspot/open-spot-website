"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useSpotsStore } from "@/stores/spots-store";
import { useWeather } from "@/components/layout/WeatherContext";
import { useSavedSpots } from "@/hooks/useSavedSpots";
import { useUser } from "@/hooks/useUser";
import { useMapFilter } from "@/hooks/useMapFilter";
import { MAP_VIEWPORT_OFFSET_PX, MAP_ZOOM } from "@/lib/constants";
import { ROUTES } from "@/lib/nav";
import { getSpotGridCoordinates } from "@/lib/spots/geo";
import { MapCanvas } from "./MapCanvas";
import { MapSidebar } from "./MapSidebar";
import { MapInfoPopup } from "./MapInfoPopup";
import { MapLegend } from "./MapLegend";
import type { Spot } from "@/lib/types";

export default function MapTab() {
  const router = useRouter();
  const spots = useSpotsStore((s) => s.spots);
  const user = useUser();
  const { savedIds, toggle: toggleSaved } = useSavedSpots(user.id);
  const { weather } = useWeather();
  const { region, country, filteredSpots } = useMapFilter(spots);
  const [activePin, setActivePin] = useState<Spot | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [mapPan, setMapPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleZoom = useCallback((direction: "in" | "out") => {
    setZoomLevel((prev) => {
      const next = direction === "in" ? prev + MAP_ZOOM.STEP : prev - MAP_ZOOM.STEP;
      return Math.max(MAP_ZOOM.MIN, Math.min(MAP_ZOOM.MAX, next));
    });
  }, []);

  const handleResetMap = useCallback(() => {
    setZoomLevel(1);
    setMapPan({ x: 0, y: 0 });
    setActivePin(null);
  }, []);

  const handlePinToggle = useCallback((spot: Spot) => {
    setActivePin((prev) => (prev?.id === spot.id ? null : spot));
  }, []);

  const handleSidebarSelect = useCallback(
    (spot: Spot) => {
      setActivePin(spot);
      const coords = getSpotGridCoordinates(spot);
      setMapPan({
        x: (50 - coords.x) * 2 * zoomLevel,
        y: (50 - coords.y) * 2 * zoomLevel,
      });
    },
    [zoomLevel],
  );

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
        <MapCanvas
          spots={filteredSpots}
          activeId={activePin?.id ?? null}
          gridTitle={gridTitle}
          zoomLevel={zoomLevel}
          mapPan={mapPan}
          onZoom={handleZoom}
          onReset={handleResetMap}
          onTogglePin={handlePinToggle}
        />
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