"use server"

import { revalidateTag } from "next/cache"
import { log } from "@/lib/log"
import { NewSpotSchema } from "@/lib/schemas/spot"
import { getSpotRepositoryAsync } from "@/lib/repositories"
import type { NewSpot } from "@/lib/repositories"
import type { Spot } from "@/lib/types"
import { uploadSpotImage } from "@/lib/supabase/storage"
import { REFERENCE_LAT, REFERENCE_LON } from "@/lib/spots/geo"
import { CROWD_LEVEL } from "@/lib/constants"
import { requireUser } from "@/lib/auth/server"

function strField(form: FormData, key: string): string {
  const v = form.get(key)
  return typeof v === "string" ? v : ""
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
  const type = strField(formData, "type") as Spot["type"]
  const imageUrl = strField(formData, "imageUrl")
  const country = strField(formData, "country")
  const communityNote = strField(formData, "communityNote")
  const features = strField(formData, "features")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const providedCitySlug = strField(formData, "citySlug") || deriveCitySlug(city)

  const input: NewSpot = {
    id: providedId,
    name,
    city,
    citySlug: providedCitySlug,
    address,
    type,
    features,
    image: imageUrl,
    imagePath,
    communityNote,
    crowdLevel,
    crowdLevelLabel: crowdLabel(crowdLevel),
    country,
    location: { lat: REFERENCE_LAT, lon: REFERENCE_LON },
    createdBy: user.id,
  }

  const parsed = NewSpotSchema.parse(input)
  const repo = await getSpotRepositoryAsync()
  const spot = await repo.create(parsed)
  revalidateTag("spots", "max")
  return spot
}
