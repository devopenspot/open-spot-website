"use client";
import { useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useSpotsStore } from "@/stores/spots-store";
import { useMapStore } from "@/stores/map-store";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useMapFilter } from "@/hooks/useMapFilter";
import { useMapActions } from "./use-map-actions";
import { DEFAULT_NEARBY_RADIUS_MI } from "@/stores/user-location-store";
import { MAP_VIEWPORT_OFFSET_PX } from "@/lib/constants";
import { haversineMiles, milesToMeters } from "@/lib/spots/geo";
import { MapSidebar } from "./MapSidebar";
import { MapInfoPopup } from "./MapInfoPopup";
// import { MapHeaderBar } from "./MapHeaderBar";

const LeafletCanvas = dynamic(
  () => import("./LeafletCanvas").then((m) => m.LeafletCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 border border-outline-variant bg-surface-container-low animate-pulse" />
    ),
  },
);

const NEAR_YOU_INITIAL_ZOOM = 10;

interface MapTabProps {
  searchParams: ReadonlyURLSearchParams;
  nearbyRequested: boolean;
}

export default function MapTab({ searchParams, nearbyRequested }: MapTabProps) {
  const spots = useSpotsStore((s) => s.spots);
  const {
    location,
    status,
    radiusMiles,
    setRadiusMiles,
    request: requestLocation,
  } = useUserLocation();
  const { region, country, filteredSpots } = useMapFilter(spots, searchParams);
  const { dismissNearby } = useMapActions();
  const fitRadius = useMapStore((s) => s.fitRadius);
  const fitBoundsToSpots = useMapStore((s) => s.fitBoundsToSpots);

  const userLatLon = useMemo(
    () => (location ? { lat: location.lat, lon: location.lon } : null),
    [location],
  );

  const hasRegionFilter = region !== null || country !== null;
  const nearYou =
    nearbyRequested && status === "granted" && userLatLon !== null;

  const sourceSpots = nearYou ? spots : filteredSpots;

  const orderedSpots = useMemo(() => {
    if (!userLatLon) return sourceSpots;
    const origin = userLatLon;
    return [...sourceSpots].sort(
      (a, b) =>
        haversineMiles(origin.lat, origin.lon, a.location.lat, a.location.lon) -
        haversineMiles(origin.lat, origin.lon, b.location.lat, b.location.lon),
    );
  }, [sourceSpots, userLatLon]);

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

  useEffect(() => {
    useMapStore.getState().setMapMode(nearbyRequested ? "nearby" : "filtered");
  }, [nearbyRequested]);

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

  const hasInitializedNearbyRef = useRef(false);
  useEffect(() => {
    if (!nearbyRequested) return;
    if (hasInitializedNearbyRef.current) return;
    hasInitializedNearbyRef.current = true;
    setRadiusMiles(DEFAULT_NEARBY_RADIUS_MI);
    if (status === "granted" && userLatLon) {
      fitRadius(milesToMeters(DEFAULT_NEARBY_RADIUS_MI));
    }
  }, [nearbyRequested, status, userLatLon, setRadiusMiles, fitRadius]);

  useEffect(() => {
    if (!nearYou || !userLatLon) return;
    fitRadius(milesToMeters(radiusMiles));
  }, [nearYou, userLatLon, radiusMiles, fitRadius]);

  useEffect(() => {
    if (nearYou) return;
    if (hasRegionFilter) {
      fitBoundsToSpots();
    }
  }, [nearYou, hasRegionFilter, region, country, fitBoundsToSpots]);

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
      className="flex flex-col lg:flex-row gap-0 pb-1 animate-fade-in min-h-[500px]"
      style={{ height: `calc(100vh - ${MAP_VIEWPORT_OFFSET_PX.DESKTOP}px)` }}
    >
      <h1 className="visually-hidden">Spot Map</h1>

      <MapSidebar spots={sidebarSpots} />

      <div className="flex-1 flex flex-col">
        <div
          id="map-canvas-container"
          className="flex-1 border border-outline-variant rounded-2xl bg-surface-container-low overflow-hidden relative flex flex-col"
        >
          {/* <MapHeaderBar /> */}

          <LeafletCanvas
            spots={sidebarSpots}
            initialCenter={initialCenter}
            initialZoom={initialZoom}
          />

          <MapInfoPopup />
        </div>
      </div>
    </section>
  );
}
