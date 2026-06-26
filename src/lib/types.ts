export type WeatherIconName =
  | 'sunny'
  | 'partly_cloudy_day'
  | 'cloudy'
  | 'rain'
  | 'snow';

export interface SpotForecast {
  day: string;
  icon: WeatherIconName;
  temp: number;
}

export type SpotType =
  | 'Plaza'
  | 'DIY'
  | 'Stair'
  | 'Bowl'
  | 'Park'
  | 'Ledges'
  | 'Pools';

export interface Spot {
  id: string;
  name: string;
  city: string;
  address: string;
  type: SpotType;
  distance: string;
  coordinates: { x: number; y: number };
  image: string;
  features: string[];
  crowdLevel: number;
  crowdLevelLabel: string;
  weather: {
    current: number;
    forecast: SpotForecast[];
  };
  communityNote: string;
  isSaved?: boolean;
}

export type TabType = 'explore' | 'saved' | 'map' | 'post';

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
}

export interface PresetImage {
  name: string;
  url: string;
}

export interface TerrainOption {
  value: SpotType;
  label: string;
}
