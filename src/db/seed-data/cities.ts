import { REGION_SEED, type RegionSeedCountry } from "./regions";

/**
 * Pure accessor for the denormalized "main cities" data attached to each
 * country in `REGION_SEED`. Cities are not persisted to the DB; they live
 * here as seed-only metadata and are exposed to UI surfaces that want to
 * suggest or pre-fill a city for a given country/region.
 */

export interface CountryCities {
  name: string;
  cities: readonly string[];
}

const ALL_COUNTRY_CITIES: readonly CountryCities[] = REGION_SEED.flatMap(
  (r) => r.countries,
);

const BY_COUNTRY_NAME: ReadonlyMap<string, readonly string[]> = new Map(
  ALL_COUNTRY_CITIES.map((c) => [c.name, c.cities] as const),
);

const BY_REGION_SLUG: ReadonlyMap<string, readonly CountryCities[]> = new Map(
  REGION_SEED.map((r) => [r.slug, r.countries] as const),
);

const COUNTRY_TO_REGION_SLUG: ReadonlyMap<string, string> = new Map(
  REGION_SEED.flatMap((r) => r.countries.map((c) => [c.name, r.slug] as const)),
);

export function getCitiesForCountry(name: string): readonly string[] {
  return BY_COUNTRY_NAME.get(name) ?? [];
}

export function getCitiesForRegion(
  slug: string,
): readonly CountryCities[] {
  return BY_REGION_SLUG.get(slug) ?? [];
}

export function getRegionSlugForCountry(name: string): string | null {
  return COUNTRY_TO_REGION_SLUG.get(name) ?? null;
}

export function listAllCountryCities(): readonly CountryCities[] {
  return ALL_COUNTRY_CITIES;
}

export type { RegionSeedCountry };
