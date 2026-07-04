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

export type SpotType =
  | "Plaza"
  | "DIY"
  | "Stair"
  | "Bowl"
  | "Park"
  | "Ledges"
  | "Pools";

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
  type: SpotType;
  features: readonly string[];
  image: string;
  communityNote: string;
  crowdLevel: number;
  crowdLevelLabel: string;
  country: string;
  location: SpotLocation;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TabType = "explore" | "saved" | "map" | "post" | "events" | "admin";

export interface ExploreCategory {
  name: string;
  image: string;
}

export interface LegendaryTerrain {
  name: string;
  desc: string;
  image: string;
}

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
  name: string;
  url: string;
}

export interface TerrainOption {
  value: SpotType;
  label: string;
}
