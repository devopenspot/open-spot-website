"use client";

import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvent,
} from "react-leaflet";
import L from "leaflet";
import type { Spot } from "@/lib/types";
import { useMapStore, type MapController } from "@/stores/map-store";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useSavedSpots } from "@/hooks/useSavedSpots";
import { useUser } from "@/hooks/useUser";
import { useWeather } from "@/components/shell/WeatherContext";
import { milesToMeters } from "@/lib/spots/geo";
import { SpotMarker } from "./SpotMarker";

const FOCUS_ZOOM = 13;
const FLY_DURATION_SEC = 0.6;
const FIT_PADDING: [number, number] = [40, 40];
const USER_FOCUS_ZOOM = 12;
const RADIUS_FIT_MAX_ZOOM = 16;

const CLUSTER_ZOOM_MAX = 6;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildClusterHTML(count: number, typeLabel: string): string {
  return (
    `<div class="leaflet-cluster">` +
    `<span class="leaflet-cluster__chip" title="${count} ${escapeHtml(typeLabel)} spots">` +
    `+${count}` +
    `</span>` +
    `</div>`
  );
}

function makeIcon(
  html: string,
  size: [number, number],
  anchor: [number, number],
): L.DivIcon {
  return L.divIcon({
    className: "leaflet-pin-wrapper",
    iconSize: size,
    iconAnchor: anchor,
    html,
  });
}

interface LeafletCanvasProps {
  spots: readonly Spot[];
  initialCenter?: [number, number];
  initialZoom?: number;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function safeMapCall(map: L.Map, fn: () => void): void {
  if (!map) return;
  if (!map.getContainer()) return;
  map.whenReady(() => {
    if (typeof window === "undefined") return;
    window.requestAnimationFrame(() => {
      try {
        const size = map.getSize();
        if (size.x === 0 || size.y === 0) return;
        fn();
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[leaflet] safe call skipped:", err);
        }
      }
    });
  });
}

function flyOrSetView(
  map: L.Map,
  target: L.LatLngExpression,
  zoom: number,
  duration: number,
): void {
  safeMapCall(map, () => {
    if (prefersReducedMotion()) {
      map.setView(target, zoom);
      return;
    }
    map.flyTo(target, zoom, { duration });
  });
}

function flyBoundsOrSetView(
  map: L.Map,
  bounds: L.LatLngBoundsExpression,
  padding: [number, number],
  duration: number,
): void {
  safeMapCall(map, () => {
    if (prefersReducedMotion()) {
      map.fitBounds(bounds, { padding });
      return;
    }
    map.flyToBounds(bounds, { padding, duration });
  });
}

function MapController({
  spots,
  userLocation,
}: {
  spots: readonly Spot[];
  userLocation: { lat: number; lon: number; accuracy: number } | null;
}) {
  const map = useMap();
  const hasInitialFit = useRef(false);

  const handle = useMemo<MapController>(
    () => ({
      flyTo: (spot) => {
        flyOrSetView(
          map,
          [spot.location.lat, spot.location.lon],
          FOCUS_ZOOM,
          FLY_DURATION_SEC,
        );
      },
      fitBoundsToSpots: () => {
        if (spots.length === 0) return;
        if (spots.length === 1) {
          const first = spots[0];
          if (first) {
            flyOrSetView(
              map,
              [first.location.lat, first.location.lon],
              FOCUS_ZOOM,
              FLY_DURATION_SEC,
            );
          }
          return;
        }
        const bounds: L.LatLngBoundsExpression = spots.map(
          (s) => [s.location.lat, s.location.lon] as [number, number],
        );
        flyBoundsOrSetView(map, bounds, FIT_PADDING, FLY_DURATION_SEC);
      },
      flyToUserLocation: () => {
        if (!userLocation) return;
        flyOrSetView(
          map,
          [userLocation.lat, userLocation.lon],
          USER_FOCUS_ZOOM,
          FLY_DURATION_SEC,
        );
      },
      fitRadius: (radiusMeters) => {
        if (!userLocation) return;
        if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) return;
        const center = L.latLng(userLocation.lat, userLocation.lon);
        const bounds = center.toBounds(radiusMeters * 2);
        safeMapCall(map, () => {
          if (prefersReducedMotion()) {
            map.fitBounds(bounds, {
              padding: FIT_PADDING,
              maxZoom: RADIUS_FIT_MAX_ZOOM,
            });
            return;
          }
          map.flyToBounds(bounds, {
            padding: FIT_PADDING,
            maxZoom: RADIUS_FIT_MAX_ZOOM,
            duration: FLY_DURATION_SEC,
          });
        });
      },
    }),
    [map, spots, userLocation],
  );

  useEffect(() => {
    useMapStore.getState().bindController(handle);
    return () => {
      const current = useMapStore.getState().controller;
      if (current === handle) {
        useMapStore.getState().bindController(null);
      }
    };
  }, [handle]);

  useEffect(() => {
    if (spots.length === 0) return;
    if (hasInitialFit.current) return;
    if (userLocation) return;
    hasInitialFit.current = true;
    if (spots.length === 1) {
      const first = spots[0];
      if (first) {
        safeMapCall(map, () => {
          map.setView([first.location.lat, first.location.lon], FOCUS_ZOOM);
        });
      }
      return;
    }
    const bounds: L.LatLngBoundsExpression = spots.map(
      (s) => [s.location.lat, s.location.lon] as [number, number],
    );
    safeMapCall(map, () => {
      map.fitBounds(bounds, { padding: FIT_PADDING });
    });
  }, [map, spots, userLocation]);

  return null;
}

function ZoomListener({ onZoomChange }: { onZoomChange: (z: number) => void }) {
  const map = useMap();
  useMapEvent("zoomend", () => {
    onZoomChange(map.getZoom());
  });
  return null;
}

type RenderedItem =
  | { kind: "spot"; spot: Spot; key: string }
  | {
      kind: "cluster";
      key: string;
      position: [number, number];
      label: string;
      count: number;
    };

function buildRenderedItems(
  spots: readonly Spot[],
  zoom: number,
): RenderedItem[] {
  if (zoom <= CLUSTER_ZOOM_MAX && spots.length > 1) {
    const groups = new Map<string, Spot[]>();
    for (const s of spots) {
      const arr = groups.get(s.citySlug);
      if (arr) arr.push(s);
      else groups.set(s.citySlug, [s]);
    }
    const out: RenderedItem[] = [];

    for (const arr of groups.values()) {
      if (arr.length < 2) {
        for (const s of arr) {
          out.push({ kind: "spot", spot: s, key: `spot:${s.id}` });
        }
        continue;
      }
      const anchor = arr[0];
      if (!anchor) continue;
      const label = anchor.types[0]?.name ?? "spots";
      out.push({
        kind: "cluster",
        key: `cluster:${anchor.citySlug}`,
        position: [anchor.location.lat, anchor.location.lon],
        label,
        count: arr.length,
      });
    }
    return out;
  }

  return spots.map((s) => ({ kind: "spot", spot: s, key: `spot:${s.id}` }));
}

class LeafletErrorBoundary extends Component<
  { children: ReactNode; onRetry: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[leaflet] recovered from:", error.message);
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <button
          type="button"
          onClick={this.props.onRetry}
          className="flex h-full w-full items-center justify-center bg-surface-container font-mono text-xs font-bold uppercase tracking-wider text-on-surface hover:bg-surface-container-high transition-colors"
        >
          Map paused — click to retry
        </button>
      );
    }
    return this.props.children;
  }
}

export function LeafletCanvas({
  spots,
  initialCenter,
  initialZoom,
}: LeafletCanvasProps) {
  const activeId = useMapStore((s) => s.activePinId);
  const toggleActivePin = useMapStore((s) => s.toggleActivePin);
  const { location: userLocation, radiusMiles } = useUserLocation();
  const user = useUser();
  const { savedIds } = useSavedSpots(user?.id ?? null);
  const { weather } = useWeather();

  const initialZoomState = initialZoom ?? (userLocation ? USER_FOCUS_ZOOM : 2);
  const initialCenterState: [number, number] =
    initialCenter ??
    (userLocation ? [userLocation.lat, userLocation.lon] : [20, 0]);
  const [zoom, setZoom] = useState<number>(initialZoomState);
  const [resetKey, setResetKey] = useState(0);
  const items = useMemo(() => buildRenderedItems(spots, zoom), [spots, zoom]);

  const userNearby = useMemo(() => {
    if (!userLocation) return false;
    for (const s of spots) {
      const dLat = s.location.lat - userLocation.lat;
      const dLon = s.location.lon - userLocation.lon;
      if (dLat * dLat + dLon * dLon < 0.000001) return true;
    }
    return false;
  }, [spots, userLocation]);

  const userIcon = useMemo(() => {
    return L.divIcon({
      className: `leaflet-user-pin ${userNearby ? "leaflet-user-pin--nearby" : ""}`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      html:
        '<span class="leaflet-user-pin__ring" aria-hidden="true" />' +
        '<span class="leaflet-user-pin__dot" aria-hidden="true" />',
    });
  }, [userNearby]);

  const showCircle =
    userLocation !== null && typeof radiusMiles === "number" && radiusMiles > 0;
  const radiusMeters =
    userLocation !== null ? milesToMeters(radiusMiles) : undefined;

  const handleMarkerClick = (spot: Spot) => {
    if (activeId === spot.id) {
      toggleActivePin(spot.id);
    } else {
      toggleActivePin(spot.id);
    }
  };

  return (
    <LeafletErrorBoundary
      key={resetKey}
      onRetry={() => setResetKey((k) => k + 1)}
    >
      <MapContainer
        key={resetKey}
        center={initialCenterState}
        zoom={initialZoomState}
        minZoom={2}
        maxZoom={18}
        scrollWheelZoom
        worldCopyJump
        className="h-full w-full"
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <MapController spots={spots} userLocation={userLocation} />
        <ZoomListener onZoomChange={setZoom} />
        {items.map((item) =>
          item.kind === "spot" ? (
            <SpotMarker
              key={item.key}
              spot={item.spot}
              isActive={activeId === item.spot.id}
              isSaved={savedIds.has(item.spot.id)}
              weather={weather[item.spot.id]}
              userLocation={
                userLocation
                  ? { lat: userLocation.lat, lon: userLocation.lon }
                  : null
              }
              onClick={handleMarkerClick}
            />
          ) : (
            <Marker
              key={item.key}
              position={item.position}
              icon={makeIcon(
                buildClusterHTML(item.count, item.label),
                [48, 48],
                [14, 14],
              )}
              eventHandlers={{
                click: () => {
                  const first = spots.find(
                    (s) => s.citySlug === item.key.slice("cluster:".length),
                  );
                  if (first) handleMarkerClick(first);
                },
              }}
            />
          ),
        )}
        {userLocation && (
          // TODO: i need improve the icon for the user location, i like the current animation such as a radar, keep using something similar but change the square shape for an icon or most useful shape or icon
          <Marker
            position={[userLocation.lat, userLocation.lon]}
            icon={userIcon}
            interactive={false}
            keyboard={false}
            title="Your location"
            alt="Your current location"
          />
        )}
        {showCircle && userLocation && radiusMeters !== undefined && (
          <Circle
            center={[userLocation.lat, userLocation.lon]}
            radius={radiusMeters}
            pathOptions={{
              color: "#000000",
              weight: 1,
              opacity: 0.6,
              fillColor: "#000000",
              fillOpacity: 0.05,
              dashArray: "4 4",
            }}
          />
        )}
      </MapContainer>
    </LeafletErrorBoundary>
  );
}
