"use client";

import { ZoomIn, ZoomOut } from "lucide-react";
import { MapPinButton } from "./MapPinButton";
import type { Spot } from "@/lib/types";

interface MapCanvasProps {
  spots: readonly Spot[];
  activeId: string | null;
  gridTitle: string;
  zoomLevel: number;
  mapPan: { x: number; y: number };
  onZoom: (direction: "in" | "out") => void;
  onReset: () => void;
  onTogglePin: (spot: Spot) => void;
}

export function MapCanvas({
  spots,
  activeId,
  gridTitle,
  zoomLevel,
  mapPan,
  onZoom,
  onReset,
  onTogglePin,
}: MapCanvasProps) {
  return (
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
            onClick={() => onZoom("in")}
            aria-label="Zoom in"
            title="Zoom in"
            className="p-1.5 rounded text-secondary hover:text-on-surface hover:bg-surface-container transition-all"
          >
            <ZoomIn size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onZoom("out")}
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
            onClick={onReset}
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

          {spots.map((spot) => (
            <MapPinButton
              key={spot.id}
              spot={spot}
              active={activeId === spot.id}
              onToggle={onTogglePin}
            />
          ))}
        </div>
      </div>
    </div>
  );
}