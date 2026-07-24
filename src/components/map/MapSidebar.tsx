"use client";

import Image from "next/image";
import { Compass, Heart, MapPin } from "lucide-react";
import { memo, useCallback, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { useSpotsStore } from "@/stores/spots-store";
import { useMapStore } from "@/stores/map-store";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useSavedSpots } from "@/hooks/useSavedSpots";
import { useUser } from "@/hooks/useUser";
import { useMapFilter } from "@/hooks/useMapFilter";
import { useDistanceUnit } from "@/hooks/useDistanceUnit";
import {
  NEARBY_RADIUS_OPTIONS,
  type NearbyRadiusMiles,
} from "@/stores/user-location-store";
import type { Spot } from "@/lib/types";
import {
  getSpotDistanceInfo,
  haversineMiles,
  metersToUnit,
  milesToMeters,
} from "@/lib/spots/geo";
import type { DistanceUnit } from "@/stores/preferences-store";
import { TypeBadges } from "@/components/spot/TypeBadges";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface MapSidebarProps {
  spots: readonly Spot[];
  onSelect: (spot: Spot) => void;
  className?: string;
}

interface MapSidebarContentProps {
  spots: readonly Spot[];
  onSelect: (spot: Spot) => void;
  headerExtras?: ReactNode;
}

function MapSidebarContent({
  spots,
  onSelect,
  headerExtras,
}: MapSidebarContentProps) {
  const fullSpots = useSpotsStore((s) => s.spots);
  const activeId = useMapStore((s) => s.activePinId);
  const mapMode = useMapStore((s) => s.mapMode);
  const setActivePin = useMapStore((s) => s.setActivePin);
  const flyToSpot = useMapStore((s) => s.flyToSpot);
  const user = useUser();
  const { savedIds } = useSavedSpots(user?.id ?? null);
  const {
    location: userLocation,
    radiusMiles,
    setRadiusMiles,
  } = useUserLocation();
  const distanceUnit = useDistanceUnit();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { region, country, clearAll } = useMapFilter(fullSpots, searchParams);

  const showRadiusChips = mapMode === "nearby";
  const showChips = showRadiusChips && userLocation !== null;
  const showSavedLabel = mapMode === "saved";

  const hasFilter = region !== null || country !== null;
  const filterLabel = country ? `${country} (${region})` : region;

  const handleRadiusChip = useCallback(
    (miles: NearbyRadiusMiles) => {
      setRadiusMiles(miles);
    },
    [setRadiusMiles],
  );

  const handleSelect = useCallback(
    (spot: Spot) => {
      setActivePin(spot.id);
      flyToSpot(spot);
      onSelect(spot);
    },
    [setActivePin, flyToSpot, onSelect],
  );

  const distanceOrigin = showChips ? userLocation : null;

  const sortedSpots = useMemo(() => {
    if (distanceOrigin === null) return spots;
    const origin = distanceOrigin;
    return [...spots].sort(
      (a, b) =>
        haversineMiles(origin.lat, origin.lon, a.location.lat, a.location.lon) -
        haversineMiles(origin.lat, origin.lon, b.location.lat, b.location.lon),
    );
  }, [spots, distanceOrigin]);

  const groupedSpots = useMemo(
    () => groupSpotsByCity(sortedSpots, distanceOrigin, haversineMiles),
    [sortedSpots, distanceOrigin],
  );

  const [userCity, setUserCity] = useState<string | null>(
    groupedSpots[0]?.key ?? null,
  );

  const openCity = useMemo(() => {
    if (activeId) {
      const key = groupedSpots.find((g) =>
        g.spots.some((s) => s.id === activeId),
      )?.key;
      if (key) return key;
    }
    if (userCity && groupedSpots.some((g) => g.key === userCity)) {
      return userCity;
    }
    return groupedSpots[0]?.key ?? null;
  }, [activeId, groupedSpots, userCity]);
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center border-b border-outline-variant bg-surface-container-low">
        <div className="flex-1 flex flex-wrap items-center justify-center gap-2 py-2">
          {hasFilter && filterLabel && !showRadiusChips && (
            <div id="map-active-filter" className="flex items-center gap-2">
              <span className="flex items-center gap-1 border border-secondary px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface">
                <span>{filterLabel}</span>
              </span>
            </div>
          )}
          {showSavedLabel && (
            <div
              id="map-saved-label"
              className="flex items-center gap-2"
              aria-label={`Saved spots (${savedIds.size})`}
            >
              <span className="flex items-center gap-1 border border-secondary px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-on-surface">
                <Heart size={10} aria-hidden="true" />
                <span>Saved spots ({savedIds.size})</span>
              </span>
            </div>
          )}
          {showChips && (
            <div
              id="map-radius-chips"
              role="radiogroup"
              aria-label={`Nearby radius in ${distanceUnit === "km" ? "kilometers" : "miles"}`}
              className="flex items-center space-x-1"
            >
              <span
                aria-hidden="true"
                className="font-mono text-[10px] font-bold tracking-widest text-on-surface uppercase pr-1"
              >
                Radius
              </span>
              {NEARBY_RADIUS_OPTIONS.map((miles) => {
                const active = miles === radiusMiles;
                const label = formatRadiusLabel(miles, distanceUnit);
                return (
                  <button
                    key={miles}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => handleRadiusChip(miles)}
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase border transition-all",
                      active
                        ? "bg-primary text-on-primary border-primary"
                        : "border-outline-variant text-on-surface hover:border-outline",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {headerExtras && <div className="pr-2">{headerExtras}</div>}
      </div>

      <div
        id="sidebar-spots-list"
        aria-label={mapMode === "saved" ? "Saved spots" : "Filtered spots"}
        className="flex-1 flex flex-col overflow-y-auto no-scrollbar min-h-0"
      >
        <Accordion
          multiple={false}
          value={openCity === null ? [] : [openCity]}
          onValueChange={(v: string[]) => setUserCity(v[0] ?? null)}
        >
          {groupedSpots.map((group) => (
            <AccordionItem key={group.key} value={group.key}>
              <AccordionTrigger className="sticky top-0 z-10">
                <MapPin
                  size={10}
                  aria-hidden="true"
                  className="text-secondary shrink-0"
                />
                <span className="truncate">
                  {group.city}
                  {group.countryCode ? ` · ${group.countryCode}` : ""}
                </span>
                <span className="ml-auto text-secondary shrink-0">
                  {group.spots.length} spots
                </span>
              </AccordionTrigger>
              <AccordionContent>
                {group.spots.map((spot) => (
                  <SidebarSpotItem
                    key={spot.id}
                    spot={spot}
                    isActive={activeId === spot.id}
                    isSaved={savedIds.has(spot.id)}
                    distanceOrigin={distanceOrigin}
                    distanceUnit={distanceUnit}
                    onSelect={handleSelect}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {spots.length === 0 &&
          (mapMode === "saved" ? (
            <div
              id="map-saved-empty-state"
              className="m-4 flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-outline-variant bg-surface-container-low"
            >
              <div className="flex h-12 w-12 items-center justify-center bg-surface-container-high border border-outline-variant text-secondary mb-4">
                <Heart
                  size={20}
                  className="text-secondary"
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-display text-base font-bold uppercase tracking-wider text-on-surface">
                No registered spots
              </h3>
              <p className="mt-2 text-xs text-secondary leading-relaxed">
                Sift through our curated directory, tap the heart emblem, and
                compile your local blueprint for rapid reference.
              </p>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="mt-6 inline-flex items-center space-x-2 bg-on-surface text-surface px-5 py-2 text-xs font-bold tracking-widest uppercase hover:bg-on-surface/90 transition-all"
              >
                <Compass size={14} aria-hidden="true" />
                <span>Explore archive</span>
              </button>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-on-surface font-mono space-y-3">
              {hasFilter && filterLabel ? (
                <>
                  <p>No spots in {filterLabel}.</p>
                  {clearAll && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="font-mono text-xs font-bold tracking-widest uppercase text-primary hover:underline focus-visible:underline"
                    >
                      Clear filter
                    </button>
                  )}
                </>
              ) : showChips ? (
                `No spots within ${formatRadiusLabel(radiusMiles, distanceUnit)} — expand the grid.`
              ) : (
                "No locations match filter"
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

function MapSidebarBase({ spots, onSelect, className }: MapSidebarProps) {
  return (
    <aside
      id="map-sidebar"
      aria-label="Spot list"
      className={cn(
        "hidden lg:flex w-80 flex-col border border-outline-variant bg-surface-bright overflow-hidden h-full",
        className,
      )}
    >
      <MapSidebarContent spots={spots} onSelect={onSelect} />
    </aside>
  );
}

export const MapSidebar = memo(MapSidebarBase);
export { MapSidebarContent };

interface SidebarSpotItemProps {
  spot: Spot;
  isActive: boolean;
  isSaved: boolean;
  distanceOrigin: { lat: number; lon: number } | null;
  distanceUnit: DistanceUnit;
  onSelect: (spot: Spot) => void;
}

const SidebarSpotItem = memo(function SidebarSpotItem({
  spot,
  isActive,
  isSaved,
  distanceOrigin,
  distanceUnit,
  onSelect,
}: SidebarSpotItemProps) {
  const distanceInfo = getSpotDistanceInfo(spot, distanceOrigin, distanceUnit);
  const distanceLabel =
    distanceInfo.kind === "distance" ? distanceInfo.label : "—";

  const handleClick = useCallback(() => onSelect(spot), [onSelect, spot]);

  return (
    <button
      id={`sidebar-spot-item-${spot.id}`}
      type="button"
      onClick={handleClick}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "shrink-0 lg:shrink w-48 w-full snap-start text-left transition-colors flex items-stretch border",
        isActive
          ? "border-primary bg-surface-container-high"
          : "border-outline-variant/60 bg-surface-container-low hover:border-outline hover:bg-surface-container",
      )}
    >
      <span className="relative h-14 w-14 bg-black overflow-hidden shrink-0">
        <Image
          src={spot.image}
          alt=""
          fill
          sizes="56px"
          className="object-cover"
          referrerPolicy="no-referrer"
          unoptimized
        />
        {isSaved && (
          <span
            aria-hidden="true"
            className="absolute top-0 right-0 h-2 w-2 bg-surface border-l border-b border-outline"
          />
        )}
      </span>

      <span className="flex-1 min-w-0 px-3 py-2 flex flex-col gap-1.5">
        <span className="flex items-center justify-between gap-2 min-w-0">
          {spot.types.length > 0 ? (
            <TypeBadges
              types={spot.types}
              variant="surface"
              className="text-[9px]"
            />
          ) : (
            <span className="font-mono text-[9px] font-bold text-secondary uppercase tracking-widest">
              Spot
            </span>
          )}
          <span className="font-mono text-[9px] font-bold text-secondary uppercase tracking-widest shrink-0">
            {distanceLabel}
          </span>
        </span>
        <span className="block font-display text-xs font-bold tracking-wide uppercase text-on-surface truncate">
          {spot.name}
        </span>
        <span className="flex items-center justify-between gap-2 min-w-0">
          <span className="flex items-center text-[10px] text-secondary min-w-0">
            <MapPin size={10} aria-hidden="true" className="mr-1 shrink-0" />
            <span className="truncate">{spot.city}</span>
          </span>
          <span className="font-mono text-[9px] text-secondary uppercase tracking-widest truncate">
            {spot.sports.join("|")}
          </span>
        </span>
        {isSaved && <span className="visually-hidden">Saved spot</span>}
      </span>
    </button>
  );
});

interface SpotGroup {
  key: string;
  city: string;
  countryCode: string;
  spots: readonly Spot[];
  closestMiles: number | null;
}

function groupSpotsByCity(
  spots: readonly Spot[],
  origin: { lat: number; lon: number } | null,
  distance: (lat1: number, lon1: number, lat2: number, lon2: number) => number,
): readonly SpotGroup[] {
  const buckets = new Map<string, SpotGroup>();
  for (const spot of spots) {
    const countryCode = spot.countryCode || "—";
    const key = `${spot.city}|${countryCode}`;
    const existing = buckets.get(key);
    if (existing) {
      buckets.set(key, { ...existing, spots: [...existing.spots, spot] });
    } else {
      buckets.set(key, {
        key,
        city: spot.city,
        countryCode,
        spots: [spot],
        closestMiles: null,
      });
    }
  }

  const groups = [...buckets.values()].map((group) => {
    if (origin === null) {
      const sorted = [...group.spots].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      return { ...group, spots: sorted };
    }
    const sorted = [...group.spots].sort(
      (a, b) =>
        distance(origin.lat, origin.lon, a.location.lat, a.location.lon) -
        distance(origin.lat, origin.lon, b.location.lat, b.location.lon),
    );
    const first = sorted[0];
    const closestMiles = first
      ? distance(origin.lat, origin.lon, first.location.lat, first.location.lon)
      : null;
    return { ...group, spots: sorted, closestMiles };
  });

  if (origin === null) {
    return groups.sort(
      (a, b) => b.spots.length - a.spots.length || a.city.localeCompare(b.city),
    );
  }
  return groups.sort((a, b) => {
    const av = a.closestMiles ?? Number.POSITIVE_INFINITY;
    const bv = b.closestMiles ?? Number.POSITIVE_INFINITY;
    return av - bv;
  });
}

function formatRadiusLabel(
  miles: NearbyRadiusMiles,
  unit: DistanceUnit,
): string {
  if (unit === "km") {
    const km = Math.round(metersToUnit(milesToMeters(miles), "km"));
    return `${km} km`;
  }
  return `${miles} mi`;
}
