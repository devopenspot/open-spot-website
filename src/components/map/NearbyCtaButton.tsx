"use client";

import { useCallback } from "react";
import { useMap } from "react-leaflet";
import { ChevronRight, MapPin } from "lucide-react";
import { useUserLocation } from "@/hooks/useUserLocation";

const NEARBY_BUTTON_ID = "view-nearby-link";
const FOCUS_ZOOM = 13;

export function NearbyCtaButton() {
  const map = useMap();
  const { status, location } = useUserLocation();

  const handleClick = useCallback(() => {
    if (!location) return;
    map.flyTo([location.lat, location.lon], FOCUS_ZOOM);
  }, [map, location]);

  if (status !== "granted" || !location) return null;

  return (
    <button
      id={NEARBY_BUTTON_ID}
      type="button"
      onClick={handleClick}
      aria-label="Re-center map on your location"
      className="absolute bottom-4 right-4 z-[1000] group flex items-center space-x-1.5 text-xs font-semibold tracking-wider text-primary uppercase hover:underline"
    >
      <MapPin size={14} aria-hidden="true" />
      <span>View Nearby</span>
      <ChevronRight
        size={14}
        aria-hidden="true"
        className="transition-transform group-hover:translate-x-0.5"
      />
    </button>
  );
}
