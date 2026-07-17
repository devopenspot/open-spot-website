"use client";

import { useCallback, useId } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Loader2,
  MapPin,
  Heart,
  Share2,
  ExternalLink,
  Navigation,
} from "lucide-react";
import { WeatherIcon } from "./WeatherIcon";
import { WeatherAccuracyNote } from "./WeatherAccuracyNote";
import { TypeBadges } from "./TypeBadges";
import { showToast } from "@/hooks/useToast";
import { useUserLocation } from "@/hooks/useUserLocation";
import { cn } from "@/lib/cn";
import { getSpotDistanceInfo } from "@/lib/spots/geo";
import type { ForecastSlot, Spot, SpotForecast } from "@/lib/types";
import type { SpotWeather } from "@/lib/weather/weather-cached";

interface SpotDetailsContentProps {
  spot: Spot;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  weather?: SpotWeather;
}

function groupForecastByDay(
  forecast: readonly SpotForecast[] | undefined,
): SpotForecast[][] {
  if (!forecast || forecast.length === 0) return [];
  const groups: SpotForecast[][] = [];
  for (const entry of forecast) {
    const last = groups[groups.length - 1];
    if (last && last[0] && last[0].day === entry.day) {
      last.push(entry);
    } else {
      groups.push([entry]);
    }
  }
  return groups;
}

export function SpotDetailsContent({
  spot,
  isSaved,
  onToggleSave,
  weather,
}: SpotDetailsContentProps) {
  const titleId = useId();
  const router = useRouter();
  const { status: locationStatus, location, request } = useUserLocation();
  const distanceInfo = getSpotDistanceInfo(
    spot,
    location ? { lat: location.lat, lon: location.lon } : null,
  );
  const isRequestingLocation = locationStatus === "requesting";
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    spot.name + " " + spot.address,
  )}`;
  const wazeUrl = `https://waze.com/ul?ll=${spot.location.lat},${spot.location.lon}&navigate=yes`;

  const handleRequestLocation = useCallback(async () => {
    if (isRequestingLocation) return;
    const next = await request();
    if (next === "denied") {
      showToast("Location access denied — distance unavailable.", "error");
    } else if (next === "unavailable") {
      showToast(
        "Geolocation unavailable in this browser — distance unavailable.",
        "error",
      );
    } else if (next === "granted") {
      showToast("Distance ready.", "success");
    }
  }, [isRequestingLocation, request]);

  const handleShare = async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
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

  const windKmh = weather?.wind != null ? Math.round(weather.wind * 3.6) : null;
  const currentIcon = weather?.forecast?.[0]?.icon ?? "sunny";
  const forecastByDay = groupForecastByDay(weather?.forecast);
  const forecastSlots: ForecastSlot[] = ["morning", "afternoon", "night"];
  return (
    <div className="flex flex-col md:flex-row w-full">
      <div className="relative h-64 w-full bg-black md:h-auto md:max-h-[640px] md:w-1/2 overflow-hidden group">
        <Image
          src={spot.image}
          alt={spot.name}
          fill
          sizes="100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          referrerPolicy="no-referrer"
          unoptimized
          priority
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 text-white">
          {spot.types.length > 0 ? (
            <div className="mb-2">
              <TypeBadges types={spot.types} variant="overlay" />
            </div>
          ) : null}
          <h2
            id={titleId}
            className="font-display text-2xl font-bold tracking-wide leading-tight uppercase sm:text-3xl"
          >
            {spot.name}
          </h2>
          <p className="mt-1 flex items-center text-xs text-slate-300">
            <MapPin size={12} className="mr-1 shrink-0" aria-hidden="true" />
            {spot.city}
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pt-6 md:pt-0 md:px-8 no-scrollbar flex flex-col justify-between bg-surface">
        <div>
          <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-5 gap-2">
            {distanceInfo.kind === "distance" ? (
              <span className="inline-flex h-9 items-center font-mono text-xs font-semibold tracking-wider text-secondary uppercase">
                {distanceInfo.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestLocation}
                disabled={isRequestingLocation}
                aria-busy={isRequestingLocation}
                aria-label="Share your location to see distance from this spot"
                className="group inline-flex h-9 items-center gap-1.5 font-mono text-xs font-semibold tracking-wider text-primary uppercase hover:underline disabled:opacity-60 disabled:cursor-wait disabled:no-underline"
              >
                {isRequestingLocation ? (
                  <Loader2
                    size={12}
                    aria-hidden="true"
                    className="animate-spin"
                  />
                ) : (
                  <MapPin
                    size={12}
                    aria-hidden="true"
                    className="transition-transform group-hover:scale-110"
                  />
                )}
                <span>
                  {isRequestingLocation ? "Locating…" : distanceInfo.label}
                </span>
              </button>
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onToggleSave(spot.id)}
                aria-pressed={isSaved}
                aria-label={
                  isSaved ? `Unsave ${spot.name}` : `Save ${spot.name}`
                }
                className={cn(
                  "flex h-9 items-center space-x-1.5 rounded-full px-4 text-xs font-semibold tracking-wider uppercase transition-all border",
                  isSaved
                    ? "bg-primary text-surface border-primary hover:bg-primary/95"
                    : "border-outline text-on-surface hover:bg-surface-container",
                )}
              >
                <Heart
                  size={14}
                  aria-hidden="true"
                  className={isSaved ? "fill-surface" : ""}
                />
                <span className="text-[10px]">
                  {isSaved ? "Saved" : "Save spot"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                aria-label="Copy link to this spot"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-outline text-on-surface hover:bg-surface-container transition-all"
              >
                <Share2 size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="mb-6 rounded-xl bg-surface-container-low border border-outline-variant p-4 md:p-6">
            <span className="block font-mono text-[10px] tracking-wider text-secondary uppercase mb-2">
              Weather status
            </span>
            <WeatherAccuracyNote variant="block" className="mb-3" />
            <div className="mb-4 flex items-center gap-3 md:gap-4 min-w-0 overflow-hidden border-b border-outline-variant/40 pb-4">
              <WeatherIcon name={currentIcon} size={40} className="shrink-0" />
              <div className="flex min-w-0 shrink flex-col items-center justify-center text-center">
                <span className="block whitespace-nowrap text-2xl font-display font-bold tracking-tight leading-none">
                  {weather?.current ?? "—"}°C
                </span>
                <span className="mt-1 block w-full truncate text-[10px] text-secondary font-mono">
                  {weather?.description ?? "—"}
                </span>
              </div>
              <dl className="ml-auto flex min-w-0 flex-row gap-2 divide-x divide-outline-variant/60 overflow-hidden text-center">
                <div className="flex min-w-0 basis-0 flex-1 flex-col items-center justify-center gap-0.5 first:pl-0 last:pr-0 px-2">
                  <dt className="whitespace-nowrap text-[10px] font-mono tracking-wider text-secondary uppercase">
                    Wind
                  </dt>
                  <dd className="w-full truncate text-xs font-semibold text-on-surface font-mono">
                    {windKmh !== null ? `${windKmh} km/h` : "—"}
                  </dd>
                </div>
                <div className="flex min-w-0 basis-0 flex-1 flex-col items-center justify-center gap-0.5 px-2">
                  <dt className="whitespace-nowrap text-[10px] font-mono tracking-wider text-secondary uppercase">
                    Humidity
                  </dt>
                  <dd className="w-full truncate text-xs font-semibold text-on-surface font-mono">
                    {weather?.humidity != null ? `${weather.humidity}%` : "—"}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="block font-mono text-[9px] tracking-wider text-secondary uppercase">
                Forecast Min / Max
              </span>
              <span className="block font-mono text-[9px] tracking-wider text-secondary uppercase">
                Morning / Afternoon / Night
              </span>
            </div>

            {forecastByDay.length === 0 ? (
              <p className="text-[10px] text-secondary font-mono py-2">
                Forecast unavailable
              </p>
            ) : (
              <div>
                {forecastByDay.map((dayEntries, dayIdx) => {
                  const temps = dayEntries.map((e) => e.temp);
                  const dayMin = temps.length > 0 ? Math.min(...temps) : null;
                  const dayMax = temps.length > 0 ? Math.max(...temps) : null;
                  return (
                    <div
                      key={`${dayEntries[0]?.day ?? dayIdx}-${dayIdx}`}
                      className="flex items-center gap-3 py-2.5 border-t border-outline-variant/40 first:border-t-0"
                    >
                      <span className="w-10 shrink-0 font-mono text-[10px] font-bold uppercase text-on-surface">
                        {dayEntries[0]?.day ?? "—"}
                      </span>
                      <span className="font-display text-sm font-bold text-on-surface font-mono">
                        {dayMin !== null && dayMax !== null
                          ? `${dayMin}° / ${dayMax}°`
                          : "—"}
                      </span>
                      <div className="ml-auto flex items-center gap-3">
                        {forecastSlots.map((slot) => {
                          const entry = dayEntries.find((e) => e.slot === slot);
                          if (!entry) {
                            return (
                              <span
                                key={slot}
                                className="flex items-center gap-1 text-[10px] font-mono text-secondary"
                                title={`${slot} unavailable`}
                              >
                                <span>—</span>
                              </span>
                            );
                          }
                          return (
                            <span
                              key={slot}
                              className="flex items-center gap-1 text-[10px] font-mono"
                              title={entry.description}
                            >
                              <WeatherIcon name={entry.icon} size={12} />
                              <span className="font-semibold text-on-surface">
                                {entry.temp}°
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mb-6 rounded-xl bg-surface-container-low border border-outline-variant p-4 md:p-6">
            <span className="block font-mono text-[10px] tracking-wider text-secondary uppercase mb-2">
              Location address
            </span>
            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
              {spot.address}
            </p>
            <div className="mt-4 pt-4 border-t border-outline-variant/40 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <div>
                {/* TODO: PUT HERE A list of the sports and spot type  */}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-outline-variant pt-4 flex flex-col sm:flex-row gap-2 sm:gap-x-3">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex min-h-10 items-center justify-center space-x-1.5 rounded-lg bg-on-surface text-surface text-xs font-bold tracking-widest uppercase hover:bg-on-surface/90 transition-all shadow-sm"
          >
            <span>G-Maps</span>
            <ExternalLink size={12} aria-hidden="true" />
          </a>
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex min-h-10 items-center justify-center space-x-1.5 rounded-lg bg-on-surface text-surface text-xs font-bold tracking-widest uppercase hover:bg-on-surface/90 transition-all shadow-sm"
          >
            <span>Waze</span>
            <Navigation size={12} className="mr-1" aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 flex min-h-10 items-center justify-center rounded-lg border border-outline text-xs font-bold tracking-widest uppercase hover:bg-surface-container transition-all"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
