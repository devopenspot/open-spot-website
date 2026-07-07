'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Spot } from '@/lib/types';

const FOCUS_ZOOM = 13;
const FLY_DURATION_SEC = 0.6;
const FIT_PADDING: [number, number] = [40, 40];

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

export interface LeafletCanvasHandle {
  flyTo: (spot: Spot) => void;
  fitBoundsToSpots: () => void;
}

interface LeafletCanvasProps {
  spots: readonly Spot[];
  activeId: string | null;
  onTogglePin: (spot: Spot) => void;
}

function MapController({
  spots,
  ref,
}: {
  spots: readonly Spot[];
  ref: React.Ref<LeafletCanvasHandle>;
}) {
  const map = useMap();
  const hasInitialFit = useRef(false);

  useImperativeHandle(
    ref,
    () => ({
      flyTo: (spot) => {
        map.flyTo(
          [spot.location.lat, spot.location.lon],
          FOCUS_ZOOM,
          { duration: FLY_DURATION_SEC },
        );
      },
      fitBoundsToSpots: () => {
        if (spots.length === 0) return;
        if (spots.length === 1) {
          const first = spots[0];
          if (first) {
            map.flyTo(
              [first.location.lat, first.location.lon],
              FOCUS_ZOOM,
              { duration: FLY_DURATION_SEC },
            );
          }
          return;
        }
        const bounds: L.LatLngBoundsExpression = spots.map(
          (s) => [s.location.lat, s.location.lon] as [number, number],
        );
        map.flyToBounds(bounds, {
          padding: FIT_PADDING,
          duration: FLY_DURATION_SEC,
        });
      },
    }),
    [map, spots],
  );

  useEffect(() => {
    if (spots.length === 0) return;
    if (hasInitialFit.current) return;
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
  }, [map, spots]);

  return null;
}

export const LeafletCanvas = forwardRef<LeafletCanvasHandle, LeafletCanvasProps>(
  function LeafletCanvas({ spots, activeId, onTogglePin }, ref) {
    const markers = useMemo(
      () =>
        spots.map((spot) => ({
          spot,
          icon: spot.id === activeId ? activeIcon : defaultIcon,
        })),
      [spots, activeId],
    );

    return (
      <MapContainer
        center={[20, 0]}
        zoom={2}
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
        <MapController spots={spots} ref={ref} />
        {markers.map(({ spot, icon }) => (
          <Marker
            key={spot.id}
            position={[spot.location.lat, spot.location.lon]}
            icon={icon}
            eventHandlers={{ click: () => onTogglePin(spot) }}
          />
        ))}
      </MapContainer>
    );
  },
);
