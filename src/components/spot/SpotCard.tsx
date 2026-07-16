"use client";

import Image from "next/image";
import { Heart, Trash2, MapPin } from "lucide-react";
import { memo, useCallback, type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import { CROWD_LEVEL } from "@/lib/constants";
import { useUserLocation } from "@/hooks/useUserLocation";
import { getSpotDistanceInfo } from "@/lib/spots/geo";
import type { Spot } from "@/lib/types";

interface BaseSpotCardProps {
  spot: Spot;
  isSaved: boolean;
  onOpen: (spot: Spot) => void;
  onToggleSave: (id: string) => void;
  className?: string;
}

const ROOT_CLASSES =
  "group relative flex w-full flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-bright text-left shadow-sm transition-all hover:shadow-md focus-within:shadow-md";

const IMAGE_WRAPPER_CLASSES = "relative h-48 w-full overflow-hidden bg-black/5";

const TOGGLE_BASE_CLASSES =
  "absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-all hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const TOGGLE_SAVED_CLASSES = "border-primary bg-primary text-surface";
const TOGGLE_DEFAULT_CLASSES =
  "border-outline-variant bg-white/80 text-on-surface backdrop-blur-sm hover:bg-white";

const TYPE_BADGE_CLASSES =
  "absolute bottom-3 left-3 rounded bg-black/60 px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase text-white backdrop-blur-sm";

const CONTENT_CLASSES =
  "flex flex-1 flex-col justify-between p-4 text-left w-full";

const HOVER_BAR_CLASSES =
  "mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between text-[10px] font-mono";

function toggleAriaLabel(
  spot: Spot,
  isSaved: boolean,
  remove: boolean,
): string {
  if (remove || isSaved) {
    return `Remove ${spot.name} from saved spots`;
  }
  return `Save ${spot.name}`;
}

function BaseSpotCardImpl({
  spot,
  isSaved,
  onOpen,
  onToggleSave,
  className,
  toggleIconVariant,
  removeCopy,
}: BaseSpotCardProps & {
  toggleIconVariant: "heart" | "trash";
  removeCopy: boolean;
}) {
  const handleOpen = useCallback(() => onOpen(spot), [onOpen, spot]);
  const handleToggle = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onToggleSave(spot.id);
    },
    [onToggleSave, spot.id],
  );

  const { location } = useUserLocation();
  const distanceInfo = getSpotDistanceInfo(
    spot,
    location ? { lat: location.lat, lon: location.lon } : null,
  );

  const showRemoveIcon = toggleIconVariant === "trash";
  const ToggleIcon = showRemoveIcon ? Trash2 : Heart;
  const toggleClassName = showRemoveIcon
    ? isSaved
      ? ""
      : "text-error"
    : isSaved
      ? "fill-surface"
      : "";

  return (
    <div data-spot-card className={cn(ROOT_CLASSES, className)}>
      <div className={IMAGE_WRAPPER_CLASSES}>
        <button
          type="button"
          onClick={handleOpen}
          aria-label={`Open ${spot.name} in ${spot.city} (${spot.type} spot)`}
          className="absolute inset-0 z-0 cursor-pointer"
        >
          <span className="visually-hidden">Open {spot.name}</span>
          <Image
            src={spot.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 pointer-events-none"
            referrerPolicy="no-referrer"
            unoptimized
          />
        </button>

        <button
          type="button"
          onClick={handleToggle}
          aria-pressed={isSaved}
          aria-label={toggleAriaLabel(spot, isSaved, removeCopy)}
          className={cn(
            TOGGLE_BASE_CLASSES,
            isSaved ? TOGGLE_SAVED_CLASSES : TOGGLE_DEFAULT_CLASSES,
          )}
        >
          <ToggleIcon
            size={14}
            aria-hidden="true"
            className={toggleClassName}
          />
        </button>

        <span aria-hidden="true" className={TYPE_BADGE_CLASSES}>
          {spot.type}
        </span>
      </div>

      <button type="button" onClick={handleOpen} className={CONTENT_CLASSES}>
        <div>
          <span className="font-mono text-[9px] font-bold text-secondary uppercase tracking-wider block mb-1">
            {distanceInfo.kind === "distance" ? distanceInfo.label : "—"}
          </span>
          <h3 className="font-display text-base font-bold tracking-wide text-on-surface uppercase group-hover:underline">
            {spot.name}
          </h3>
          <p className="mt-1 text-xs text-secondary flex items-center">
            <MapPin size={11} className="mr-1 shrink-0" aria-hidden="true" />
            {spot.city}
          </p>
        </div>

        <div className={HOVER_BAR_CLASSES}>
          <div className="flex items-center space-x-1">
            <span
              aria-hidden="true"
              className={cn("h-1.5 w-1.5 rounded-full", "bg-primary")}
            />
            <span className="text-secondary uppercase">
              {spot.sports.join("|")}
            </span>
          </div>
          <span
            aria-hidden="true"
            className="text-primary font-semibold uppercase"
          >
            View details
          </span>
        </div>
      </button>
    </div>
  );
}

export const ExploreSpotCard = memo(function ExploreSpotCard(
  props: BaseSpotCardProps,
) {
  return (
    <BaseSpotCardImpl {...props} toggleIconVariant="heart" removeCopy={false} />
  );
});

export const SavedSpotCard = memo(function SavedSpotCard(
  props: BaseSpotCardProps,
) {
  return (
    <BaseSpotCardImpl {...props} toggleIconVariant="trash" removeCopy={true} />
  );
});
