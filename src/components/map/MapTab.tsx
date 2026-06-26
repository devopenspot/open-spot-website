"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, ZoomIn, ZoomOut, Filter, X } from "lucide-react";
import { useAppState } from "@/components/layout/AppStateProvider";
import { MapPinButton } from "./MapPinButton";
import type { Spot } from "@/lib/types";

export default function MapTab() {
  const router = useRouter();
  const { spots, savedIds, toggleSaved } = useAppState();
  const [selectedType, setSelectedType] = useState<string>("All");
  const [activePin, setActivePin] = useState<Spot | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [mapPan, setMapPan] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const spotTypes = useMemo(() => {
    const types = new Set<string>();
    spots.forEach((s) => types.add(s.type));
    return ["All", ...Array.from(types)];
  }, [spots]);

  const filteredSpots = useMemo(
    () =>
      selectedType === "All"
        ? spots
        : spots.filter((s) => s.type === selectedType),
    [spots, selectedType],
  );

  const handleZoom = useCallback((direction: "in" | "out") => {
    setZoomLevel((prev) => {
      const next = direction === "in" ? prev + 0.25 : prev - 0.25;
      return Math.max(0.75, Math.min(2.5, next));
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
      setMapPan({
        x: (50 - spot.coordinates.x) * 2 * zoomLevel,
        y: (50 - spot.coordinates.y) * 2 * zoomLevel,
      });
    },
    [zoomLevel],
  );

  const handleTypeSelect = useCallback(
    (type: string) => setSelectedType(type),
    [],
  );

  const openSpot = useCallback(
    (spot: Spot) => {
      router.push(`/spots/${spot.id}`);
    },
    [router],
  );

  return (
    <section
      id="map-tab"
      role="tabpanel"
      aria-labelledby="nav-btn-map"
      className="flex flex-col lg:flex-row gap-6 pb-24 animate-fade-in h-[calc(100vh-60px)] min-h-[500px]"
    >
      <h1 className="visually-hidden">Spot Map</h1>
      <aside
        id="map-sidebar"
        aria-label="Spot list"
        className="w-full lg:w-80 flex flex-col border border-outline-variant rounded-2xl bg-surface-bright overflow-hidden h-[300px] lg:h-full"
      >
        <div className="p-4 border-b border-outline-variant bg-surface-container-low">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] font-bold tracking-widest text-secondary uppercase">
              Locator Matrix
            </span>
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[9px] font-mono font-semibold text-primary">
              {filteredSpots.length} plots active
            </span>
          </div>

          <h3 className="font-display text-base font-bold uppercase tracking-wider text-on-surface mb-3 flex items-center">
            <Filter
              size={14}
              className="mr-1.5 text-secondary"
              aria-hidden="true"
            />
            Filter by terrain
          </h3>

          <div
            role="group"
            aria-label="Filter spots by terrain type"
            className="flex flex-wrap gap-1.5 no-scrollbar max-h-24 overflow-y-auto"
          >
            {spotTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeSelect(type)}
                aria-pressed={selectedType === type}
                className={`rounded-full px-3 py-1 text-[10px] font-medium tracking-wide transition-all border ${
                  selectedType === type
                    ? "bg-primary text-surface border-primary"
                    : "bg-surface border-outline-variant text-secondary hover:text-on-surface hover:border-outline"
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div
          id="sidebar-spots-list"
          aria-label="Filtered spots"
          className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar"
        >
          {filteredSpots.map((spot) => {
            const isHovered = activePin?.id === spot.id;
            const isSaved = savedIds.has(spot.id);
            return (
              <button
                key={spot.id}
                id={`sidebar-spot-item-${spot.id}`}
                type="button"
                onClick={() => handleSidebarSelect(spot)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex space-x-3 items-center ${
                  isHovered
                    ? "border-primary bg-surface-container-high shadow-sm"
                    : "border-outline-variant/60 bg-surface-container-low hover:border-outline hover:bg-surface-container"
                }`}
              >
                <span className="relative h-12 w-12 rounded-lg bg-black overflow-hidden shrink-0">
                  <Image
                    src={spot.image}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover grayscale"
                    referrerPolicy="no-referrer"
                    unoptimized
                  />
                </span>

                <span className="flex-1 min-w-0">
                  <span className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-semibold text-secondary uppercase">
                      {spot.type}
                    </span>
                    <span className="text-[8px] font-mono font-medium text-secondary">
                      {spot.distance}
                    </span>
                  </span>
                  <span className="block font-display text-xs font-bold uppercase tracking-wide truncate text-on-surface">
                    {spot.name}
                  </span>
                  <span className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-secondary truncate">
                      {spot.city}
                    </span>
                    <span className="flex items-center space-x-1">
                      <span
                        aria-hidden="true"
                        className="h-1 w-1 rounded-full bg-primary"
                      />
                      <span className="text-[8px] font-mono text-secondary">
                        CRD: {spot.crowdLevel}%
                      </span>
                    </span>
                  </span>
                  {isSaved && (
                    <span className="visually-hidden">Saved spot</span>
                  )}
                </span>
              </button>
            );
          })}
          {filteredSpots.length === 0 && (
            <div className="p-6 text-center text-xs text-secondary font-mono">
              No locations match filter
            </div>
          )}
        </div>
      </aside>

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
              Los Angeles Grid Active
            </span>
          </div>

          <div className="flex items-center space-x-1 bg-surface/90 backdrop-blur-md p-1 rounded-lg border border-outline-variant shadow-sm pointer-events-auto">
            <button
              type="button"
              onClick={() => handleZoom("in")}
              aria-label="Zoom in"
              title="Zoom in"
              className="p-1.5 rounded text-secondary hover:text-on-surface hover:bg-surface-container transition-all"
            >
              <ZoomIn size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => handleZoom("out")}
              aria-label="Zoom out"
              title="Zoom out"
              className="p-1.5 rounded text-secondary hover:text-on-surface hover:bg-surface-container transition-all"
            >
              <ZoomOut size={14} aria-hidden="true" />
            </button>
            <div
              className="h-4 w-px bg-outline-variant mx-1"
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={handleResetMap}
              className="px-2 py-1 text-[9px] font-mono font-bold tracking-wider uppercase text-primary hover:bg-surface-container rounded transition-all"
            >
              Reset view
            </button>
          </div>
        </div>

        <div
          id="map-viewport"
          aria-label="Map of skate spots"
          className="flex-1 relative cursor-grab overflow-hidden active:cursor-grabbing bg-surface-container"
          style={{
            backgroundImage: `
              radial-gradient(var(--color-outline-variant) 1px, transparent 1px),
              linear-gradient(to right, var(--color-surface-variant) 1px, transparent 1px),
              linear-gradient(to bottom, var(--color-surface-variant) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
          }}
        >
          <div
            id="map-transform-layer"
            className="absolute inset-0 transition-transform duration-500 ease-out"
            style={{
              transform: `scale(${zoomLevel}) translate(${mapPan.x}px, ${mapPan.y}px)`,
              transformOrigin: "center center",
            }}
          >
            <div
              className="absolute top-1/2 left-0 right-0 h-px bg-outline-variant/40"
              aria-hidden="true"
            />
            <div
              className="absolute left-1/2 top-0 bottom-0 w-px bg-outline-variant/40"
              aria-hidden="true"
            />

            {filteredSpots.map((spot) => (
              <MapPinButton
                key={spot.id}
                spot={spot}
                active={activePin?.id === spot.id}
                onToggle={handlePinToggle}
              />
            ))}
          </div>

          {activePin && (
            <div
              id="map-info-popup"
              role="dialog"
              aria-labelledby="map-info-popup-title"
              className="absolute bottom-4 left-4 right-4 z-20 md:left-auto md:right-4 md:w-80 bg-surface/95 backdrop-blur-md rounded-xl border border-outline-variant shadow-lg p-4 animate-slide-up"
            >
              <div className="flex space-x-3">
                <div className="relative h-16 w-16 bg-black rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={activePin.image}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover grayscale"
                    referrerPolicy="no-referrer"
                    unoptimized
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider text-primary mb-1">
                    {activePin.type}
                  </span>
                  <h4
                    id="map-info-popup-title"
                    className="font-display text-sm font-bold tracking-wide uppercase text-on-surface truncate"
                  >
                    {activePin.name}
                  </h4>
                  <p className="text-[10px] text-secondary flex items-center">
                    <MapPin size={10} className="mr-0.5" aria-hidden="true" />
                    {activePin.city}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePin(null)}
                  aria-label="Close details"
                  className="self-start rounded p-1 text-secondary hover:text-on-surface hover:bg-surface-container"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-outline-variant/60 text-[10px] font-mono">
                <div>
                  <span className="block text-[8px] text-secondary">
                    Crowd density
                  </span>
                  <span className="font-semibold text-on-surface">
                    {activePin.crowdLevel}% occupied
                  </span>
                </div>
                <div>
                  <span className="block text-[8px] text-secondary">
                    Air temp
                  </span>
                  <span className="font-semibold text-on-surface">
                    {activePin.weather.current}°C sunny
                  </span>
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => openSpot(activePin)}
                  className="flex-1 bg-on-surface text-surface py-1.5 rounded-md text-[10px] font-bold tracking-wider uppercase hover:bg-on-surface/90 transition-all text-center"
                >
                  Full info matrix
                </button>
                <button
                  type="button"
                  onClick={() => toggleSaved(activePin.id)}
                  aria-pressed={savedIds.has(activePin.id)}
                  className={`px-2.5 border rounded-md text-[10px] font-bold tracking-wider uppercase transition-all ${
                    savedIds.has(activePin.id)
                      ? "border-primary bg-primary text-surface"
                      : "border-outline text-secondary hover:bg-surface-container"
                  }`}
                >
                  {savedIds.has(activePin.id) ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          aria-label="Map marker legend"
          className="bg-surface border-t border-outline-variant px-4 py-2.5 flex flex-wrap gap-4 text-[10px] font-mono justify-center items-center"
        >
          <span className="text-secondary font-bold uppercase">
            Marker legend:
          </span>
          <span className="flex items-center space-x-1.5">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-primary"
            />
            <span className="text-secondary uppercase">Skateable plots</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-surface-container border border-outline"
            />
            <span className="text-secondary uppercase">
              Unselected obstacle
            </span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-primary/20"
            />
            <span className="text-on-surface font-semibold uppercase">
              Active scout
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
