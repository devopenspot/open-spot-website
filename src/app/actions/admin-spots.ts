"use server"

import { revalidatePath } from "next/cache"
import { log } from "@/lib/log"
import { requireAdmin } from "@/lib/auth/server"
import { getSpotRepositoryAsync } from "@/lib/repositories"
import { NewSpotSchema, SpotPatchSchema } from "@/lib/schemas/spot"
import { uploadSpotImage } from "@/lib/supabase/storage"
import { CROWD_LEVEL } from "@/lib/constants"
import { classifySpotType } from "@/lib/geocode/classify"
import type { ProjectedAddress } from "@/lib/geocode/project"
import type { Spot } from "@/lib/types"
import type { SportDiscipline } from "@/types/sport-events"

function strField(form: FormData, key: string): string {
  const v = form.get(key)
  return typeof v === "string" ? v : ""
}

function numberField(form: FormData, key: string): number {
  const v = Number(strField(form, key))
  return Number.isFinite(v) ? v : 0
}

function crowdLabel(level: number): string {
  if (level > CROWD_LEVEL.HIGH_MIN) return "High (Busy)"
  if (level > CROWD_LEVEL.LOW_MAX) return "Moderate Activity"
  return "Low Crowd (Ideal)"
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
    .filter((v): v is string => typeof v === "string" && v.length > 0) as SportDiscipline[]
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
 * classifier server-side and returns the default spot type. The admin
 * can override it on the form.
 */
function defaultTypeFromLookup(raw: unknown): Spot["type"] | null {
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
  const type = (strField(formData, "type") || "Plaza") as Spot["type"]
  const imageUrl = strField(formData, "imageUrl")
  const country = strField(formData, "country")
  const countryCode = strField(formData, "countryCode").toUpperCase()
  const communityNote = strField(formData, "communityNote")
  const features = strField(formData, "features")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const sports = readSports(formData)
  const providedCitySlug = strField(formData, "citySlug") || deriveCitySlug(city)
  const lat = numberField(formData, "lat")
  const lon = numberField(formData, "lon")

  const input = {
    id: providedId,
    name,
    city,
    citySlug: providedCitySlug,
    address,
    type,
    features,
    sports,
    image: imageUrl,
    imagePath,
    communityNote,
    crowdLevel,
    crowdLevelLabel: crowdLabel(crowdLevel),
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
  if (text("type")) patch.type = text("type")
  if (text("imageUrl")) patch.image = text("imageUrl")
  if (text("country")) patch.country = text("country")
  const countryCode = strField(formData, "countryCode").toUpperCase()
  if (countryCode) patch.countryCode = countryCode
  if (text("communityNote")) patch.communityNote = text("communityNote")
  const featuresStr = text("features")
  if (featuresStr) {
    patch.features = featuresStr.split(",").map((s) => s.trim()).filter(Boolean)
  }
  if (formData.has("sports")) {
    patch.sports = readSports(formData)
  }
  if (formData.has("crowdLevel")) {
    const level = numberField(formData, "crowdLevel")
    patch.crowdLevel = level
    patch.crowdLevelLabel = crowdLabel(level)
  }
  if (formData.has("lat") && formData.has("lon")) {
    patch.location = {
      lat: numberField(formData, "lat"),
      lon: numberField(formData, "lon"),
    }
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
 */
export async function defaultSpotTypeForLookup(
  rawNominatim: unknown,
): Promise<Spot["type"]> {
  await requireAdmin()
  return defaultTypeFromLookup(rawNominatim) ?? "Plaza"
}
