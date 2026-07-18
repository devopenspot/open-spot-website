import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { SpotQuerySchema } from "@/lib/schemas/spot"
import { listSpots } from "@/lib/services/spots"
import { log } from "@/lib/log"

// Coerces comma-separated `types` and `ids` query params into arrays.
// `SpotQuerySchema.types` and `.ids` are `z.array(...)`, so the default
// `safeParse` would reject `?types=skatepark,bowl` as a string. This
// transform pre-shapes the input so the existing schema accepts it.
const Query = z
  .object({
    q: SpotQuerySchema.shape.q,
    types: z
      .string()
      .optional()
      .transform((v) =>
        v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      )
      .pipe(SpotQuerySchema.shape.types),
    country: SpotQuerySchema.shape.country,
    city: SpotQuerySchema.shape.city,
    ids: z
      .string()
      .optional()
      .transform((v) =>
        v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      )
      .pipe(SpotQuerySchema.shape.ids),
    near: z
      .string()
      .optional()
      .transform((v) => {
        if (!v) return undefined
        const [latStr, lonStr, radiusStr] = v.split(",")
        if (!latStr || !lonStr || !radiusStr) return undefined
        const lat = Number(latStr)
        const lon = Number(lonStr)
        const radiusMeters = Number(radiusStr)
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(radiusMeters)) {
          return undefined
        }
        return { lat, lon, radiusMeters }
      })
      .pipe(SpotQuerySchema.shape.near),
    savedBy: SpotQuerySchema.shape.savedBy,
    cursor: SpotQuerySchema.shape.cursor,
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : undefined))
      .pipe(SpotQuerySchema.shape.limit),
  })
  .strict()

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const raw: Record<string, string> = {}
  for (const [k, v] of url.searchParams.entries()) raw[k] = v

  const parsed = Query.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const result = await listSpots(parsed.data)
    return NextResponse.json(result)
  } catch (err) {
    log.error(
      "api.spots.list_failed",
      err instanceof Error ? err.message : err,
    )
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
