import type { z } from "zod"
import type { Spot, SpotType } from "@/lib/types"
import type { SpotQuerySchema, NewSpotSchema, SpotPatchSchema } from "@/lib/schemas/spot"
import type { SportDiscipline, SportEventTier } from "@/types/sport-events"

export type SpotQuery = z.infer<typeof SpotQuerySchema>
export type NewSpot = z.infer<typeof NewSpotSchema>
export type SpotPatch = z.infer<typeof SpotPatchSchema>

export interface SpotListResult {
  items: readonly Spot[]
  nextCursor: string | null
}

export interface SpotFacetCountry {
  name: string
  region: string
  count: number
}

export interface SpotFacetCountryForRegion {
  name: string
  count: number
}

export interface SpotFacetType {
  name: SpotType
  count: number
}

export interface SpotFacetRegion {
  name: string
  countryCount: number
  spotCount: number
}

export interface SportEventFacetCountry {
  name: string
  count: number
}

export interface SportEventFacetTier {
  name: SportEventTier
  count: number
}

export interface SportEventFacetDiscipline {
  name: SportDiscipline
  count: number
}