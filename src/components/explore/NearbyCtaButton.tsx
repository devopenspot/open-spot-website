"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, MapPin } from "lucide-react";
import { useUserLocation } from "@/hooks/useUserLocation";
import { showToast } from "@/hooks/useToast";
import { ROUTES } from "@/lib/nav";

const NEARBY_BUTTON_ID = "view-nearby-link";

function statusMessage(status: string): string {
  switch (status) {
    case "granted":
      return "Location ready — opening map.";
    case "denied":
      return "Location access denied — showing global grid.";
    case "unavailable":
      return "Geolocation unavailable in this browser — showing global grid.";
    case "requesting":
      return "Requesting your location…";
    default:
      return "";
  }
}

export function NearbyCtaButton() {
  const router = useRouter();
  const { status, request } = useUserLocation();
  const isRequesting = status === "requesting";

  const handleClick = useCallback(async () => {
    if (isRequesting) return;
    const next = await request();
    if (next === "denied") {
      showToast("Location access denied — showing global grid.", "error");
    } else if (next === "unavailable") {
      showToast("Geolocation unavailable in this browser.", "error");
    } else if (next === "granted") {
      showToast("Location ready — opening map.", "success");
    }
    router.push(ROUTES.map);
  }, [isRequesting, request, router]);

  const Icon = isRequesting ? Loader2 : MapPin;

  return (
    <button
      id={NEARBY_BUTTON_ID}
      type="button"
      onClick={handleClick}
      disabled={isRequesting}
      aria-busy={isRequesting}
      aria-describedby={`${NEARBY_BUTTON_ID}-status`}
      className="group flex items-center space-x-1.5 text-xs font-semibold tracking-wider text-primary uppercase hover:underline disabled:opacity-60 disabled:cursor-wait"
    >
      <Icon
        size={14}
        aria-hidden="true"
        className={isRequesting ? "animate-spin" : ""}
      />
      <span>{isRequesting ? "Locating…" : "View Nearby"}</span>
      <ChevronRight
        size={14}
        aria-hidden="true"
        className="transition-transform group-hover:translate-x-0.5"
      />
      <span
        id={`${NEARBY_BUTTON_ID}-status`}
        role="status"
        aria-live="polite"
        className="visually-hidden"
      >
        {statusMessage(status)}
      </span>
    </button>
  );
}
