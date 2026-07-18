import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { findNearbySpots } from "@/lib/services/spots"
import { log } from "@/lib/log"

const Query = z
  .object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
    radiusMeters: z.coerce.number().positive().max(50_000).default(5_000),
  })
  .strict()

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const parsed = Query.safeParse({
    lat: url.searchParams.get("lat") ?? undefined,
    lon: url.searchParams.get("lon") ?? undefined,
    radiusMeters: url.searchParams.get("radiusMeters") ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  try {
    const items = await findNearbySpots(parsed.data)
    return NextResponse.json({ items })
  } catch (err) {
    log.error(
      "api.spots.nearby_failed",
      err instanceof Error ? err.message : err,
    )
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
