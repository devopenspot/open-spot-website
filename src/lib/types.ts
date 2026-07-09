import type { SportDiscipline } from "@/types/sport-events";

export type WeatherIconName =
  | "sunny"
  | "partly_cloudy_day"
  | "cloudy"
  | "rain"
  | "snow";

export interface SpotForecast {
  day: string;
  icon: WeatherIconName;
  temp: number;
}

/**
 * Canonical identifier for a spot category. The set of valid values is
 * the `spot_types` DB table; the value itself is the row's `slug`
 * (e.g. "plaza", "bowl"). The display name (e.g. "Plaza") is read from
 * `SpotTypeEntity` (sourced from the same table).
 */
export type SpotType = string;

export interface SpotTypeEntity {
  slug: string;
  name: string;
}

export interface SpotLocation {
  lat: number;
  lon: number;
}

export interface Spot {
  id: string;
  slug: string;
  name: string;
  city: string;
  citySlug: string;
  address: string;
  type: string;
  typeSlug: string;
  features: readonly string[];
  sports: readonly SportDiscipline[];
  image: string;
  communityNote: string;
  crowdLevel: number;
  crowdLevelLabel: string;
  country: string;
  countryCode: string;
  location: SpotLocation;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TabType = "explore" | "saved" | "map" | "post" | "events" | "admin";

export interface Region {
  name: string;
  desc: string;
  count: string;
  image: string;
  link: string;
  countries: readonly string[];
}

export interface Country {
  name: string;
  region: string;
}

export interface PresetImage {
  id?: string;
  slug?: string;
  name: string;
  url: string;
}
