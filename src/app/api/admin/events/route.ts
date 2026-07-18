import { NextResponse, type NextRequest } from "next/server"
import { requireAdmin } from "@/lib/auth/server"
import { getServerUserFromCookies } from "@/lib/auth"
import { isSupabaseConfigured } from "@/lib/env"
import { NewSportEventSchema } from "@/lib/schemas/event"
import { createEvent } from "@/lib/services/events"
import { log } from "@/lib/log"

async function currentUserOrThrow() {
  if (!isSupabaseConfigured()) {
    return getServerUserFromCookies()
  }
  return requireAdmin()
}

export async function POST(request: NextRequest) {
  try {
    await currentUserOrThrow()
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unauthorized"
    if (msg === "Admin only") {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = NewSportEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid event", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const event = await createEvent(parsed.data)
    return NextResponse.json(event, { status: 201 })
  } catch (err) {
    log.error(
      "api.admin.events.create_failed",
      err instanceof Error ? err.message : err,
    )
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
