import { NextResponse, type NextRequest } from "next/server"
import { findEventById } from "@/lib/services/events"
import { log } from "@/lib/log"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  try {
    const event = await findEventById(id)
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    return NextResponse.json(event)
  } catch (err) {
    log.error(
      "api.events.find_failed",
      err instanceof Error ? err.message : err,
    )
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
