import "./load-env"
import spotsJson from "../data/spots.json"
import sportEventsJson from "../data/sport-events.json"
import postgres from "postgres"
import { getDatabaseUrl } from "../lib/env"
import { COUNTRY_TO_REGION } from "../data"

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

const TYPE_PRIORITY: readonly { match: RegExp; type: string }[] = [
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

function pickType(spotTypes: readonly string[] | undefined): string {
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
  usedType: string,
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
  low: ["Low", "Mid", "High"],
  mid: ["Low", "Mid", "High"],
  high: ["Low", "Mid", "High"],
}
void CROWD_LABELS

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function buildCrowdLabel(level: number, seed: string): string {
  const pools: Record<"low" | "mid" | "high", readonly string[]> = {
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
  const tier = level > 70 ? "high" : level > 40 ? "mid" : "low"
  const pool = pools[tier]
  const idx = Math.floor((hash(seed) % 1000) / 1000 * pool.length)
  return pool[idx]!
}

function buildCommunityNote(entry: RawSpot, type: string, id: string): string {
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
  const intro = intros[Math.floor((hash(id) % 1000) / 1000 * intros.length)]
  const when =
    type === "Park"
      ? "open hours"
      : type === "Bowl" || type === "Pools"
        ? "early morning sessions"
        : "low-traffic windows"
  return `${intro} from ${city}: ride it during ${when}. — ${handle}`
}

function pickCity(entry: RawSpot): string {
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

function pointWkt(lat: number, lon: number): string {
  return `SRID=4326;POINT(${lon} ${lat})`
}

async function seedCountryRegions(sql: ReturnType<typeof postgres>) {
  console.log("→ seeding country_regions")
  let count = 0
  for (const [country, region] of Object.entries(COUNTRY_TO_REGION)) {
    await sql`
      insert into country_regions (country, region)
      values (${country}, ${region})
      on conflict (country) do update set region = excluded.region
    `
    count++
  }
  console.log(`  ✓ ${count} countries/regions`)
}

async function seedSpots(sql: ReturnType<typeof postgres>) {
  console.log("→ seeding spots")
  const DEFAULT_PRESET_IMAGES = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAzOoxxgf8dF_dffEyj1reX-fHjpbmdOzHCKt48IV55g3OcOejsIT9MtaySQEK0hVzvIpPegtGd03j4neTRFC5WGxsEvj5OLJpKfFMhwXdXIY2YAjpD2xwCUOFNv_jCUBDs7mrLeq2J28upIy9Q7fq5m46ytFrpE8efxEcvW-3Bdb4uiMD6QOxExLVPlkQMkRDVmB2DxRfKq8E3Y0pko6HLf3oSNBxhmT5BnVuJ8tSMUEgWQuk_WElNP9xvvc9URbMql80pPwHFxf9P",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA6GHeF7oipibYvoiyBsC4TPFku7ffQmv6y0B5AvgdhgAmG9pI0BlJLe8-ayJLMlAtDAWwUGu4FAwabH8HuELRowJ3IeEJOlgw4xvg0_RP_eRKPr5eESG5TxVwONEulq3jToyCXr01mrPooWxd_LZyIm1ZjLx-q5OyZPARNZVw0jmm6gY0B_2wuE2kir3siF7K3C7ntb79Rqd-JOHOOpenTRYBWA1KQLZ_r4WVgfahEkzWayr4xRHIqIgYUCuuxsceSaEpXp8segQIg",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCrY2kzLB1jQqPxx87OqENxBTnqO00sGNmmbFTu7AVZ6r19NZg7MF3fdWdWnI6gGfw_ffMIMDY_Gspts-w017UN_NrCfiVCFhy5StEGoec3EzYvqmTmbz4lzOgjKciS7RV27IOlPVKHiEzli-wdFgHIurqHwm2HE4kDZQEjudqZODIx-_RyULGF_RgAiTpitlMRoYMh6eCL773msOXd0D2xWpsxVBURfxsElH5AvNf3rqCohSNZhAbWwTXOJZZxwY3ShaMJiJ95FWS2",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBFcsJ_InsjM_V2ZhdORVirVciKPJ2Uqt5Jii3nfPULenttPQ0cUQzaa_C0Yc_NrAv1eAnHIeR8S04LjqVjCQuleF60loO-Mh7UEOwa--QIQwv3VaR_P4gt5B7jfu-3GeKqm5Rf-NV8q0xJxL_FX9JZR0_YLkAMpHPWfXRNDr5THXJbJawrNxG5oJYPI2YICMJAFHJPsYpbPdVHU8lTuqhXRgmObg3ZuVD7VNiZ6NjRXmQfSSW7vx2q43JFz7ckBgTcpMPRzkp67YMT",
  ]
  let count = 0
  for (const entry of SOURCE_SPOTS) {
    const id = entry.slug ?? String(entry.place_id)
    const lat = Number(entry.lat)
    const lon = Number(entry.lon)
    const type = pickType(entry.spot_types)
    const crowdLevel = Math.floor((hash("crowd:" + id) % 1000) / 10)
    const rawCountry = entry.address?.country ?? ""
    const country = rawCountry
    const name = entry.name.toUpperCase()
    const city = pickCity(entry)
    const citySlug = entry.city_slug ?? city.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    const slug = entry.slug ?? id
    const imageIdx = (hash(id) % 1000) / 1000 * DEFAULT_PRESET_IMAGES.length
    const imageUrl = DEFAULT_PRESET_IMAGES[Math.floor(imageIdx)] ?? DEFAULT_PRESET_IMAGES[0]!
    const address = entry.display_name ?? entry.name
    const features = pickFeatures(entry.spot_types, type)
    const crowdLevelLabel = buildCrowdLabel(crowdLevel, id)
    const communityNote = buildCommunityNote(entry, type, id)

    await sql`
      insert into spots (
        id, slug, name, city, city_slug, address, type, features,
        image_url, community_note, crowd_level, crowd_level_label,
        country, location
      ) values (
        gen_random_uuid(), ${slug}, ${name}, ${city}, ${citySlug}, ${address},
        ${type}::spot_type, ${features}::text[],
        ${imageUrl}, ${communityNote}, ${crowdLevel}, ${crowdLevelLabel},
        ${country}, ${pointWkt(lat, lon)}::geometry
      )
      on conflict (slug) do update set
        name = excluded.name,
        city = excluded.city,
        city_slug = excluded.city_slug,
        address = excluded.address,
        type = excluded.type,
        features = excluded.features,
        image_url = excluded.image_url,
        community_note = excluded.community_note,
        crowd_level = excluded.crowd_level,
        crowd_level_label = excluded.crowd_level_label,
        country = excluded.country,
        location = excluded.location
    `
    count++
  }
  console.log(`  ✓ ${count} spots`)
}

async function seedSportEvents(sql: ReturnType<typeof postgres>) {
  console.log("→ seeding sport_events")
  const SOURCE_EVENTS = sportEventsJson as Array<{
    id: string
    name: string
    shortName?: string
    url: string
    image: string
    description: string
    sports: string[]
    startDate: string
    endDate?: string
    location: {
      city: string
      country: string
      countryCode?: string
      venue?: string
      latitude?: number
      longitude?: number
    }
    tier: string
    featured?: boolean
  }>
  let count = 0
  for (const event of SOURCE_EVENTS) {
    const lat = event.location.latitude
    const lon = event.location.longitude
    const location =
      typeof lat === "number" && typeof lon === "number"
        ? pointWkt(lat, lon)
        : null
    await sql`
      insert into sport_events (
        id, slug, name, short_name, url, image, description, sports,
        start_date, end_date, city, country, country_code, venue,
        location, tier, featured
      ) values (
        gen_random_uuid(), ${event.id}, ${event.name}, ${event.shortName ?? null},
        ${event.url}, ${event.image}, ${event.description},
        ${event.sports}::sport_discipline[],
        ${event.startDate}, ${event.endDate ?? null},
        ${event.location.city}, ${event.location.country},
        ${event.location.countryCode ?? null}, ${event.location.venue ?? null},
        ${location}::geometry, ${event.tier}::sport_event_tier,
        ${event.featured ? "true" : "false"}
      )
      on conflict (slug) do update set
        name = excluded.name,
        short_name = excluded.short_name,
        url = excluded.url,
        image = excluded.image,
        description = excluded.description,
        sports = excluded.sports,
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        city = excluded.city,
        country = excluded.country,
        country_code = excluded.country_code,
        venue = excluded.venue,
        location = excluded.location,
        tier = excluded.tier,
        featured = excluded.featured
    `
    count++
  }
  console.log(`  ✓ ${count} sport_events`)
}

async function main() {
  const url = getDatabaseUrl()
  if (!url) throw new Error("DATABASE_URL is not configured")
  const sql = postgres(url, { ssl: "require", max: 1, connect_timeout: 10 })
  try {
    await seedCountryRegions(sql)
    await seedSpots(sql)
    await seedSportEvents(sql)
    console.log("✓ seed complete")
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})