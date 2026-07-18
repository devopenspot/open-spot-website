import { NextResponse, type NextRequest } from "next/server"
import { findSpotById } from "@/lib/services/spots"
import { log } from "@/lib/log"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  try {
    const spot = await findSpotById(id)
    if (!spot) {
      return NextResponse.json({ error: "Spot not found" }, { status: 404 })
    }
    return NextResponse.json(spot)
  } catch (err) {
    log.error(
      "api.spots.find_failed",
      err instanceof Error ? err.message : err,
    )
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
