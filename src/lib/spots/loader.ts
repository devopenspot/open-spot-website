import { cache } from "react"
import spotsJson from "@/data/spots.json"
import { getCachedSpotWeather } from "@/lib/weather/weather-cached"
import { DEFAULT_PRESET_IMAGES, COUNTRY_NAME_OVERRIDES, COUNTRY_TO_REGION } from "@/data"
import type { Spot as CoreSpot } from "@/types/core"
import type { Spot, SpotForecast, SpotType } from "@/lib/types"
import {
  bboxOf,
  formatDistanceMiles,
  haversineMiles,
  hashToUnitInterval,
  projectToGrid,
  REFERENCE_LAT,
  REFERENCE_LON,
  type BBox,
} from "./geo"

const SOURCE_SPOTS = spotsJson as CoreSpot[]

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

function buildCommunityNote(
  entry: CoreSpot,
  type: SpotType,
  id: string,
): string {
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
  const intros = [
    "Local intel",
    "Community intel",
    "Scout report",
    "Field notes",
  ]
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
  const idx = Math.floor(
    hashToUnitInterval(id) * DEFAULT_PRESET_IMAGES.length,
  )
  return DEFAULT_PRESET_IMAGES[idx]!.url
}

function buildId(entry: CoreSpot): string {
  if (entry.slug) return entry.slug
  return String(entry.place_id)
}

function buildCity(entry: CoreSpot): string {
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

function buildAddress(entry: CoreSpot): string {
  return entry.display_name ?? entry.name ?? ""
}

function buildBaseSpot(
  entry: CoreSpot,
  bbox: BBox,
): Omit<Spot, "weather" | "isSaved"> {
  const id = buildId(entry)
  const lat = Number(entry.lat)
  const lon = Number(entry.lon)
  const safeLat = Number.isFinite(lat) ? lat : REFERENCE_LAT
  const safeLon = Number.isFinite(lon) ? lon : REFERENCE_LON
  const type = pickType(entry.spot_types)
  const distanceMiles = haversineMiles(
    REFERENCE_LAT,
    REFERENCE_LON,
    safeLat,
    safeLon,
  )
  const crowdLevel = Math.floor(
    hashToUnitInterval("crowd:" + id) * 100,
  )
  const rawCountry = entry.address?.country ?? ""
  const country = COUNTRY_NAME_OVERRIDES[rawCountry] ?? rawCountry
  const region = COUNTRY_TO_REGION[country] ?? "Americas"
  return {
    id,
    name: entry.name.toUpperCase(),
    city: buildCity(entry),
    address: buildAddress(entry),
    type,
    distance: formatDistanceMiles(distanceMiles),
    coordinates: projectToGrid(safeLat, safeLon, bbox),
    image: pickImage(id),
    features: pickFeatures(entry.spot_types, type),
    crowdLevel,
    crowdLevelLabel: buildCrowdLabel(crowdLevel, id),
    communityNote: buildCommunityNote(entry, type, id),
    country,
    region,
  }
}

async function fetchWeatherForSpot(
  entry: CoreSpot,
  id: string,
): Promise<{ current: number; forecast: SpotForecast[] }> {
  const lat = Number(entry.lat)
  const lon = Number(entry.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { current: 22, forecast: [] }
  }
  return getCachedSpotWeather({
    spotId: id,
    latitude: lat,
    longitude: lon,
  })
}

type BaseSpot = Omit<Spot, "weather" | "isSaved">

const BBOX = bboxOf(SOURCE_SPOTS)
const BASE_SPOTS: readonly BaseSpot[] = Object.freeze(
  SOURCE_SPOTS.map((entry) => buildBaseSpot(entry, BBOX)),
)

async function buildSpot(base: BaseSpot, entry: CoreSpot): Promise<Spot> {
  const weather = await fetchWeatherForSpot(entry, base.id)
  return { ...base, weather }
}

export async function loadSpots(): Promise<readonly Spot[]> {
  const spots = await Promise.all(
    BASE_SPOTS.map((base, i) => buildSpot(base, SOURCE_SPOTS[i]!)),
  )
  return Object.freeze(spots)
}

export async function loadSpot(id: string): Promise<Spot | undefined> {
  const base = BASE_SPOTS.find((s) => s.id === id)
  if (!base) return undefined
  const entry = SOURCE_SPOTS.find((e) => buildId(e) === id)
  if (!entry) return undefined
  return buildSpot(base, entry)
}

export const getSpots = cache(
  async (): Promise<readonly Spot[]> => loadSpots(),
)

export const getSpotById = cache(
  async (id: string): Promise<Spot | undefined> => loadSpot(id),
)

