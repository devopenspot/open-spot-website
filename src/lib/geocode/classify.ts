import type { NominatimResponse } from "./nominatim-types"

/**
 * Maps a Nominatim reverse-geocode result to a default spot type
 * **slug** (matches the `spot_types.slug` DB column). The mapping is
 * fuzzy because Nominatim's `class` / `type` taxonomy doesn't map
 * cleanly to the skate-spot taxonomy. The result is a default only —
 * the admin can override it on the form.
 *
 * The slug values must stay in sync with
 * `src/db/seed-data/taxonomy.ts → SPOT_TYPE_SEED`. This file is the
 * single hand-maintained mapping between OSM tags and our taxonomy;
 * the rest of the app reads the list of valid slugs from the DB.
 */
export function classifySpotType(raw: NominatimResponse): string {
  const cls = raw.class?.toLowerCase() ?? ""
  const type = raw.type?.toLowerCase() ?? ""
  const extratags = (raw.extratags ?? {}) as Record<string, string>
  const extratagStr = Object.entries(extratags)
    .map(([k, v]) => `${k}=${String(v).toLowerCase()}`)
    .join(" ")

  const haystack = `${cls} ${type} ${extratagStr}`.toLowerCase()

  // Highest specificity first — Bowl beats Pool, Ledges beats Plaza, etc.
  if (/\bbowl\b|\bpools?\b|\bswimming_pool\b/.test(haystack)) {
    if (/\bbowl\b/.test(haystack)) return "bowl"
    return "pools"
  }
  if (/\bledges?\b|\bcurb\b|\brail\b|\bbench\b/.test(haystack)) {
    return "ledges"
  }
  if (/\bdiy\b/.test(haystack)) return "diy"
  if (/\bstair\b|\bslidebox\b|\bstep\b/.test(haystack)) return "stair"
  if (/\bskatepark\b|\bskate_park\b|\bskateboard\b|\bskate-park\b/.test(haystack)) {
    return "park"
  }
  if (/\bpark\b|\bpitch\b|\bplayground\b/.test(haystack)) return "park"
  if (/\bplaza\b|\bsquare\b/.test(haystack)) return "plaza"

  // Class-based fallbacks.
  if (cls === "leisure") return "park"
  if (cls === "amenity") return "plaza"
  if (cls === "highway") return "plaza"
  if (cls === "railway") return "plaza"

  return "plaza"
}
