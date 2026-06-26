export interface SpotForecast {
  day: string;
  icon: string; // e.g. "sunny", "partly_cloudy_day", "cloudy"
  temp: number;
}

export interface Spot {
  id: string;
  name: string;
  city: string;
  address: string;
  type: string; // 'Plaza' | 'DIY' | 'Stair' | 'Bowl' | 'Park' | 'Ledges' | 'Pools'
  distance: string;
  coordinates: { x: number; y: number }; // Percentage coords (0-100) for the simulated map layout
  image: string;
  features: string[];
  crowdLevel: number; // percentage (e.g. 85 for 85%)
  crowdLevelLabel: string;
  weather: {
    current: number;
    forecast: SpotForecast[];
  };
  communityNote: string;
  isSaved?: boolean;
}

export type TabType = 'explore' | 'saved' | 'map' | 'post';

export interface SearchState {
  isOpen: boolean;
  query: string;
}
