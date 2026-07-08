"use client";

import { useCallback } from "react";
import { Crosshair, Loader2, MapPin, X } from "lucide-react";
import { showToast } from "@/hooks/useToast";
import { useUserLocation } from "@/hooks/useUserLocation";

const NEARBY_CONTROL_ID = "nearby-control";

function tooltipFor(status: string, hasLocation: boolean): string {
  if (status === "denied") {
    return "Location access denied — click to try again.";
  }
  if (status === "unavailable") {
    return "Geolocation unavailable — click to retry.";
  }
  if (status === "requesting") {
    return "Requesting your location…";
  }
  if (status === "granted" && hasLocation) {
    return "Click to re-center the map on your location.";
  }
  return "Use your location to find nearby spots.";
}

export function NearbyControl() {
  const { status, location, request, clear } = useUserLocation();
  const isRequesting = status === "requesting";
  const isGranted = status === "granted" && location !== null;

  const handleClick = useCallback(async () => {
    if (isRequesting) return;
    await request();
  }, [isRequesting, request]);

  const handleClear = useCallback(() => {
    clear();
    showToast("Location cleared — showing global grid.", "info");
  }, [clear]);

  const Icon = isRequesting
    ? Loader2
    : isGranted
      ? MapPin
      : Crosshair;

  return (
    <div
      id={`${NEARBY_CONTROL_ID}-cluster`}
      className="flex items-center space-x-1 bg-surface/90 backdrop-blur-md p-1 rounded-lg border border-outline-variant shadow-sm pointer-events-auto"
    >
      <button
        id={NEARBY_CONTROL_ID}
        type="button"
        onClick={handleClick}
        disabled={isRequesting}
        aria-busy={isRequesting}
        title={tooltipFor(status, isGranted)}
        aria-label={tooltipFor(status, isGranted)}
        data-nearby-status={status}
        className="flex items-center space-x-1 px-2 py-1 text-[9px] font-mono font-bold tracking-wider uppercase text-primary hover:bg-surface-container rounded transition-all disabled:opacity-60 disabled:cursor-wait"
      >
        <Icon
          size={11}
          aria-hidden="true"
          className={isRequesting ? "animate-spin" : ""}
        />
        <span>
          {isRequesting
            ? "Locating…"
            : isGranted
              ? "Near you"
              : "Find near me"}
        </span>
      </button>
      {isGranted && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear location"
          title="Clear location"
          className="px-1 py-1 text-secondary hover:text-on-surface hover:bg-surface-container rounded transition-all"
        >
          <X size={10} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
