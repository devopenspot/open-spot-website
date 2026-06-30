import { cache } from "react"
import {
  DEFAULT_PRESET_IMAGES,
  EXPLORE_CATEGORIES,
  LEGENDARY_TERRAINS,
  POPULAR_SEARCH_TERMS,
  RECENT_SEARCHES,
  REGIONS_DATA,
  TERRAIN_OPTIONS,
} from "@/data"

export const getExploreCategories = cache(() => EXPLORE_CATEGORIES)
export const getLegendaryTerrains = cache(() => LEGENDARY_TERRAINS)
export const getRegions = cache(() => REGIONS_DATA)
export const getPopularSearchTerms = cache(() => POPULAR_SEARCH_TERMS)
export const getRecentSearches = cache(() => RECENT_SEARCHES)
export const getPresetImages = cache(() => DEFAULT_PRESET_IMAGES)
export const getTerrainOptions = cache(() => TERRAIN_OPTIONS)

