"use client";

import Image from "next/image";
import { MapPin, X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useRef } from "react";
import type { Spot } from "@/lib/types";
import type { SpotWeather } from "@/lib/weather/weather-cached";
import { WeatherIcon } from "@/components/spot/WeatherIcon";

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
  const weatherIcon = w?.forecast[0]?.icon;

  return (
    <div
      ref={panelRef}
      id="map-info-popup"
      role="dialog"
      aria-labelledby="map-info-popup-title"
      tabIndex={-1}
      className="fixed top-0 md:top-4 md:absolute left-0 right-4 z-[1000] md:left-auto md:right-4 w-full md:w-80 bg-surface/95 backdrop-blur-md rounded-xl border border-outline-variant shadow-lg p-4 animate-slide-up outline-none"
    >
      <div className="flex space-x-3">
        <div className="relative h-16 w-16 bg-black rounded-lg overflow-hidden shrink-0">
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

        <div className="flex-1 min-w-16">
          <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider text-primary mb-1">
            {spot.type}
          </span>
          <h4
            id="map-info-popup-title"
            className="font-display text-sm font-bold tracking-wide uppercase text-on-surface truncate"
          >
            {spot.name}
          </h4>
          <p className="text-[10px] text-secondary flex items-center">
            <MapPin size={10} className="mr-0.5" aria-hidden="true" />
            {spot.city}
            {spot.country ? ` • ${spot.country}` : ""}
          </p>
        </div>

        <div>
          <span className="block text-[8px] text-secondary">Air temp</span>
          <span className="font-semibold text-on-surface flex items-center gap-1">
            {weatherIcon ? <WeatherIcon name={weatherIcon} size={12} /> : null}
            {current !== undefined ? `${current}°C` : "—"}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="self-start rounded p-1 text-secondary hover:text-on-surface hover:bg-surface-container"
        >
          <X size={12} aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-outline-variant/60 text-[10px] font-mono"></div>

      <div className="flex space-x-2 mt-4">
        <button
          type="button"
          onClick={() => onOpen(spot)}
          className="flex-1 bg-on-surface text-surface py-1.5 rounded-md text-[10px] font-bold tracking-wider uppercase hover:bg-on-surface/90 transition-all text-center"
        >
          Full info matrix
        </button>
        <button
          type="button"
          onClick={() => onToggleSave(spot.id)}
          aria-pressed={isSaved}
          className={`px-2.5 border rounded-md text-[10px] font-bold tracking-wider uppercase transition-all ${
            isSaved
              ? "border-primary bg-primary text-surface"
              : "border-outline text-secondary hover:bg-surface-container"
          }`}
        >
          {isSaved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
