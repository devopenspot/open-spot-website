'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Spot } from '@/lib/types';

const FOCUS_ZOOM = 13;
const FLY_DURATION_SEC = 0.6;
const FIT_PADDING: [number, number] = [40, 40];
const USER_FOCUS_ZOOM = 12;

const defaultIcon = L.divIcon({
  className: 'leaflet-pin leaflet-pin--default',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  html: '<span aria-hidden="true" />',
});

const activeIcon = L.divIcon({
  className: 'leaflet-pin leaflet-pin--active',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  html: '<span aria-hidden="true" />',
});

const userLocationIcon = L.divIcon({
  className: 'leaflet-user-pin',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  html:
    '<span class="leaflet-user-pin__ring" aria-hidden="true" />' +
    '<span class="leaflet-user-pin__dot" aria-hidden="true" />',
});

export interface LeafletUserLocation {
  lat: number;
  lon: number;
  accuracy: number;
}

export interface LeafletCanvasHandle {
  flyTo: (spot: Spot) => void;
  fitBoundsToSpots: () => void;
  flyToUserLocation: () => void;
}

interface LeafletCanvasProps {
  spots: readonly Spot[];
  activeId: string | null;
  onTogglePin: (spot: Spot) => void;
  userLocation?: LeafletUserLocation | null;
  radiusMeters?: number;
  showRadius?: boolean;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function flyOrSetView(
  map: L.Map,
  target: L.LatLngExpression,
  zoom: number,
  duration: number,
): void {
  if (prefersReducedMotion()) {
    map.setView(target, zoom);
    return;
  }
  map.flyTo(target, zoom, { duration });
}

function flyBoundsOrSetView(
  map: L.Map,
  bounds: L.LatLngBoundsExpression,
  padding: [number, number],
  duration: number,
): void {
  if (prefersReducedMotion()) {
    map.fitBounds(bounds, { padding });
    return;
  }
  map.flyToBounds(bounds, { padding, duration });
}

function MapController({
  spots,
  userLocation,
  ref,
}: {
  spots: readonly Spot[];
  userLocation: LeafletUserLocation | null;
  ref: React.Ref<LeafletCanvasHandle>;
}) {
  const map = useMap();
  const hasInitialFit = useRef(false);

  useImperativeHandle(
    ref,
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
    }),
    [map, spots, userLocation],
  );

  useEffect(() => {
    if (spots.length === 0) return;
    if (hasInitialFit.current) return;
    if (userLocation) return;
    hasInitialFit.current = true;
    if (spots.length === 1) {
      const first = spots[0];
      if (first) map.setView([first.location.lat, first.location.lon], FOCUS_ZOOM);
      return;
    }
    const bounds: L.LatLngBoundsExpression = spots.map(
      (s) => [s.location.lat, s.location.lon] as [number, number],
    );
    map.fitBounds(bounds, { padding: FIT_PADDING });
  }, [map, spots, userLocation]);

  return null;
}

export const LeafletCanvas = forwardRef<LeafletCanvasHandle, LeafletCanvasProps>(
  function LeafletCanvas(
    { spots, activeId, onTogglePin, userLocation = null, radiusMeters, showRadius = true },
    ref,
  ) {
    const markers = useMemo(
      () =>
        spots.map((spot) => ({
          spot,
          icon: spot.id === activeId ? activeIcon : defaultIcon,
        })),
      [spots, activeId],
    );

    const showCircle =
      userLocation !== null && showRadius && typeof radiusMeters === 'number' && radiusMeters > 0;

    return (
      <MapContainer
        center={userLocation ? [userLocation.lat, userLocation.lon] : [20, 0]}
        zoom={userLocation ? USER_FOCUS_ZOOM : 2}
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
        <MapController spots={spots} userLocation={userLocation} ref={ref} />
        {markers.map(({ spot, icon }) => (
          <Marker
            key={spot.id}
            position={[spot.location.lat, spot.location.lon]}
            icon={icon}
            eventHandlers={{ click: () => onTogglePin(spot) }}
          />
        ))}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lon]}
            icon={userLocationIcon}
            interactive={false}
            keyboard={false}
            title="Your location"
            alt="Your current location"
          />
        )}
        {showCircle && userLocation && (
          <Circle
            center={[userLocation.lat, userLocation.lon]}
            radius={radiusMeters as number}
            pathOptions={{
              color: '#000000',
              weight: 1,
              opacity: 0.6,
              fillColor: '#000000',
              fillOpacity: 0.05,
              dashArray: '4 4',
            }}
          />
        )}
      </MapContainer>
    );
  },
);
