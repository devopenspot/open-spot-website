"use server"

import { log } from "@/lib/log"
import { NewSpotSchema } from "@/lib/schemas/spot"
import { getSpotRepositoryAsync } from "@/lib/repositories"
import type { NewSpot } from "@/lib/repositories"
import type { Spot } from "@/lib/types"
import { uploadSpotImage } from "@/lib/supabase/storage"
import { requireUser } from "@/lib/auth/server"

// Placeholder coordinates for a newly-created spot. The admin form's
// LatLonEditor (admin/spots/SpotFormFields) overrides this immediately
// on edit, so it never reaches public surfaces in this state.
const NEW_SPOT_PLACEHOLDER_LAT = 34.0522;
const NEW_SPOT_PLACEHOLDER_LON = -118.2437;

function strField(form: FormData, key: string): string {
  const v = form.get(key)
  return typeof v === "string" ? v : ""
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

export async function createSpotAction(formData: FormData): Promise<Spot> {
  const user = await requireUser()

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

  const crowdLevel = Number(strField(formData, "crowdLevel")) || 0
  const city = strField(formData, "city")
  const name = strField(formData, "name")
  const address = strField(formData, "address")
  const types = strListField(formData, "type")
  const imageUrl = strField(formData, "imageUrl")
  const country = strField(formData, "country")
  const providedCitySlug = strField(formData, "citySlug") || deriveCitySlug(city)

  const input: NewSpot = {
    id: providedId,
    name,
    city,
    citySlug: providedCitySlug,
    address,
    types,
    sports: [],
    image: imageUrl,
    imagePath,
    crowdLevel,
    country,
    location: { lat: NEW_SPOT_PLACEHOLDER_LAT, lon: NEW_SPOT_PLACEHOLDER_LON },
    createdBy: user.id,
  }

  const parsed = NewSpotSchema.parse(input)
  const repo = await getSpotRepositoryAsync()
  const spot = await repo.create(parsed)
  return spot
}
