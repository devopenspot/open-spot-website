import type { NominatimResponse } from "./nominatim-types"
import type { SpotType } from "@/lib/types"

/**
 * Maps a Nominatim reverse-geocode result to a default `SpotType`. The
 * mapping is fuzzy because Nominatim's `class` / `type` taxonomy doesn't
 * map cleanly to the skate-spot taxonomy. The result is a default only —
 * the admin can override it on the form.
 */
export function classifySpotType(raw: NominatimResponse): SpotType {
  const cls = raw.class?.toLowerCase() ?? ""
  const type = raw.type?.toLowerCase() ?? ""
  const extratags = (raw.extratags ?? {}) as Record<string, string>
  const extratagStr = Object.entries(extratags)
    .map(([k, v]) => `${k}=${String(v).toLowerCase()}`)
    .join(" ")

  const haystack = `${cls} ${type} ${extratagStr}`.toLowerCase()

  // Highest specificity first — Bowl beats Pool, Ledges beats Plaza, etc.
  if (/\bbowl\b|\bpools?\b|\bswimming_pool\b/.test(haystack)) {
    if (/\bbowl\b/.test(haystack)) return "Bowl"
    return "Pools"
  }
  if (/\bledges?\b|\bcurb\b|\brail\b|\bbench\b/.test(haystack)) {
    return "Ledges"
  }
  if (/\bdiy\b/.test(haystack)) return "DIY"
  if (/\bstair\b|\bslidebox\b|\bstep\b/.test(haystack)) return "Stair"
  if (/\bskatepark\b|\bskate_park\b|\bskateboard\b|\bskate-park\b/.test(haystack)) {
    return "Park"
  }
  if (/\bpark\b|\bpitch\b|\bplayground\b/.test(haystack)) return "Park"
  if (/\bplaza\b|\bsquare\b/.test(haystack)) return "Plaza"

  // Class-based fallbacks.
  if (cls === "leisure") return "Park"
  if (cls === "amenity") return "Plaza"
  if (cls === "highway") return "Plaza"
  if (cls === "railway") return "Plaza"

  return "Plaza"
}
