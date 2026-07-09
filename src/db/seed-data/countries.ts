import { COUNTRY_TO_ISO2, COUNTRY_TO_ISO3 } from "./iso-codes"
import { REGION_SEED } from "./regions"

export interface CountrySeed {
  iso2: string
  name: string
  iso3: string
  region: string
}

export function buildCountrySeed(): readonly CountrySeed[] {
  const out: CountrySeed[] = []
  for (const region of REGION_SEED) {
    for (const country of region.countries) {
      const iso2 = COUNTRY_TO_ISO2[country]
      if (!iso2) continue
      out.push({
        iso2,
        name: country,
        iso3: COUNTRY_TO_ISO3[iso2] ?? "",
        region: region.name,
      })
    }
  }
  return out
}
