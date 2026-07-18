import { NextResponse, type NextRequest } from "next/server"
import { requireAdmin } from "@/lib/auth/server"
import { getServerUserFromCookies } from "@/lib/auth"
import { isSupabaseConfigured } from "@/lib/env"
import { NewSpotSchema } from "@/lib/schemas/spot"
import { createSpot } from "@/lib/services/spots"
import { uploadSpotImage } from "@/lib/supabase/storage"
import { log } from "@/lib/log"

async function currentUserOrThrow() {
  if (!isSupabaseConfigured()) {
    return getServerUserFromCookies()
  }
  return requireAdmin()
}

export async function POST(request: NextRequest) {
  let user
  try {
    user = await currentUserOrThrow()
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unauthorized"
    if (msg === "Admin only") {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 },
    )
  }

  const fileEntry = form.get("image")
  const file =
    fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null

  let providedId: string | undefined
  let imagePath: string | null = null
  if (file) {
    try {
      providedId = crypto.randomUUID()
      const uploaded = await uploadSpotImage(file, providedId)
      imagePath = uploaded.path
    } catch (err) {
      log.error(
        "api.admin.spots.upload_failed",
        err instanceof Error ? err.message : err,
      )
      return NextResponse.json(
        { error: "Image upload failed" },
        { status: 502 },
      )
    }
  }

  const strField = (k: string) => {
    const v = form.get(k)
    return typeof v === "string" ? v : ""
  }
  const numField = (k: string) => {
    const n = Number(strField(k))
    return Number.isFinite(n) ? n : 0
  }
  const strListField = (k: string) =>
    form
      .getAll(k)
      .filter((v): v is string => typeof v === "string")

  const country = strField("country")
  const countryCode = strField("countryCode").toUpperCase()

  const raw = {
    id: providedId,
    name: strField("name"),
    city: strField("city"),
    citySlug: strField("citySlug") || undefined,
    address: strField("address"),
    types: strListField("type"),
    sports: strListField("sports"),
    image: strField("imageUrl"),
    imagePath: imagePath ?? undefined,
    crowdLevel: numField("crowdLevel"),
    country,
    countryCode: countryCode || undefined,
    location: {
      lat: numField("lat"),
      lon: numField("lon"),
    },
    createdBy: user.id,
  }

  const parsed = NewSpotSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid spot", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const spot = await createSpot(parsed.data)
    return NextResponse.json(spot, { status: 201 })
  } catch (err) {
    log.error(
      "api.admin.spots.create_failed",
      err instanceof Error ? err.message : err,
    )
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
