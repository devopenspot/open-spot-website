// Phase 2 — hand-curated typed SportEvent seed rows. Every row is
// seeded with `createdBy: null` — ownership is only assigned when a
// real Supabase admin creates or edits the event through the
// dashboard.

import type { SportEventTier, SportDiscipline } from "@/types/sport-events"
import type { NewSportEvent } from "@/lib/repositories/types"

interface EventRow {
  id: string
  name: string
  shortName?: string
  url: string
  image: string
  description: string
  sports: readonly SportDiscipline[]
  startDate: string
  endDate?: string
  city: string
  country: string
  countryCode: string
  venue?: string
  latitude?: number
  longitude?: number
  tier: SportEventTier
  featured?: boolean
  createdBy?: string | null
}

const ROWS: readonly EventRow[] = [
  {
    id: "street-league-skateboarding",
    name: "Street League Skateboarding",
    shortName: "SLS",
    url: "https://www.streetleague.com/",
    image: "https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=1600&q=80&auto=format&fit=crop",
    description:
      "The premier global street-skating championship circuit. World-class plazas, knockout formats, and the heaviest purse in the game.",
    sports: ["Skateboard"],
    startDate: "2026-08-14",
    endDate: "2026-08-16",
    city: "Los Angeles",
    country: "United States",
    countryCode: "US",
    venue: "Crypto.com Arena",
    latitude: 34.043,
    longitude: -118.2673,
    tier: "world-tour",
    featured: true,
    createdBy: null,
  },
  {
    id: "fise",
    name: "Festival International des Sports Extrêmes",
    shortName: "FISE",
    url: "https://www.fise.fr/en",
    image: "https://images.unsplash.com/photo-1520224071687-8a04bcdbeb52?w=1600&q=80&auto=format&fit=crop",
    description:
      "Five days of BMX, skateboarding, rollerblading, and scootering in a free urban festival format. Montpellier, France.",
    sports: ["Skateboard", "BMX", "Rollerblade", "Scooter"],
    startDate: "2026-05-27",
    endDate: "2026-05-31",
    city: "Montpellier",
    country: "France",
    countryCode: "FR",
    venue: "Place de l'Europe",
    latitude: 43.6047,
    longitude: 3.8767,
    tier: "festival",
    createdBy: null,
  },
  {
    id: "winterclash",
    name: "Winterclash",
    url: "https://www.winterclash.com/",
    image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1600&q=80&auto=format&fit=crop",
    description:
      "The definitive gathering of the international inline skating scene. Street, park, and a one-of-a-kind vert ramp battle.",
    sports: ["Rollerblade"],
    startDate: "2027-01-22",
    endDate: "2027-01-24",
    city: "Berlin",
    country: "Germany",
    countryCode: "DE",
    venue: "Tempelhof Airport Hangar 4",
    latitude: 52.4732,
    longitude: 13.4038,
    tier: "championship",
    createdBy: null,
  },
  {
    id: "x-games",
    name: "X Games",
    shortName: "XG",
    url: "https://www.xgames.com/",
    image: "https://images.unsplash.com/photo-1531565637446-32307b194362?w=1600&q=80&auto=format&fit=crop",
    description:
      "The original action-sports proving ground. Skateboard, BMX, Moto X, and a rotating cast of new disciplines on the biggest stage.",
    sports: ["Skateboard", "BMX"],
    startDate: "2026-07-23",
    endDate: "2026-07-26",
    city: "Minneapolis",
    country: "United States",
    countryCode: "US",
    venue: "U.S. Bank Stadium",
    latitude: 44.974,
    longitude: -93.2581,
    tier: "championship",
    createdBy: null,
  },
  {
    id: "world-skate",
    name: "World Skate Games",
    shortName: "WorldSkate",
    url: "https://www.worldskate.org/",
    image: "https://images.unsplash.com/photo-1572776685600-aca8c3456337?w=1600&q=80&auto=format&fit=crop",
    description:
      "The governing body's flagship multi-discipline championship. Skateboarding, inline, scootering, and artistic events under one umbrella.",
    sports: ["Skateboard", "Rollerblade", "Scooter", "Rollerblade"],
    startDate: "2026-09-18",
    endDate: "2026-09-27",
    city: "Buenos Aires",
    country: "Argentina",
    countryCode: "AR",
    venue: "Parque Roca",
    latitude: -34.6433,
    longitude: -58.4601,
    tier: "federation",
    createdBy: null,
  },
]

function dedupeSports<T>(sports: readonly T[]): T[] {
  return Array.from(new Set(sports))
}

export const SOURCE_SPORT_EVENTS: readonly NewSportEvent[] = ROWS.map(
  (row): NewSportEvent => ({
    // `id` is the stable seed slug — the repository's `create`
    // upserts on it so re-running the seed updates the same row
    // instead of erroring on the unique slug index.
    slug: row.id,
    name: row.name,
    shortName: row.shortName,
    url: row.url,
    image: row.image,
    description: row.description,
    sports: dedupeSports([...row.sports]),
    startDate: row.startDate,
    endDate: row.endDate,
    city: row.city,
    country: row.country,
    countryCode: row.countryCode,
    venue: row.venue,
    latitude: row.latitude,
    longitude: row.longitude,
    tier: row.tier,
    featured: row.featured ?? false,
    createdBy: row.createdBy ?? null,
  }),
)
