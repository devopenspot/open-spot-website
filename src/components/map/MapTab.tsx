"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, type ReadonlyURLSearchParams } from "next/navigation";
import { useSpotsStore } from "@/stores/spots-store";
import { useWeather } from "@/components/layout/WeatherContext";
import { useSavedSpots } from "@/hooks/useSavedSpots";
import { useUser } from "@/hooks/useUser";
import { useMapFilter } from "@/hooks/useMapFilter";
import { useUserLocation } from "@/hooks/useUserLocation";
import { MAP_VIEWPORT_OFFSET_PX } from "@/lib/constants";
import { ROUTES } from "@/lib/nav";
import { haversineMiles, milesToMeters } from "@/lib/spots/geo";
import { MapSidebar } from "./MapSidebar";
import { MapInfoPopup } from "./MapInfoPopup";
// import { MapLegend } from "./MapLegend";
import { NearbyControl } from "./NearbyControl";
import type { Spot } from "@/lib/types";
import type { LeafletCanvasHandle } from "./LeafletCanvas";

const LeafletCanvas = dynamic(
  () => import("./LeafletCanvas").then((m) => m.LeafletCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 border border-outline-variant bg-surface-container-low animate-pulse" />
    ),
  },
);

const NEAR_YOU_INITIAL_ZOOM = 12;

interface MapTabProps {
  searchParams: ReadonlyURLSearchParams;
  nearbyRequested: boolean;
}

export default function MapTab({ searchParams, nearbyRequested }: MapTabProps) {
  const router = useRouter();
  const spots = useSpotsStore((s) => s.spots);
  const user = useUser();
  const { savedIds, toggle: toggleSaved } = useSavedSpots(user.id);
  const { weather } = useWeather();
  const { region, country, filteredSpots } = useMapFilter(spots, searchParams);
  const {
    location,
    status,
    radiusMiles,
    setRadiusMiles,
    request: requestLocation,
    clear: clearLocation,
  } = useUserLocation();
  const [activePin, setActivePin] = useState<Spot | null>(null);
  const leafletRef = useRef<LeafletCanvasHandle | null>(null);

  const userLatLon = useMemo(
    () => (location ? { lat: location.lat, lon: location.lon } : null),
    [location],
  );

  const orderedSpots = useMemo(() => {
    if (!userLatLon) return filteredSpots;
    const origin = userLatLon;
    return [...filteredSpots].sort(
      (a, b) =>
        haversineMiles(origin.lat, origin.lon, a.location.lat, a.location.lon) -
        haversineMiles(origin.lat, origin.lon, b.location.lat, b.location.lon),
    );
  }, [filteredSpots, userLatLon]);

  const hasRegionFilter = region !== null || country !== null;
  const nearYou =
    nearbyRequested &&
    status === "granted" &&
    userLatLon !== null &&
    !hasRegionFilter;

  const sidebarSpots = useMemo(() => {
    if (!nearYou || !userLatLon) return orderedSpots;
    const origin = userLatLon;
    return orderedSpots.filter(
      (s) =>
        haversineMiles(
          origin.lat,
          origin.lon,
          s.location.lat,
          s.location.lon,
        ) <= radiusMiles,
    );
  }, [orderedSpots, userLatLon, radiusMiles, nearYou]);

  const dismissNearby = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("nearby");
    const query = params.toString();
    router.replace(query ? `${ROUTES.map}?${query}` : ROUTES.map, {
      scroll: false,
    });
  }, [router, searchParams]);

  useEffect(() => {
    if (!nearbyRequested) return;
    if (status === "granted" || status === "requesting" || status === "denied")
      return;
    void requestLocation();
  }, [nearbyRequested, status, requestLocation]);

  useEffect(() => {
    if (nearbyRequested && (status === "denied" || status === "unavailable")) {
      dismissNearby();
    }
  }, [nearbyRequested, status, dismissNearby]);

  const handleResetMap = useCallback(() => {
    leafletRef.current?.fitBoundsToSpots();
    setActivePin(null);
  }, []);

  const handlePinToggle = useCallback((spot: Spot) => {
    setActivePin((prev) => {
      if (prev?.id === spot.id) return null;
      leafletRef.current?.flyTo(spot);
      return spot;
    });
  }, []);

  const handleSidebarSelect = useCallback((spot: Spot) => {
    setActivePin(spot);
    leafletRef.current?.flyTo(spot);
  }, []);

  const openSpot = useCallback(
    (spot: Spot) => router.push(ROUTES.spot(spot.id)),
    [router],
  );

  const handleReCenter = useCallback(() => {
    leafletRef.current?.fitRadius(milesToMeters(radiusMiles));
  }, [radiusMiles]);

  const handleClearLocation = useCallback(() => {
    clearLocation();
    if (nearbyRequested) dismissNearby();
  }, [clearLocation, nearbyRequested, dismissNearby]);

  const gridTitle = region
    ? country
      ? `${country} (${region})`
      : region
    : "Global grid";

  useEffect(() => {
    if (!nearYou || !userLatLon) return;
    leafletRef.current?.fitRadius(milesToMeters(radiusMiles));
  }, [nearYou, userLatLon, radiusMiles]);

  useEffect(() => {
    if (nearYou) return;
    if (hasRegionFilter) {
      leafletRef.current?.fitBoundsToSpots();
    }
  }, [nearYou, hasRegionFilter, region, country]);

  const initialCenter: [number, number] =
    nearYou && userLatLon
      ? [userLatLon.lat, userLatLon.lon]
      : sidebarSpots[0]
        ? [sidebarSpots[0].location.lat, sidebarSpots[0].location.lon]
        : [20, 0];
  const initialZoom = nearYou ? NEAR_YOU_INITIAL_ZOOM : 2;

  return (
    <section
      id="map-tab"
      role="tabpanel"
      aria-labelledby="nav-btn-map"
      className="flex flex-col lg:flex-row gap-4 pb-8 md:pb-12 animate-fade-in min-h-[500px]"
      style={{ height: `calc(100vh - ${MAP_VIEWPORT_OFFSET_PX.DESKTOP}px)` }}
    >
      <h1 className="visually-hidden">Spot Map</h1>

      <MapSidebar
        spots={sidebarSpots}
        activeId={activePin?.id ?? null}
        savedIds={savedIds}
        onSelect={handleSidebarSelect}
        userLocation={userLatLon}
        radiusMiles={nearYou ? radiusMiles : undefined}
        onRadiusChange={nearYou ? setRadiusMiles : undefined}
        showRadiusChips={nearYou}
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
                className={`h-2 w-2 rounded-full ${nearYou ? "bg-primary" : "bg-emerald-500 animate-ping"}`}
              />
              <span className="font-mono text-[10px] font-bold tracking-wider text-on-surface uppercase">
                {nearYou ? `Near you · ${gridTitle}` : `${gridTitle} Active`}
              </span>
            </div>

            <div className="flex items-center space-x-1 pointer-events-auto">
              <NearbyControl
                onReCenter={handleReCenter}
                onClear={handleClearLocation}
                active={nearbyRequested}
              />
              <div className="flex items-center space-x-1 bg-surface/90 backdrop-blur-md p-1 rounded-lg border border-outline-variant shadow-sm">
                <button
                  type="button"
                  onClick={handleResetMap}
                  className="px-2 py-1 text-[9px] font-mono font-bold tracking-wider uppercase text-primary hover:bg-surface-container rounded transition-all"
                >
                  Reset view
                </button>
              </div>
            </div>
          </div>

          <LeafletCanvas
            ref={leafletRef}
            spots={sidebarSpots}
            activeId={activePin?.id ?? null}
            savedIds={savedIds}
            weather={weather}
            onTogglePin={handlePinToggle}
            userLocation={location}
            radiusMeters={milesToMeters(radiusMiles)}
            initialCenter={initialCenter}
            initialZoom={initialZoom}
          />

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
        </div>
        {/* <MapLegend /> */}
      </div>
    </section>
  );
}
