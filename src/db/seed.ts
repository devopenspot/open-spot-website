import "./load-env"
import spotsJson from "../data/spots.json"
import sportEventsJson from "../data/sport-events.json"
import postgres from "postgres"
import { getDatabaseUrl } from "../lib/env"
import { COUNTRY_TO_REGION, REGIONS_DATA } from "../data"

interface RegionSeed {
  slug: string
  name: string
  description: string
  imageUrl: string
  sortOrder: number
}

interface CountrySeed {
  iso2: string
  name: string
  iso3: string
  region: string
}

interface TaxonomyEntry {
  slug: string
  name: string
  sortOrder: number
}

const REGION_SEED: readonly RegionSeed[] = REGIONS_DATA.map((r, i) => ({
  slug: r.name.toLowerCase(),
  name: r.name,
  description: r.desc,
  imageUrl: r.image,
  sortOrder: i,
}))

const COUNTRY_TO_ISO2: Readonly<Record<string, string>> = {
  "United States": "US",
  Canada: "CA",
  Mexico: "MX",
  Brazil: "BR",
  Argentina: "AR",
  Colombia: "CO",
  Chile: "CL",
  Peru: "PE",
  France: "FR",
  Germany: "DE",
  "United Kingdom": "GB",
  Italy: "IT",
  Spain: "ES",
  Netherlands: "NL",
  Portugal: "PT",
  Sweden: "SE",
  Japan: "JP",
  "South Korea": "KR",
  China: "CN",
  Thailand: "TH",
  Singapore: "SG",
  Indonesia: "ID",
  Philippines: "PH",
  Malaysia: "MY",
}

const COUNTRY_TO_ISO3: Readonly<Record<string, string>> = {
  US: "USA", CA: "CAN", MX: "MEX", BR: "BRA", AR: "ARG", CO: "COL",
  CL: "CHL", PE: "PER", FR: "FRA", DE: "DEU", GB: "GBR", IT: "ITA",
  ES: "ESP", NL: "NLD", PT: "PRT", SE: "SWE", JP: "JPN", KR: "KOR",
  CN: "CHN", TH: "THA", SG: "SGP", ID: "IDN", PH: "PHL", MY: "MYS",
}

function buildCountrySeed(): readonly CountrySeed[] {
  const out: CountrySeed[] = []
  for (const [name, region] of Object.entries(COUNTRY_TO_REGION)) {
    const iso2 = COUNTRY_TO_ISO2[name]
    if (!iso2) continue
    out.push({
      iso2,
      name,
      iso3: COUNTRY_TO_ISO3[iso2] ?? "",
      region,
    })
  }
  return out
}

const COUNTRY_SEED = buildCountrySeed()

const SPOT_TYPE_SEED: readonly TaxonomyEntry[] = [
  { slug: "plaza", name: "Plaza", sortOrder: 0 },
  { slug: "diy", name: "DIY", sortOrder: 1 },
  { slug: "stair", name: "Stair set", sortOrder: 2 },
  { slug: "bowl", name: "Bowl", sortOrder: 3 },
  { slug: "park", name: "Skatepark", sortOrder: 4 },
  { slug: "ledges", name: "Ledges", sortOrder: 5 },
  { slug: "pools", name: "Pools", sortOrder: 6 },
]

const SPORT_DISCIPLINE_SEED: readonly TaxonomyEntry[] = [
  { slug: "skateboard", name: "Skateboard", sortOrder: 0 },
  { slug: "bmx", name: "BMX", sortOrder: 1 },
  { slug: "inline", name: "Inline", sortOrder: 2 },
  { slug: "scooter", name: "Scooter", sortOrder: 3 },
  { slug: "rollerblade", name: "Rollerblade", sortOrder: 4 },
  { slug: "wakeboard", name: "Wakeboard", sortOrder: 5 },
  { slug: "snowboard", name: "Snowboard", sortOrder: 6 },
  { slug: "ski", name: "Ski", sortOrder: 7 },
]

const EVENT_TIER_SEED: readonly TaxonomyEntry[] = [
  { slug: "world-tour", name: "World Tour", sortOrder: 0 },
  { slug: "championship", name: "Championship", sortOrder: 1 },
  { slug: "festival", name: "Festival", sortOrder: 2 },
  { slug: "federation", name: "Federation", sortOrder: 3 },
]

const SPOT_FEATURE_SEED: readonly { slug: string; name: string }[] = [
  { slug: "ledge", name: "Ledge" },
  { slug: "rail", name: "Rail" },
  { slug: "down-rail", name: "Down rail" },
  { slug: "up-rail", name: "Up rail" },
  { slug: "stairs", name: "Stairs" },
  { slug: "hubba", name: "Hubba" },
  { slug: "manual-pad", name: "Manual pad" },
  { slug: "flat-bar", name: "Flat bar" },
  { slug: "gap", name: "Gap" },
  { slug: "pyramid", name: "Pyramid" },
  { slug: "bank", name: "Bank" },
  { slug: "wallride", name: "Wallride" },
  { slug: "pole-jam", name: "Pole jam" },
  { slug: "quarter-pipe", name: "Quarter pipe" },
  { slug: "mini-ramp", name: "Mini ramp" },
  { slug: "bowl", name: "Bowl" },
  { slug: "pool", name: "Pool" },
  { slug: "smooth-concrete", name: "Smooth Concrete" },
  { slug: "street", name: "Street" },
  { slug: "slidebox", name: "Slidebox" },
]

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

async function seedRegions(sql: ReturnType<typeof postgres>) {
  console.log("→ seeding regions")
  for (const r of REGION_SEED) {
    await sql`
      insert into regions (slug, name, description, image_url, sort_order)
      values (${r.slug}, ${r.name}, ${r.description}, ${r.imageUrl}, ${r.sortOrder})
      on conflict (slug) do update set
        name = excluded.name,
        description = excluded.description,
        image_url = excluded.image_url,
        sort_order = excluded.sort_order,
        updated_at = now()
    `
  }
  console.log(`  ✓ ${REGION_SEED.length} regions`)
}

async function seedCountries(sql: ReturnType<typeof postgres>) {
  console.log("→ seeding countries")
  const regionRows = await sql<{ id: string; name: string }[]>`
    select id, name from regions
  `
  const regionIdByName = new Map(regionRows.map((r) => [r.name, r.id]))
  let count = 0
  for (const c of COUNTRY_SEED) {
    const regionId = regionIdByName.get(c.region)
    if (!regionId) {
      console.warn(`  ! skipping ${c.name}: region "${c.region}" not seeded`)
      continue
    }
    await sql`
      insert into countries (iso2, name, iso3, region_id)
      values (${c.iso2}, ${c.name}, ${c.iso3 || null}, ${regionId})
      on conflict (iso2) do update set
        name = excluded.name,
        iso3 = excluded.iso3,
        region_id = excluded.region_id,
        updated_at = now()
    `
    count++
  }
  console.log(`  ✓ ${count} countries`)
}

async function seedSpotTypes(sql: ReturnType<typeof postgres>) {
  console.log("→ seeding spot_types")
  for (const t of SPOT_TYPE_SEED) {
    await sql`
      insert into spot_types (slug, name, sort_order)
      values (${t.slug}, ${t.name}, ${t.sortOrder})
      on conflict (slug) do update set
        name = excluded.name,
        sort_order = excluded.sort_order
    `
  }
  console.log(`  ✓ ${SPOT_TYPE_SEED.length} spot_types`)
}

async function seedSportDisciplines(sql: ReturnType<typeof postgres>) {
  console.log("→ seeding sport_disciplines")
  for (const d of SPORT_DISCIPLINE_SEED) {
    await sql`
      insert into sport_disciplines (slug, name, sort_order)
      values (${d.slug}, ${d.name}, ${d.sortOrder})
      on conflict (slug) do update set
        name = excluded.name,
        sort_order = excluded.sort_order
    `
  }
  console.log(`  ✓ ${SPORT_DISCIPLINE_SEED.length} sport_disciplines`)
}

async function seedEventTiers(sql: ReturnType<typeof postgres>) {
  console.log("→ seeding event_tiers")
  for (const t of EVENT_TIER_SEED) {
    await sql`
      insert into event_tiers (slug, name, sort_order)
      values (${t.slug}, ${t.name}, ${t.sortOrder})
      on conflict (slug) do update set
        name = excluded.name,
        sort_order = excluded.sort_order
    `
  }
  console.log(`  ✓ ${EVENT_TIER_SEED.length} event_tiers`)
}

async function seedSpotFeatures(sql: ReturnType<typeof postgres>) {
  console.log("→ seeding spot_features")
  for (const f of SPOT_FEATURE_SEED) {
    await sql`
      insert into spot_features (slug, name)
      values (${f.slug}, ${f.name})
      on conflict (slug) do update set name = excluded.name
    `
  }
  console.log(`  ✓ ${SPOT_FEATURE_SEED.length} spot_features`)
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

    const [row] = await sql<{ id: string }[]>`
      insert into spots (
        id, slug, name, city, city_slug, address, type_slug,
        image_url, community_note, crowd_level, crowd_level_label,
        country_code, location
      ) values (
        gen_random_uuid(), ${slug}, ${name}, ${city}, ${citySlug}, ${address},
        ${type.toLowerCase()},
        ${imageUrl}, ${communityNote}, ${crowdLevel}, ${crowdLevelLabel},
        (select iso2 from countries where name = ${country} limit 1),
        ${pointWkt(lat, lon)}::geometry
      )
      on conflict (slug) do update set
        name = excluded.name,
        city = excluded.city,
        city_slug = excluded.city_slug,
        address = excluded.address,
        type_slug = excluded.type_slug,
        image_url = excluded.image_url,
        community_note = excluded.community_note,
        crowd_level = excluded.crowd_level,
        crowd_level_label = excluded.crowd_level_label,
        country_code = excluded.country_code,
        location = excluded.location
      returning id
    `
    const spotId = row?.id
    if (spotId) {
      for (const feature of features) {
        const featureSlug = feature.toLowerCase().replace(/\s+/g, "-")
        await sql`
          insert into spot_feature_links (spot_id, feature_slug)
          values (${spotId}, ${featureSlug})
          on conflict do nothing
        `
      }
    }
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
    const startAt = `${event.startDate} 00:00:00+00`
    const endAt = event.endDate ? `${event.endDate} 00:00:00+00` : null
    const countryCode =
      event.location.countryCode ??
      (
        await sql<{ iso2: string }[]>`
          select iso2 from countries where name = ${event.location.country} limit 1
        `
      )[0]?.iso2 ??
      null
    if (!countryCode) {
      console.warn(
        `  ! skipping ${event.name}: country "${event.location.country}" not found`,
      )
      continue
    }
    const [row] = await sql<{ id: string }[]>`
      insert into sport_events (
        id, slug, name, short_name, url, image, description,
        start_at, end_at, city, country_code, venue,
        location, tier_slug, featured
      ) values (
        gen_random_uuid(), ${event.id}, ${event.name}, ${event.shortName ?? null},
        ${event.url}, ${event.image}, ${event.description},
        ${startAt}::timestamptz, ${endAt}::timestamptz,
        ${event.location.city}, ${countryCode}, ${event.location.venue ?? null},
        ${location}::geometry, ${event.tier}, ${event.featured ?? false}
      )
      on conflict (slug) do update set
        name = excluded.name,
        short_name = excluded.short_name,
        url = excluded.url,
        image = excluded.image,
        description = excluded.description,
        start_at = excluded.start_at,
        end_at = excluded.end_at,
        city = excluded.city,
        country_code = excluded.country_code,
        venue = excluded.venue,
        location = excluded.location,
        tier_slug = excluded.tier_slug,
        featured = excluded.featured
      returning id
    `
    const eventId = row?.id
    if (eventId) {
      for (const sport of event.sports) {
        const slug = sport.toLowerCase()
        await sql`
          insert into event_sports (event_id, discipline_slug)
          values (${eventId}, ${slug})
          on conflict do nothing
        `
      }
    }
    count++
  }
  console.log(`  ✓ ${count} sport_events`)
}

async function main() {
  const url = getDatabaseUrl()
  if (!url) throw new Error("DATABASE_URL is not configured")
  const sql = postgres(url, { ssl: "require", max: 1, connect_timeout: 10 })
  try {
    await seedRegions(sql)
    await seedCountries(sql)
    await seedSpotTypes(sql)
    await seedSportDisciplines(sql)
    await seedEventTiers(sql)
    await seedSpotFeatures(sql)
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