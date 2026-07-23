// Regenerates `src/db/seed-data/spots.ts` from the live snapshot at the
// repo root (`spots.json` + `spot_spot_types.json`). The committed TS
// file is the input the seed CLI actually consumes; this script is
// the only thing that should ever edit it.
//
// Run via `pnpm db:regen-spots` (see `package.json`).
//
// The source data is messy: 18 rows have `slug: "undefined-<ts>"`,
// `city_slug` is the truncated/diacritic-stripped result of an
// in-app `slugify`, several rows have a `city` that doesn't match
// the address (e.g. `Tokio` for a spot in Hachioji), and a handful
// of `country_code` values (IQ/QA/TN) have no `regions` row to FK
// against. We normalize here so the seed output is clean:
//
//   1. `city`      → canonical English exonym (or address-derived name
//                    when the source `city` is wrong)
//   2. `citySlug`  → slugify(city) — NFD-stripped, ASCII, hyphenated
//   3. `name`      → unchanged display name (diacritics kept for
//                    on-screen readability, just normalized casing)
//   4. `slug`      → slugify(name); prefix with `citySlug` on
//                    collision (no current collisions, but the rule
//                    is in place for future rows)
//   5. `country`   → reverse-looked-up English name from
//                    `COUNTRY_TO_ISO2[country_code]` so the seed's
//                    `(select iso2 from countries where name = ...)`
//                    subquery always resolves
//   6. `location`  → decoded EWKB hex (the source carries a PostGIS
//                    `0101000020E6100000...` blob; we unwrap it to
//                    `{lat, lon}` with the same DataView logic as
//                    `schema.ts`'s `geometryPoint.fromDriver`)
//   7. `types`     → denormalized from `spot_spot_types.json` keyed
//                    by `spot_id`
//   8. `sports`    → every spot carries the full SKATE set (the
//                    source data does not record a per-spot sport
//                    list, so we mirror the prior hand-curated
//                    behavior)
//   9. `createdBy` → always `null` (ownership is only set when a
//                    real Supabase admin edits a row in the UI)

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COUNTRY_TO_ISO2 } from "../src/db/seed-data/iso-codes";
import type { NewSpot } from "../src/lib/repositories/types";
import type { SportDiscipline } from "../src/types/sport-events";

type RawSpot = {
  id: string;
  slug: string;
  name: string;
  city: string;
  city_slug: string;
  address: string;
  image_url: string;
  image_path: string | null;
  country_code: string;
  location: string;
  created_by: string | null;
};

type RawSpotType = {
  spot_id: string;
  type_slug: string;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SPOTS_JSON = path.join(REPO_ROOT, "spots.json");
const SPOT_TYPES_JSON = path.join(REPO_ROOT, "spot_spot_types.json");
const OUT_FILE = path.join(REPO_ROOT, "src", "db", "seed-data", "spots.ts");

// ─── Slug + EWKB helpers ───────────────────────────────────────────

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function decodeEwkb(hex: string): { lat: number; lon: number } {
  // Mirrors `geometryPoint.fromDriver` in `src/db/schema.ts`. EWKB
  // Point with SRID is 25 bytes (50 hex chars): endian|type(4)|SRID(4)
  // |X(lon, 8)|Y(lat, 8). Little-endian on x86.
  const buf = Buffer.from(hex, "hex");
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const lon = view.getFloat64(9, true);
  const lat = view.getFloat64(17, true);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error(`undecodable EWKB: ${hex}`);
  }
  return { lat, lon };
}

// ─── City normalization overrides ─────────────────────────────────
//
// For every row where the source `city` is wrong (relative to the
// address) or just uses a non-English local name, we override with
// the canonical international English name. The slug is then derived
// from this. Rows not present here fall through to `slugify(city)`.
//
// Keyed by `spot.id` (the DB UUID from `spots.json`).

const CITY_OVERRIDE: Readonly<Record<string, string>> = {
  // Japan: "Tokio" is a misspelling; address says Hachioji.
  "34d905f2-0124-4996-bec1-3f0d5b87eff6": "Hachioji",
  // Brazil: these spots are in Amparo (a city in São Paulo state),
  // not in the capital. Address confirms it.
  "fed08317-cd70-4dd6-9de9-fe04018e7bf5": "Amparo",
  "5bcc7c0f-e661-4da4-a23b-6dfccd627fa7": "Amparo",
  // Colombia: strip diacritics to match the rest of the dimension.
  "156b25cf-ee09-4035-897a-d0bd051631f6": "Medellin",
  "6ff37c33-26f6-4cb3-9975-0defa8742194": "Zipaquira",
  "95e4f52f-36fb-4918-9d82-eaf504c5ba51": "Bogota",
  "e8e9057b-873b-4aa7-b2fb-ddc48b5206a4": "Bogota",
  "659b82f9-741a-4f04-a37c-74544c50d995": "Medellin",
  "73207eff-9978-4cf2-831d-9072f8e70d43": "Sopo",
  "778f2cab-631c-4061-9928-12db5afeb6e1": "Bogota",
  "6fb002e3-bb92-48ae-aadd-43095abf4e7f": "Bogota",
  "48857222-003f-4fa6-9b8e-1a2c145170a1": "Bogota",
  "28218d40-c2f3-4375-ab15-6db81509c043": "Medellin",
  "ec048a92-7c97-49f0-b51c-4ecda6967728": "Medellin",
  "3fc22526-3fb5-4e96-967e-e17d6c95ef2d": "Medellin",
  "01dfdb52-92a9-476f-a718-6ac085128b74": "Medellin",
  // Colombia: "Perímetro Urbano Barranquilla" is a Census tract /
  // metropolitan-area label for the city of Barranquilla. Roll it
  // up to the city name.
  "eb1154fc-26b4-4b95-beee-8eb1c08d8270": "Barranquilla",
  // Italy: "Roma" → "Rome".
  "9b04fbd4-a804-4b9a-8c99-3cf3d9ff1b04": "Rome",
  // Morocco: "Tanger" → "Tangier" (English exonym).
  "8e6b07f9-670c-40b9-a61d-aa89ba3cb3da": "Tangier",
  // Algeria: "Alger" (French) → "Algiers" (English).
  "afa8b71c-9bcb-4d08-8d6a-061e7d5d32a2": "Algiers",
  // "Mohamed Belouizdad" is a commune inside Algiers; address is
  // a Plus Code near the center of Algiers, so use the city name.
  "507d2af4-5655-4e10-83f5-ab5f77053564": "Algiers",
  // Israel: "Moriah" is a neighborhood; address says Modi'in.
  "68faf054-7637-4e44-b536-0c30ec544c24": "Modi'in",
  // Israel: "Nahariyya" → "Nahariya" (common English spelling).
  "03271899-2519-4915-b7ea-fdfc1023d9df": "Nahariya",
  // Sweden: kommun-level city names. Use the address-derived city
  // when the address clearly identifies a different place.
  "1ebdd417-3b0a-4b4d-9624-5019f13ef261": "Vallentuna", // "Vallentuna kommun" → "Vallentuna"
  "c60dea92-76f6-4562-ac66-b7a3b43d5cf6": "Bjuv", // "Bjuvs kommun" → "Bjuv" (genitive stripped)
  "dc50145d-cb18-4cfc-9269-f4a3145a0113": "Gothenburg", // "Göta" with Göteborg address
  "caf0529c-80ea-4db7-9927-b067bb4985d4": "Halmstad", // "Svenljunga kommun" but address is Halmstad
  "548fb065-3459-47b9-a24e-596e156d8aea": "Stockholm", // address is Stockholm
  // Iceland: "Reykjavíkurborg" is the Icelandic for "City of
  // Reykjavík"; address confirms Reykjavík.
  "8aaedc90-9e96-4624-82cb-fb41cb418e73": "Reykjavik",
  // Iceland: "Svalbarðseyri" is a village; address is in Akureyri.
  "03f35390-959e-46f0-a9d6-56b8582fa8de": "Akureyri",
  // Denmark: "Jægersborg" is a district of Copenhagen; address
  // confirms it (2100 København).
  "deb073e7-c88d-4d3f-a22f-465187a15cb5": "Copenhagen",
  // Canada: "Montréal" → "Montreal".
  "3e632bee-817c-4f84-be49-6144b4f12e5e": "Montreal",
  // New Zealand: "Valonia" with address in New Windsor (Hibiscus
  // Coast district). Use the district name to match the address.
  "bf8f86d3-f24c-4045-a456-8e16996cb131": "Hibiscus Coast",
  // New Zealand: "Auckland" with address in Glenfield (a suburb of
  // Auckland). The address is in the Devonport-Takapuna area, but
  // the source `city` already says Auckland — keep it.
  "21316747-1ec4-4a86-97c3-5d258a731201": "Auckland",
  // Mexico: "Ciudad de México" → "Mexico City".
  "3b4fa013-4764-4369-8d60-fe45afed1698": "Mexico City",
  "c7d60098-8f8e-4fc4-9bbc-be2a962be48d": "Mexico City",
  "c2014db7-e737-4677-ad9c-cf459906d7ca": "Mexico City",
  "3f6e2fa9-e555-4714-a92e-0ef087d42258": "Mexico City",
  // US: Las Vegas metro. Spring Valley and Sunrise Manor are CDPs
  // inside the Las Vegas metro; roll them up to "Las Vegas". North
  // Las Vegas is a separate incorporated city — keep it.
  "553815f2-44f3-42de-bcd7-b198ebcb4ecd": "Las Vegas", // "Desert Breeze" in Spring Valley
  "59d6adb9-141a-4c28-abe8-4b2bd1f21095": "Las Vegas", // "Hollywood Regional" in Sunrise Manor
};

const SKATE: readonly SportDiscipline[] = [
  "Skateboard",
  "Rollerblade",
  "Scooter",
  "BMX",
];

// ─── ISO → English name map ───────────────────────────────────────

const ISO2_TO_NAME: ReadonlyMap<string, string> = new Map(
  Object.entries(COUNTRY_TO_ISO2).map(([name, iso2]) => [iso2, name]),
);

// ─── Main ──────────────────────────────────────────────────────────

function main(): void {
  const rawSpots = JSON.parse(readFileSync(SPOTS_JSON, "utf8")) as RawSpot[];
  const rawSpotTypes = JSON.parse(
    readFileSync(SPOT_TYPES_JSON, "utf8"),
  ) as RawSpotType[];

  const typesBySpot = new Map<string, string[]>();
  for (const row of rawSpotTypes) {
    const list = typesBySpot.get(row.spot_id) ?? [];
    list.push(row.type_slug);
    typesBySpot.set(row.spot_id, list);
  }

  const slugCounts = new Map<string, number>();
  const output: NewSpot[] = [];
  const issues: string[] = [];

  for (const raw of rawSpots) {
    const country = ISO2_TO_NAME.get(raw.country_code);
    if (!country) {
      issues.push(`unknown country_code ${raw.country_code} (id=${raw.id})`);
      continue;
    }

    const city =
      CITY_OVERRIDE[raw.id] ??
      // Fall back to the source `city` slugified, then de-slugified
      // to title case so the display name is at least readable.
      raw.city.charAt(0).toUpperCase() + raw.city.slice(1);
    const citySlug = slugify(city);
    if (!citySlug) {
      issues.push(`empty citySlug (id=${raw.id}, city=${raw.city})`);
      continue;
    }

    const baseNameSlug = slugify(raw.name);
    let slug = baseNameSlug;
    if (!slug) {
      issues.push(`empty slug (id=${raw.id}, name=${raw.name})`);
      continue;
    }
    const seen = slugCounts.get(slug) ?? 0;
    if (seen > 0) {
      slug = `${citySlug}-${slug}`;
    }
    slugCounts.set(slug, seen + 1);

    const address = raw.address.replace(/[,\s]+$/u, "").trim();

    const spot: NewSpot = {
      id: slug,
      name: raw.name,
      city,
      citySlug,
      address,
      types: typesBySpot.get(raw.id) ?? [],
      sports: [...SKATE],
      image: raw.image_url,
      country,
      countryCode: raw.country_code,
      location: decodeEwkb(raw.location),
      createdBy: null,
    };
    output.push(spot);
  }

  if (issues.length > 0) {
    for (const i of issues) console.error(`! ${i}`);
    throw new Error(`${issues.length} spot(s) failed to normalize`);
  }

  writeFileSync(OUT_FILE, renderModule(output), "utf8");
  console.log(
    `wrote ${output.length} spots to ${path.relative(REPO_ROOT, OUT_FILE)}`,
  );
}

function renderModule(spots: readonly NewSpot[]): string {
  const lines: string[] = [];
  lines.push("// Regenerated from /spots.json + /spot_spot_types.json by");
  lines.push("// `pnpm db:regen-spots` (scripts/regen-spots-seed.ts).");
  lines.push("// Do not edit by hand — re-run the generator instead.");
  lines.push("//");
  lines.push("// The `id` field is the slug for re-seed stability; the DB");
  lines.push("// primary key is always `gen_random_uuid()`. Every row is");
  lines.push("// seeded with `createdBy: null` — ownership is only assigned");
  lines.push("// when a real Supabase admin creates or edits the spot through");
  lines.push("// the dashboard.");
  lines.push("");
  lines.push('import type { NewSpot } from "@/lib/repositories/types";');
  lines.push('import type { SportDiscipline } from "@/types/sport-events";');
  lines.push("");
  lines.push("const SKATE: readonly SportDiscipline[] = [");
  lines.push('  "Skateboard",');
  lines.push('  "Rollerblade",');
  lines.push('  "Scooter",');
  lines.push('  "BMX",');
  lines.push("];");
  lines.push("");
  lines.push("export const SOURCE_SPOTS: readonly NewSpot[] = [");
  for (const s of spots) {
    lines.push("  {");
    lines.push(`    id: ${JSON.stringify(s.id)},`);
    lines.push(`    name: ${JSON.stringify(s.name)},`);
    lines.push(`    city: ${JSON.stringify(s.city)},`);
    lines.push(`    citySlug: ${JSON.stringify(s.citySlug)},`);
    lines.push(`    address: ${JSON.stringify(s.address)},`);
    lines.push(`    types: ${JSON.stringify(s.types)},`);
    lines.push(`    sports: [...SKATE],`);
    lines.push(`    image: ${JSON.stringify(s.image)},`);
    lines.push(`    country: ${JSON.stringify(s.country)},`);
    lines.push(`    countryCode: ${JSON.stringify(s.countryCode)},`);
    const { lat, lon } = s.location;
    lines.push(`    location: { lat: ${lat}, lon: ${lon} },`);
    lines.push(`    createdBy: null,`);
    lines.push("  },");
  }
  lines.push("];");
  lines.push("");
  return lines.join("\n");
}

main();
