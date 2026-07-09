// Phase 2 — hand-curated typed Spot seed rows. These were previously raw
// Nominatim OSM dumps in `src/data/spots.json`, transformed at seed
// time via 5 derivation functions (`pickType`, `pickFeatures`,
// `buildCrowdLabel`, `buildCommunityNote`, `pickCity`). The rows below
// preserve the same derived values — they were produced by running the
// current seed once and reading the results out of the DB, then
// transcribing the canonical fields here.
//
// Image URLs are picked from the `preset_images` table by a stable
// hash of the spot slug (so re-seeding produces the same image). To
// change a row, edit the literal below and re-run `pnpm db:seed`.

import type { NewSpot } from "@/lib/repositories/types"
import type { SportDiscipline } from "@/types/sport-events"
import { PRESET_IMAGE_SEED } from "./preset-images"

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

const CROWD_POOLS = {
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
} as const

function crowdLabel(level: number, id: string): string {
  const tier = level > 70 ? "high" : level > 40 ? "mid" : "low"
  const pool = CROWD_POOLS[tier]
  const idx = Math.floor((hash(id) % 1000) / 1000 * pool.length)
  return pool[idx]!
}

function communityNote(city: string, type: string, id: string): string {
  const handle = "@" + id.split("-").slice(0, 2).join("")
  const intros = ["Local intel", "Community intel", "Scout report", "Field notes"]
  const intro = intros[hash(id) % intros.length]
  const when =
    type === "park"
      ? "open hours"
      : type === "bowl" || type === "pools"
        ? "early morning sessions"
        : "low-traffic windows"
  return `${intro} from ${city}: ride it during ${when}. — ${handle}`
}

function crowdLevel(id: string): number {
  return Math.floor((hash("crowd:" + id) % 1000) / 10)
}

function imageFor(id: string): string {
  const urls = PRESET_IMAGE_SEED.map((p) => p.url)
  const idx = Math.floor((hash(id) % 1000) / 1000 * urls.length)
  return urls[idx] ?? urls[0]!
}

// Sport disciplines are stored in a join table; the seed array is the
// list of discipline slugs each spot supports. Empty for the base set.
const SKATE: readonly SportDiscipline[] = ["Skateboard"]

interface SpotRow {
  slug: string
  name: string
  city: string
  address: string
  type: string
  features: readonly string[]
  sports: readonly SportDiscipline[]
  country: string
  lat: number
  lon: number
}

const ROWS: readonly SpotRow[] = [
  {
    slug: "place-louis-pradel",
    name: "Place Louis Pradel",
    city: "Lyon",
    address: "Place Louis Pradel, Lyon, France",
    type: "plaza",
    features: ["smooth-concrete"],
    sports: SKATE,
    country: "France",
    lat: 45.768613,
    lon: 4.8369251,
  },
  {
    slug: "bercy-skatepark",
    name: "Bercy Skatepark",
    city: "Paris",
    address: "Quai de Bercy, Paris 12e Arrondissement, France",
    type: "park",
    features: ["rail", "slidebox", "mini-ramp", "street", "smooth-concrete"],
    sports: SKATE,
    country: "France",
    lat: 48.8373219,
    lon: 2.3789662,
  },
  {
    slug: "dogshit-spot",
    name: "Dogshit Spot",
    city: "Berlin",
    address: "Marchlewskistraße, Friedrichshain, Berlin, Germany",
    type: "ledges",
    features: ["street", "smooth-concrete"],
    sports: SKATE,
    country: "Germany",
    lat: 52.5076013,
    lon: 13.4488483,
  },
  {
    slug: "skatepark-de-la-4-sur",
    name: "Skatepark de la 4 Sur",
    city: "Medellín",
    address: "Comuna 15 - Guayabal, Perímetro Urbano Medellín, Antioquia, Colombia",
    type: "park",
    features: ["rail", "street", "smooth-concrete"],
    sports: SKATE,
    country: "Colombia",
    lat: 6.2047065,
    lon: -75.5798671,
  },
  {
    slug: "viga-skatepark",
    name: "Viga Skatepark",
    city: "Envigado",
    address: "Avenida Las Vegas, Envigado, Antioquia, Colombia",
    type: "park",
    features: ["rail", "smooth-concrete"],
    sports: SKATE,
    country: "Colombia",
    lat: 6.1693094,
    lon: -75.5960834,
  },
  {
    slug: "skatepark-zipaquira",
    name: "Skatepark Zipaquira",
    city: "Zipaquirá",
    address: "Carrera 15, Zipaquirá, Cundinamarca, Colombia",
    type: "bowl",
    features: ["rail", "slidebox", "smooth-concrete"],
    sports: SKATE,
    country: "Colombia",
    lat: 5.020761,
    lon: -73.9999073,
  },
  {
    slug: "skatepark-sopo",
    name: "Skatepark Sopó",
    city: "Sopó",
    address: "Calle 3 Sur, Sopó, Cundinamarca, Colombia",
    type: "bowl",
    features: ["rail", "slidebox", "street", "smooth-concrete"],
    sports: SKATE,
    country: "Colombia",
    lat: 4.9068944,
    lon: -73.944922,
  },
  {
    slug: "skatepark-tep-emile-lepeu-rue-emile-lepeu",
    name: "Skatepark TEP Émile Lepeu",
    city: "Paris",
    address: "Rue Émile Lepeu, Quartier de la Roquette, Paris 11e Arrondissement, France",
    type: "park",
    features: ["rail", "smooth-concrete"],
    sports: SKATE,
    country: "France",
    lat: 48.8563378,
    lon: 2.3884269,
  },
  {
    slug: "skatepark-ponte-della-musica",
    name: "Skatepark Ponte della Musica",
    city: "Roma",
    address: "Ponte della Musica, Flaminio, Roma, Italy",
    type: "plaza",
    features: ["rail", "slidebox", "smooth-concrete"],
    sports: SKATE,
    country: "Italy",
    lat: 41.9266668,
    lon: 12.4604421,
  },
  {
    slug: "skatepark-carrera-52-unidad-deportiva-alberto-galindo-plaza-de-toros",
    name: "Skatepark Carrera 52 Plaza de Toros",
    city: "Cali",
    address: "Carrera 52, Unidad Deportiva Alberto Galindo, Cali, Valle del Cauca, Colombia",
    type: "park",
    features: ["rail", "smooth-concrete"],
    sports: SKATE,
    country: "Colombia",
    lat: 3.4147268,
    lon: -76.5523151,
  },
  {
    slug: "skatepark-parque-de-las-ruedas-san-antonio-de-prado",
    name: "Skatepark Parque de Las Ruedas",
    city: "Medellín",
    address: "Calle 50E Sur, San Antonio de Prado, Medellín, Antioquia, Colombia",
    type: "park",
    features: ["rail", "smooth-concrete"],
    sports: SKATE,
    country: "Colombia",
    lat: 6.1768804,
    lon: -75.6550942,
  },
]

function toNewSpot(row: SpotRow): NewSpot {
  const citySlug = row.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  const level = crowdLevel(row.slug)
  return {
    id: row.slug,
    name: row.name.toUpperCase(),
    city: row.city,
    citySlug,
    address: row.address,
    type: row.type,
    features: [...row.features],
    sports: [...row.sports],
    image: imageFor(row.slug),
    communityNote: communityNote(row.city, row.type, row.slug),
    crowdLevel: level,
    crowdLevelLabel: crowdLabel(level, row.slug),
    country: row.country,
    location: { lat: row.lat, lon: row.lon },
    createdBy: null,
  }
}

export const SOURCE_SPOTS: readonly NewSpot[] = ROWS.map(toNewSpot)
