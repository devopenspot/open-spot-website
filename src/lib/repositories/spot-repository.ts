import type { Spot } from "@/lib/types"
import type { NewSpot, SpotListResult, SpotPatch, SpotQuery } from "./types"

export interface SpotRepository {
  list(query?: SpotQuery): Promise<SpotListResult>
  findById(id: string): Promise<Spot | null>
  findBySlug(slug: string): Promise<Spot | null>
  findNearby(params: { lat: number; lon: number; radiusMeters: number }): Promise<readonly Spot[]>
  listCountries(): Promise<readonly { name: string; region: string; count: number }[]>
  listCountriesForRegion(region: string): Promise<readonly { name: string; count: number }[]>
  listTypes(): Promise<readonly { name: Spot['type']; count: number }[]>
  listAllSpotTypes(): Promise<
    readonly { slug: string; name: string; sortOrder: number }[]
  >
  listRegions(): Promise<readonly { name: string; countryCount: number; spotCount: number }[]>
  create(input: NewSpot): Promise<Spot>
  update(id: string, patch: SpotPatch): Promise<Spot>
  delete(id: string): Promise<void>
}