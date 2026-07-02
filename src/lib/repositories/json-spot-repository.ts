import spotsJson from "@/data/spots.json"
import { COUNTRY_NAME_OVERRIDES, COUNTRY_TO_REGION, DEFAULT_PRESET_IMAGES } from "@/data"
import { SpotSchema } from "@/lib/schemas/spot"
import type { Spot, SpotType } from "@/lib/types"
import { hashToUnitInterval } from "@/lib/spots/geo"
import type { NewSpot, SpotListResult, SpotPatch, SpotQuery } from "./types"
import type { SpotRepository } from "./spot-repository"

const CURATED_TIMESTAMP = "2024-01-01T00:00:00.000Z"
const DEFAULT_REGION = "Americas"

interface RawAddress {
  city?: string
  town?: string
  village?: string
  suburb?: string
  county?: string
  state?: string
  country?: string
  [key: string]: string | undefined
}

interface RawSpot {
  slug?: string
  city_slug?: string
  country_slug?: string
  place_id: number
  lat: string
  lon: string
  address?: RawAddress
  display_name?: string
  name: string
  spot_types?: string[]
}

const SOURCE_SPOTS = spotsJson as RawSpot[]

const TYPE_PRIORITY: readonly { match: RegExp; type: SpotType }[] = [
  { match: /\bbowl\b/i, type: "Bowl" },
  { match: /\bpools?\b/i, type: "Pools" },
  { match: /\bledges?\b/i, type: "Ledges" },
  { match: /^diy$/i, type: "DIY" },
  { match: /\bstairs?\b/i, type: "Stair" },
  { match: /\bslidebox\b/i, type: "Stair" },
  { match: /\bskatepark\b/i, type: "Park" },
  { match: /\brail\b/i, type: "Plaza" },
  { match: /\bstreet\b/i, type: "Plaza" },
  { match: /mini\s*ramp/i, type: "Bowl" },
]

function pickType(spotTypes: readonly string[] | undefined): SpotType {
  if (!spotTypes || spotTypes.length === 0) return "Plaza"
  for (const { match, type } of TYPE_PRIORITY) {
    const hit = spotTypes.find((t) => match.test(t))
    if (hit) return type
  }
  return "Plaza"
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

function pickFeatures(
  spotTypes: readonly string[] | undefined,
  usedType: SpotType,
): string[] {
  const base: string[] = []
  if (!spotTypes) {
    base.push("Smooth Concrete")
    return base
  }
  const used = TYPE_PRIORITY.find((p) => p.type === usedType)
  const filtered = spotTypes.filter((t) => !used || !used.match.test(t))
  for (const t of filtered) base.push(titleCase(t))
  if (base.length === 0) base.push("Smooth Concrete")
  if (!base.includes("Smooth Concrete")) base.push("Smooth Concrete")
  return base.slice(0, 5)
}

const CROWD_LABELS: Record<"low" | "mid" | "high", readonly string[]> = {
  low: [
    "Low (Spill Check Required)",
    "Low (Security Active)",
    "Low (Always Open)",
    "Low (Quiet Hours)",
  ],
  mid: [
    "Moderate (Prime Time: 5PM - 7PM)",
    "Moderate (Best at Night)",
    "Moderate (Prime Time: 3PM - 6PM)",
    "Moderate (Schoolyard Spot)",
  ],
  high: [
    "High (Prime Time: 2PM - 6PM)",
    "High (Vibrant Skate Community)",
    "High (Community Hub)",
    "High (Busy)",
  ],
}

function buildCrowdLabel(level: number, seed: string): string {
  const pool = CROWD_LABELS[level > 70 ? "high" : level > 40 ? "mid" : "low"]
  const idx = Math.floor(hashToUnitInterval(seed) * pool.length)
  return pool[idx]!
}

function buildCommunityNote(entry: RawSpot, type: SpotType, id: string): string {
  const a = entry.address ?? {}
  const city =
    a.city ||
    a.town ||
    a.suburb ||
    a.state ||
    a.country ||
    entry.display_name?.split(",")[0]?.trim() ||
    ""
  const handle = "@" + id.split("-").slice(0, 2).join("")
  const intros = ["Local intel", "Community intel", "Scout report", "Field notes"]
  const intro = intros[Math.floor(hashToUnitInterval(id) * intros.length)]
  const when =
    type === "Park"
      ? "open hours"
      : type === "Bowl" || type === "Pools"
        ? "early morning sessions"
        : "low-traffic windows"
  return `${intro} from ${city}: ride it during ${when}. — ${handle}`
}

function pickImage(id: string): string {
  if (DEFAULT_PRESET_IMAGES.length === 0) return ""
  const idx = Math.floor(hashToUnitInterval(id) * DEFAULT_PRESET_IMAGES.length)
  return DEFAULT_PRESET_IMAGES[idx]!.url
}

function buildId(entry: RawSpot): string {
  if (entry.slug) return entry.slug
  return String(entry.place_id)
}

function buildSlug(entry: RawSpot): string {
  if (entry.slug) return entry.slug
  return buildId(entry)
}

function buildCity(entry: RawSpot): string {
  const a = entry.address ?? {}
  return (
    a.city ||
    a.town ||
    a.village ||
    a.suburb ||
    a.county ||
    a.state ||
    entry.display_name?.split(",")[0]?.trim() ||
    ""
  )
}

function buildCitySlug(entry: RawSpot): string {
  if (entry.city_slug) return entry.city_slug
  return buildCity(entry)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function buildAddress(entry: RawSpot): string {
  return entry.display_name ?? entry.name ?? ""
}

function buildSpot(entry: RawSpot): Spot {
  const id = buildId(entry)
  const lat = Number(entry.lat)
  const lon = Number(entry.lon)
  const type = pickType(entry.spot_types)
  const crowdLevel = Math.floor(hashToUnitInterval("crowd:" + id) * 100)
  const rawCountry = entry.address?.country ?? ""
  const country = COUNTRY_NAME_OVERRIDES[rawCountry] ?? rawCountry
  return {
    id,
    slug: buildSlug(entry),
    name: entry.name.toUpperCase(),
    city: buildCity(entry),
    citySlug: buildCitySlug(entry),
    address: buildAddress(entry),
    type,
    image: pickImage(id),
    features: pickFeatures(entry.spot_types, type),
    crowdLevel,
    crowdLevelLabel: buildCrowdLabel(crowdLevel, id),
    communityNote: buildCommunityNote(entry, type, id),
    country,
    location: { lat, lon },
    createdBy: null,
    createdAt: CURATED_TIMESTAMP,
    updatedAt: CURATED_TIMESTAMP,
  }
}

const EARTH_RADIUS_METERS = 6_371_000

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a))
}

function matchesQuery(spot: Spot, query: SpotQuery): boolean {
  if (query.type && spot.type !== query.type) return false
  if (query.country && spot.country !== query.country) return false
  if (query.city && spot.citySlug !== query.city) return false
  if (query.ids && !query.ids.includes(spot.id)) return false
  if (query.q) {
    const haystack = `${spot.name} ${spot.city} ${spot.address} ${spot.features.join(" ")} ${spot.country}`.toLowerCase()
    if (!haystack.includes(query.q.toLowerCase())) return false
  }
  if (query.near) {
    const dist = haversineMeters(
      query.near.lat,
      query.near.lon,
      spot.location.lat,
      spot.location.lon,
    )
    if (dist > query.near.radiusMeters) return false
  }
  return true
}

export class JsonSpotRepository implements SpotRepository {
  private spots: Spot[]

  constructor(spots: readonly Spot[] = SpotSchema.array().parse(
    SOURCE_SPOTS.map((entry) => buildSpot(entry)),
  )) {
    this.spots = [...spots]
  }

  async list(query?: SpotQuery): Promise<SpotListResult> {
    const limit = query?.limit ?? 50
    const filtered = query ? this.spots.filter((s) => matchesQuery(s, query)) : [...this.spots]
    const sorted = [...filtered].sort((a, b) => a.slug.localeCompare(b.slug))
    const startIdx = query?.cursor
      ? sorted.findIndex((s) => s.slug > query.cursor!)
      : 0
    const sliceStart = startIdx < 0 ? sorted.length : startIdx
    const items = sorted.slice(sliceStart, sliceStart + limit)
    const nextCursor =
      sliceStart + limit < sorted.length ? (items[items.length - 1]?.slug ?? null) : null
    return { items, nextCursor }
  }

  async findById(id: string): Promise<Spot | null> {
    return this.spots.find((s) => s.id === id) ?? null
  }

  async findBySlug(slug: string): Promise<Spot | null> {
    return this.spots.find((s) => s.slug === slug) ?? null
  }

  async findNearby(params: { lat: number; lon: number; radiusMeters: number }): Promise<readonly Spot[]> {
    return this.spots.filter((s) =>
      haversineMeters(params.lat, params.lon, s.location.lat, s.location.lon) <=
      params.radiusMeters,
    )
  }

  async listCountries(): Promise<readonly { name: string; region: string; count: number }[]> {
    const counts = new Map<string, { region: string; count: number }>()
    for (const spot of this.spots) {
      const region = COUNTRY_TO_REGION[spot.country] ?? DEFAULT_REGION
      const existing = counts.get(spot.country)
      if (existing) {
        existing.count++
      } else {
        counts.set(spot.country, { region, count: 1 })
      }
    }
    return [...counts.entries()].map(([name, v]) => ({ name, region: v.region, count: v.count }))
  }

  async listCountriesForRegion(region: string): Promise<readonly { name: string; count: number }[]> {
    const all = await this.listCountries()
    return all.filter((c) => c.region === region).map((c) => ({ name: c.name, count: c.count }))
  }

  async listTypes(): Promise<readonly { name: Spot["type"]; count: number }[]> {
    const counts = new Map<Spot["type"], number>()
    for (const spot of this.spots) {
      counts.set(spot.type, (counts.get(spot.type) ?? 0) + 1)
    }
    return [...counts.entries()].map(([name, count]) => ({ name, count }))
  }

  async listRegions(): Promise<readonly { name: string; countryCount: number; spotCount: number }[]> {
    const countries = await this.listCountries()
    const regions = new Map<string, { countryCount: Set<string>; spotCount: number }>()
    for (const c of countries) {
      const entry = regions.get(c.region) ?? { countryCount: new Set<string>(), spotCount: 0 }
      entry.countryCount.add(c.name)
      entry.spotCount += c.count
      regions.set(c.region, entry)
    }
    return [...regions.entries()].map(([name, v]) => ({
      name,
      countryCount: v.countryCount.size,
      spotCount: v.spotCount,
    }))
  }

  async create(input: NewSpot): Promise<Spot> {
    const now = new Date().toISOString()
    const slug =
      input.citySlug && input.name
        ? `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-${input.citySlug}`
        : `spot-${Date.now()}`
    const spot: Spot = {
      id: `custom-spot-${Date.now()}`,
      slug,
      name: input.name.toUpperCase(),
      city: input.city,
      citySlug: input.citySlug ?? input.city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      address: input.address,
      type: input.type,
      features: input.features,
      image: input.image,
      communityNote: input.communityNote,
      crowdLevel: input.crowdLevel,
      crowdLevelLabel: input.crowdLevelLabel,
      country: input.country,
      location: input.location,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    }
    this.spots = [spot, ...this.spots]
    return spot
  }

  async update(id: string, patch: SpotPatch): Promise<Spot> {
    const idx = this.spots.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error(`Spot not found: ${id}`)
    const updated = { ...this.spots[idx]!, ...patch, updatedAt: new Date().toISOString() }
    const next = [...this.spots]
    next[idx] = updated
    this.spots = next
    return updated
  }

  async delete(id: string): Promise<void> {
    const existing = await this.findById(id)
    if (!existing) throw new Error(`Spot not found: ${id}`)
    this.spots = this.spots.filter((s) => s.id !== id)
  }
}