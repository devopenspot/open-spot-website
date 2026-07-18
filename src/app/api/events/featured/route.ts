import { NextResponse } from "next/server"
import { findFeaturedEvent } from "@/lib/services/events"
import { log } from "@/lib/log"

export async function GET() {
  try {
    const event = await findFeaturedEvent()
    if (!event) {
      return NextResponse.json({ error: "No featured event" }, { status: 404 })
    }
    return NextResponse.json(event)
  } catch (err) {
    log.error(
      "api.events.featured_failed",
      err instanceof Error ? err.message : err,
    )
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
