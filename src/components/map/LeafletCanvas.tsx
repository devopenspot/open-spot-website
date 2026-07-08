'use client';

import {
  Component,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvent,
} from 'react-leaflet';
import L from 'leaflet';
import type { Spot, WeatherIconName } from '@/lib/types';
import type { CachedSpotWeather } from '@/lib/weather/weather-cached';
import { weatherIconGlyph } from '@/components/spot/WeatherIcon';

const FOCUS_ZOOM = 13;
const FLY_DURATION_SEC = 0.6;
const FIT_PADDING: [number, number] = [40, 40];
const USER_FOCUS_ZOOM = 12;
const RADIUS_FIT_MAX_ZOOM = 16;

const CLUSTER_ZOOM_MAX = 6;
const LABEL_MAX_CHARS = 14;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncateLabel(name: string): string {
  if (name.length <= LABEL_MAX_CHARS) return name;
  return `${name.slice(0, LABEL_MAX_CHARS - 1).trimEnd()}…`;
}

function buildPinHTML(
  spot: Spot,
  options: { active: boolean; saved: boolean; weather: WeatherIconName | null; crowdLevel: number },
): string {
  const cls = ['leaflet-pin'];
  if (options.active) cls.push('leaflet-pin--active');
  else if (options.saved) cls.push('leaflet-pin--saved');

  const label = escapeHtml(truncateLabel(spot.name));

  const weatherHtml = options.weather
    ? `<span class="leaflet-pin__weather">${weatherIconGlyph(options.weather, 10)}</span>`
    : '';

  const crowdCells = Math.max(0, Math.min(3, Math.round(options.crowdLevel / 34)));
  const crowdHtml =
    '<span class="leaflet-pin__crowd" aria-hidden="true">' +
    Array.from({ length: 3 }, (_, i) =>
      `<i class="${i < crowdCells ? 'on' : ''}"></i>`,
    ).join('') +
    '</span>';

  return (
    `<div class="${cls.join(' ')}">` +
    `<span class="leaflet-pin__square">` +
    weatherHtml +
    (options.active
      ? `<span class="leaflet-pin__info" aria-hidden="true">${crowdHtml}</span>`
      : '') +
    `</span>` +
    `<span class="leaflet-pin__label">${label}</span>` +
    `</div>`
  );
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

function makeIcon(html: string, size: [number, number], anchor: [number, number]): L.DivIcon {
  return L.divIcon({
    className: 'leaflet-pin-wrapper',
    iconSize: size,
    iconAnchor: anchor,
    html,
  });
}

function pinSize(active: boolean): { size: [number, number]; anchor: [number, number] } {
  if (active) return { size: [32, 46], anchor: [16, 16] };
  return { size: [24, 38], anchor: [12, 12] };
}

function pickWeatherName(spot: Spot, weather: Record<string, CachedSpotWeather> | undefined): WeatherIconName | null {
  if (!weather) return null;
  const w = weather[spot.id];
  if (!w) return null;
  const first = w.forecast[0];
  return first?.icon ?? null;
}

export interface LeafletUserLocation {
  lat: number;
  lon: number;
  accuracy: number;
}

export interface LeafletCanvasHandle {
  flyTo: (spot: Spot) => void;
  fitBoundsToSpots: () => void;
  flyToUserLocation: () => void;
  fitRadius: (radiusMeters: number) => void;
}

interface LeafletCanvasProps {
  spots: readonly Spot[];
  activeId: string | null;
  savedIds?: ReadonlySet<string>;
  weather?: Record<string, CachedSpotWeather>;
  onTogglePin: (spot: Spot) => void;
  userLocation?: LeafletUserLocation | null;
  radiusMeters?: number;
  showRadius?: boolean;
  initialCenter?: [number, number];
  initialZoom?: number;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  useMapEvent('zoomend', () => {
    onZoomChange(map.getZoom());
  });
  return null;
}

interface RenderedMarker {
  key: string;
  position: [number, number];
  icon: L.DivIcon;
  spot: Spot;
}

function buildRenderedMarkers(
  spots: readonly Spot[],
  activeId: string | null,
  savedIds: ReadonlySet<string>,
  weather: Record<string, CachedSpotWeather> | undefined,
  zoom: number,
): RenderedMarker[] {
  if (zoom <= CLUSTER_ZOOM_MAX && spots.length > 1) {
    const groups = new Map<string, Spot[]>();
    for (const s of spots) {
      const key = `${s.citySlug}::${s.type}`;
      const arr = groups.get(key);
      if (arr) arr.push(s);
      else groups.set(key, [s]);
    }
    const out: RenderedMarker[] = [];
    for (const arr of groups.values()) {
      if (arr.length < 2) {
        for (const s of arr) {
          out.push(makeMarker(s, activeId, savedIds, weather));
        }
        continue;
      }
      const anchor = arr[0];
      if (!anchor) continue;
      const html = buildClusterHTML(arr.length, anchor.type);
      const icon = makeIcon(html, [28, 28], [14, 14]);
      out.push({
        key: `cluster:${anchor.citySlug}:${anchor.type}`,
        position: [anchor.location.lat, anchor.location.lon],
        icon,
        spot: anchor,
      });
    }
    return out;
  }

  return spots.map((s) => makeMarker(s, activeId, savedIds, weather));
}

function makeMarker(
  spot: Spot,
  activeId: string | null,
  savedIds: ReadonlySet<string>,
  weather: Record<string, CachedSpotWeather> | undefined,
): RenderedMarker {
  const active = spot.id === activeId;
  const saved = !active && savedIds.has(spot.id);
  const html = buildPinHTML(spot, {
    active,
    saved,
    weather: pickWeatherName(spot, weather),
    crowdLevel: spot.crowdLevel,
  });
  const { size, anchor } = pinSize(active);
  return {
    key: `spot:${spot.id}`,
    position: [spot.location.lat, spot.location.lon],
    icon: makeIcon(html, size, anchor),
    spot,
  };
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
          className="flex h-full w-full items-center justify-center bg-surface-container font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface hover:bg-surface-container-high transition-colors"
        >
          Map paused — click to retry
        </button>
      );
    }
    return this.props.children;
  }
}

export const LeafletCanvas = forwardRef<LeafletCanvasHandle, LeafletCanvasProps>(
  function LeafletCanvas(
    {
      spots,
      activeId,
      savedIds = new Set(),
      weather,
      onTogglePin,
      userLocation = null,
      radiusMeters,
      showRadius = true,
      initialCenter,
      initialZoom,
    },
    ref,
  ) {
    const initialZoomState =
      initialZoom ?? (userLocation ? USER_FOCUS_ZOOM : 2);
    const initialCenterState: [number, number] =
      initialCenter ??
      (userLocation
        ? [userLocation.lat, userLocation.lon]
        : [20, 0]);
    const [zoom, setZoom] = useState<number>(initialZoomState);
    const [resetKey, setResetKey] = useState(0);
    const markers = useMemo(
      () => buildRenderedMarkers(spots, activeId, savedIds, weather, zoom),
      [spots, activeId, savedIds, weather, zoom],
    );

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
        className: `leaflet-user-pin ${userNearby ? 'leaflet-user-pin--nearby' : ''}`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        html:
          '<span class="leaflet-user-pin__ring" aria-hidden="true" />' +
          '<span class="leaflet-user-pin__dot" aria-hidden="true" />',
      });
    }, [userNearby]);

    const showCircle =
      userLocation !== null && showRadius && typeof radiusMeters === 'number' && radiusMeters > 0;

    return (
      <LeafletErrorBoundary key={resetKey} onRetry={() => setResetKey((k) => k + 1)}>
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
          <MapController spots={spots} userLocation={userLocation} ref={ref} />
          <ZoomListener onZoomChange={setZoom} />
        {markers.map((m) => (
          <Marker
            key={m.key}
            position={m.position}
            icon={m.icon}
            eventHandlers={{ click: () => onTogglePin(m.spot) }}
          />
        ))}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lon]}
            icon={userIcon}
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
      </LeafletErrorBoundary>
    );
  },
);
