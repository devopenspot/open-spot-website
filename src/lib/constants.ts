export const MAIN_CONTENT_ID = 'main-content';

export const CROWD_LEVEL = {
  LOW_MAX: 40,
  HIGH_MIN: 70,
} as const;

export function crowdLevelToLabel(level: number): string {
  if (level > CROWD_LEVEL.HIGH_MIN) return "High (Busy)";
  if (level > CROWD_LEVEL.LOW_MAX) return "Moderate Activity";
  return "Low Crowd (Ideal)";
}

export const MAP_VIEWPORT_OFFSET_PX = {
  DESKTOP: 60,
  MOBILE: 160,
} as const;

export const SEARCH_FOCUS_DELAY_MS = 150;

export const STORAGE_KEY_VERSION = 'v2';
