"use client";

import { useMemo } from "react";
import L from "leaflet";
import { Marker } from "react-leaflet";
import type { Spot, WeatherIconName } from "@/lib/types";
import type { SpotWeather } from "@/lib/weather/weather-cached";
import { weatherIconGlyph } from "@/components/spot/WeatherIcon";
import { getSpotDistanceInfo } from "@/lib/spots/geo";

const LABEL_MAX_CHARS = 14;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncateLabel(name: string): string {
  if (name.length <= LABEL_MAX_CHARS) return name;
  return `${name.slice(0, LABEL_MAX_CHARS - 1).trimEnd()}…`;
}

interface SpotMarkerProps {
  spot: Spot;
  isActive: boolean;
  isSaved: boolean;
  weather: SpotWeather | undefined;
  userLocation: { lat: number; lon: number } | null;
  onClick: (spot: Spot) => void;
}

interface BuildPinOptions {
  active: boolean;
  saved: boolean;
  weather: WeatherIconName | null;
  description: string | null;
  temp: number | null;
  distanceLabel: string;
  name: string;
}

function pickWeatherName(
  weather: SpotWeather | undefined,
): WeatherIconName | null {
  if (!weather) return null;
  return weather.forecast[0]?.icon ?? null;
}

function pickDescription(weather: SpotWeather | undefined): string | null {
  if (!weather) return null;
  return weather.forecast[0]?.description ?? null;
}

function pickTemperature(weather: SpotWeather | undefined): number | null {
  if (!weather) return null;
  return weather.current;
}

function buildSpotPinHTML(options: BuildPinOptions): string {
  const cls = ["leaflet-pin"];
  if (options.active) cls.push("leaflet-pin--active");
  else if (options.saved) cls.push("leaflet-pin--saved");

  const name = escapeHtml(truncateLabel(options.name));
  const description = escapeHtml(options.description ?? "—");
  const distance = escapeHtml(options.distanceLabel);

  const weatherGlyph = options.weather
    ? `<span class="leaflet-pin__weather">${weatherIconGlyph(options.weather, 28)}</span>`
    : `<span class="leaflet-pin__weather" aria-hidden="true"></span>`;

  const temp = `<span class="leaflet-pin__temp">${options.temp !== null ? `${options.temp}°C` : "—"}</span>`;

  const widthCls = options.active
    ? "w-[104px] sm:w-[116px] md:w-[120px] text-slate-800"
    : "w-[88px] sm:w-[100px] md:w-[108px]";

  return (
    `<div class="${cls.join(" ")} ">` +
    `<span class="leaflet-pin__label bg-slate-700 text-white">${name}</span>` +
    `<div class="leaflet-pin__square ${widthCls} bg-pink-50">` +
    weatherGlyph +
    temp +
    `</div>` +
    `<span class="leaflet-pin__label truncate bg-blue-100 text-slate-800">${description}</span>` +
    `<span class="leaflet-pin__label truncate bg-pink-100 text-slate-800">${distance}</span>` +
    `</div>`
  );
}

export function SpotMarker({
  spot,
  isActive,
  isSaved,
  weather,
  userLocation,
  onClick,
}: SpotMarkerProps) {
  const distanceInfo = getSpotDistanceInfo(
    spot,
    userLocation ? { lat: userLocation.lat, lon: userLocation.lon } : null,
  );
  const distanceLabel =
    distanceInfo.kind === "distance" ? distanceInfo.label : "—";

  const icon = useMemo(() => {
    const html = buildSpotPinHTML({
      active: isActive,
      saved: isSaved,
      weather: pickWeatherName(weather),
      description: pickDescription(weather),
      temp: pickTemperature(weather),
      distanceLabel,
      name: spot.name,
    });
    return L.divIcon({
      className: "leaflet-pin-wrapper",
      iconSize: isActive ? [120, 76] : [108, 72],
      iconAnchor: isActive ? [60, 24] : [54, 20],
      html,
    });
  }, [isActive, isSaved, weather, distanceLabel, spot.name]);

  return (
    <Marker
      position={[spot.location.lat, spot.location.lon]}
      icon={icon}
      eventHandlers={{ click: () => onClick(spot) }}
      title={spot.name}
      alt={spot.name}
    />
  );
}
