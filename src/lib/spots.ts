import { cache } from "react";
import {
  DEFAULT_PRESET_IMAGES,
  EXPLORE_CATEGORIES,
  LEGENDARY_TERRAINS,
  POPULAR_SEARCH_TERMS,
  RECENT_SEARCHES,
  REGIONS_DATA,
  TERRAIN_OPTIONS,
} from "@/data";

export const getExploreCategories = cache(() => EXPLORE_CATEGORIES);
export const getLegendaryTerrains = cache(() => LEGENDARY_TERRAINS);
export const getRegions = cache(() => REGIONS_DATA);
export const getPopularSearchTerms = cache(() => POPULAR_SEARCH_TERMS);
export const getRecentSearches = cache(() => RECENT_SEARCHES);
export const getPresetImages = cache(() => DEFAULT_PRESET_IMAGES);
export const getTerrainOptions = cache(() => TERRAIN_OPTIONS);

/**
 * Pick a deterministic preset image URL for a spot that has no image. Used
 * at the data boundary so `Spot.image` is never an empty string at the
 * render layer (which would make `next/image` warn). A given seed always
 * resolves to the same fallback.
 */
export function pickFallbackImage(seed: string): string {
  const presets = getPresetImages();
  if (presets.length === 0) return "";
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return presets[Math.abs(h) % presets.length]!.url;
}
