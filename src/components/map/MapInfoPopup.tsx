"use client";

import Image from "next/image";
import { MapPin, Share2, X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useRef } from "react";
import { showToast } from "@/hooks/useToast";
import { cn } from "@/lib/cn";
import type { Spot } from "@/lib/types";
import type { SpotWeather } from "@/lib/weather/weather-cached";
import { WeatherIcon } from "@/components/spot/WeatherIcon";
import { WeatherAccuracyNote } from "@/components/spot/WeatherAccuracyNote";
import { TypeBadges } from "@/components/spot/TypeBadges";

interface MapInfoPopupProps {
  spot: Spot;
  weather: Record<string, SpotWeather>;
  isSaved: boolean;
  onClose: () => void;
  onOpen: (spot: Spot) => void;
  onToggleSave: (id: string) => void;
}

export function MapInfoPopup({
  spot,
  weather,
  isSaved,
  onClose,
  onOpen,
  onToggleSave,
}: MapInfoPopupProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, true);
  useKeyboardShortcuts([{ key: "Escape", handler: onClose }]);

  const w = weather[spot.id];
  const current = w?.current;
  const description = w?.description;
  const weatherIcon = w?.forecast[0]?.icon;
  const windKmh = w?.wind != null ? Math.round(w.wind * 3.6) : null;
  const hasWeather = w != null;

  const handleShare = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/spots/${spot.id}`
        : `/spots/${spot.id}`;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showToast("Link copied to clipboard", "success");
      } else {
        showToast("Sharing not supported in this browser", "error");
      }
    } catch {
      showToast("Could not copy link", "error");
    }
  };

  return (
    <div
      ref={panelRef}
      id="map-info-popup"
      role="dialog"
      aria-labelledby="map-info-popup-title"
      tabIndex={-1}
      className="fixed top-16 md:top-4 md:absolute left-2 right-2 z-[1000] md:left-auto md:right-4 w-auto md:w-96 bg-surface/95 backdrop-blur-md border border-outline-variant shadow-lg p-4 animate-slide-up outline-none space-y-3"
    >
      <div className="flex items-start gap-3">
        <div className="relative h-16 w-16 bg-black overflow-hidden shrink-0">
          <Image
            src={spot.image}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
            referrerPolicy="no-referrer"
            unoptimized
          />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          {spot.types.length > 0 ? (
            <TypeBadges types={spot.types} variant="surface" />
          ) : null}
          <h4
            id="map-info-popup-title"
            className="block font-display text-sm font-bold tracking-wide uppercase text-on-surface truncate"
          >
            {spot.name}
          </h4>
          <p className="flex items-center text-[11px] text-secondary truncate">
            <MapPin size={11} className="mr-1 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {spot.city}
              {spot.country ? ` · ${spot.country}` : ""}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="shrink-0 -mt-1 -mr-1 flex h-7 w-7 items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-container transition-all"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      <div className="border-t border-outline-variant/60 pt-3">
        <div className="flex items-center gap-3">
          {weatherIcon ? (
            <WeatherIcon name={weatherIcon} size={28} className="shrink-0" />
          ) : (
            <span className="w-7 h-7 shrink-0" aria-hidden="true" />
          )}
          <div className="flex flex-col leading-tight">
            <span className="font-display text-xl font-bold tracking-tight text-on-surface">
              {current !== undefined ? `${current}°C` : "—"}
            </span>
            <span className="text-[11px] text-secondary truncate">
              {description ?? (hasWeather ? "—" : "Weather unavailable")}
            </span>
          </div>
          <dl className="ml-auto flex divide-x divide-outline-variant/60 text-center">
            <div className="flex flex-col items-center justify-center px-3 first:pl-0">
              <dt className="font-mono text-[9px] tracking-wider text-secondary uppercase">
                Min/Max
              </dt>
              <dd className="font-mono text-xs font-semibold text-on-surface whitespace-nowrap">
                {w?.tempMin != null && w?.tempMax != null
                  ? `${w.tempMin}°/${w.tempMax}°`
                  : "—"}
              </dd>
            </div>
            <div className="flex flex-col items-center justify-center px-3 last:pr-0">
              <dt className="font-mono text-[9px] tracking-wider text-secondary uppercase">
                Wind
              </dt>
              <dd className="font-mono text-xs font-semibold text-on-surface whitespace-nowrap">
                {windKmh !== null ? `${windKmh} km/h` : "—"}
              </dd>
            </div>
          </dl>
        </div>
        <div className="mt-2">
          <WeatherAccuracyNote variant="block" />
        </div>
      </div>

      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={handleShare}
          aria-label={`Copy link to ${spot.name}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center border border-outline text-on-surface hover:bg-surface-container transition-all"
        >
          <Share2 size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onToggleSave(spot.id)}
          aria-pressed={isSaved}
          aria-label={isSaved ? `Unsave ${spot.name}` : `Save ${spot.name}`}
          className={cn(
            "h-9 px-3 text-[10px] font-bold tracking-widest uppercase transition-all border",
            isSaved
              ? "bg-primary text-on-primary border-primary hover:bg-primary/95"
              : "border-outline text-secondary hover:bg-surface-container hover:text-on-surface",
          )}
        >
          {isSaved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => onOpen(spot)}
          className="flex-1 h-9 bg-on-surface text-surface text-[10px] font-bold tracking-widest uppercase hover:bg-on-surface/90 transition-all text-center"
        >
          Full info
        </button>
      </div>
    </div>
  );
}
