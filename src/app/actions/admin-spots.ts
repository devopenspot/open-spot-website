"use server"

import { revalidatePath } from "next/cache"
import { log } from "@/lib/log"
import { requireAdmin } from "@/lib/auth/server"
import { getSpotRepositoryAsync } from "@/lib/repositories"
import { NewSpotSchema, SpotPatchSchema } from "@/lib/schemas/spot"
import { uploadSpotImage } from "@/lib/supabase/storage"
import { classifySpotType } from "@/lib/geocode/classify"
import type { ProjectedAddress } from "@/lib/geocode/project"
import type { Spot } from "@/lib/types"
import { SPORT_DISCIPLINES, type SportDiscipline } from "@/types/sport-events"

function strField(form: FormData, key: string): string {
  const v = form.get(key)
  return typeof v === "string" ? v : ""
}

function numberField(form: FormData, key: number | string): number {
  const v = Number(strField(form, String(key)))
  return Number.isFinite(v) ? v : 0
}

function strListField(form: FormData, key: string): string[] {
  return form
    .getAll(key)
    .filter((v): v is string => typeof v === "string")
}

function deriveCitySlug(city: string): string {
  return city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function readSports(form: FormData): SportDiscipline[] {
  return form
    .getAll("sports")
    .filter(
      (v): v is SportDiscipline =>
        typeof v === "string" &&
        SPORT_DISCIPLINES.includes(v as SportDiscipline),
    )
}

/**
 * Cached lookup of the current set of valid `spot_types` slugs. Used
 * to validate incoming `types` arrays from forms before they reach the
 * repository (the DB has a FK with `onDelete: "restrict"`, but we'd
 * rather throw a clean error than surface a constraint violation).
 */
async function getValidSpotTypeSlugs(): Promise<ReadonlySet<string>> {
  const repo = await getSpotRepositoryAsync()
  const rows = await repo.listAllSpotTypes()
  return new Set(rows.map((r) => r.slug))
}

function assertValidSpotTypes(
  types: readonly string[],
  validSlugs: ReadonlySet<string>,
): void {
  for (const t of types) {
    if (!validSlugs.has(t)) {
      throw new Error(`Unknown spot type: ${t}`)
    }
  }
}

/**
 * Reverse-geocoded address returned by `/api/geocode/reverse`. Embedded
 * in the action so the form can be auto-populated on the new-spot page
 * without a second round trip.
 */
export type LookupAddress = ProjectedAddress

/**
 * Server-side classifier delegate. The form sends the raw Nominatim
 * response as a JSON blob in `rawNominatim`; the action runs the
 * classifier server-side and returns the default spot type slug. The
 * admin can override it (and add more) on the form.
 */
function defaultTypeFromLookup(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null
  return classifySpotType(raw as Parameters<typeof classifySpotType>[0])
}

/**
 * Create a new spot from a lat/lon lookup + admin-edited form fields.
 * Used by `/admin/spots/new`. The legacy public `/post` flow used the
 * simpler `createSpotAction` (still wired into the spots-store).
 */
export async function createSpotFromLookupAction(
  formData: FormData,
): Promise<Spot> {
  const user = await requireAdmin()

  const fileEntry = formData.get("image")
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null

  let providedId: string | undefined
  let imagePath: string | null = null
  if (file) {
    try {
      providedId = crypto.randomUUID()
      const uploaded = await uploadSpotImage(file, providedId)
      imagePath = uploaded.path
    } catch (err) {
      log.error("create_spot.upload_failed", {
        error: err instanceof Error ? err.message : String(err),
      })
      throw err
    }
  }

  const crowdLevel = numberField(formData, "crowdLevel")
  const city = strField(formData, "city")
  const name = strField(formData, "name")
  const address = strField(formData, "address")
  const types = strListField(formData, "type")
  const imageUrl = strField(formData, "imageUrl")
  const country = strField(formData, "country")
  const countryCode = strField(formData, "countryCode").toUpperCase()
  const sports = readSports(formData)
  const providedCitySlug = strField(formData, "citySlug") || deriveCitySlug(city)
  const lat = numberField(formData, "lat")
  const lon = numberField(formData, "lon")

  const validSpotTypeSlugs = await getValidSpotTypeSlugs()
  assertValidSpotTypes(types, validSpotTypeSlugs)

  const input = {
    id: providedId,
    name,
    city,
    citySlug: providedCitySlug,
    address,
    types,
    sports,
    image: imageUrl,
    imagePath,
    crowdLevel,
    country,
    countryCode: countryCode || undefined,
    location: { lat, lon },
    createdBy: user.id,
  }

  const parsed = NewSpotSchema.parse(input)
  const repo = await getSpotRepositoryAsync()
  const spot = await repo.create(parsed)
  revalidatePath("/admin/spots")
  return spot
}

export async function updateSpotAction(
  id: string,
  formData: FormData,
): Promise<Spot> {
  await requireAdmin()

  const patch: Record<string, unknown> = {}
  const text = (k: string) => strField(formData, k)
  if (text("name")) patch.name = text("name")
  if (text("city")) patch.city = text("city")
  if (text("citySlug")) patch.citySlug = text("citySlug")
  if (text("address")) patch.address = text("address")
  if (text("imageUrl")) patch.image = text("imageUrl")
  if (text("country")) patch.country = text("country")
  const countryCode = strField(formData, "countryCode").toUpperCase()
  if (countryCode) patch.countryCode = countryCode
  if (formData.has("sports")) {
    patch.sports = readSports(formData)
  }
  if (formData.has("type")) {
    patch.types = strListField(formData, "type")
  }
  if (formData.has("crowdLevel")) {
    patch.crowdLevel = numberField(formData, "crowdLevel")
  }
  if (formData.has("lat") && formData.has("lon")) {
    patch.location = {
      lat: numberField(formData, "lat"),
      lon: numberField(formData, "lon"),
    }
  }

  if (Array.isArray(patch.types)) {
    const validSpotTypeSlugs = await getValidSpotTypeSlugs()
    assertValidSpotTypes(patch.types as string[], validSpotTypeSlugs)
  }

  const parsed = SpotPatchSchema.parse(patch)
  const repo = await getSpotRepositoryAsync()
  const spot = await repo.update(id, parsed)
  revalidatePath(`/spots/${id}`)
  revalidatePath("/admin/spots")
  return spot
}

export async function deleteSpotAction(id: string): Promise<void> {
  await requireAdmin()
  const repo = await getSpotRepositoryAsync()
  await repo.delete(id)
  revalidatePath("/admin/spots")
  revalidatePath("/")
}

/**
 * Exposed so the new-spot page can run the Nominatim → SpotType mapping
 * server-side without re-implementing the heuristic on the client.
 * Returns the spot type slug (e.g. "plaza"); falls back to "plaza"
 * (the first row seeded by `src/db/seed-data/taxonomy.ts`) if the
 * classifier yields nothing. The form pre-selects this as the first
 * type chip; the admin can add more.
 */
export async function defaultSpotTypeForLookup(
  rawNominatim: unknown,
): Promise<string> {
  await requireAdmin()
  return defaultTypeFromLookup(rawNominatim) ?? "plaza"
}
