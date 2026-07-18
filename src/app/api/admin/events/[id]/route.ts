import { NextResponse, type NextRequest } from "next/server"
import { requireAdmin } from "@/lib/auth/server"
import { SportEventPatchSchema } from "@/lib/schemas/event"
import { deleteEvent, updateEvent } from "@/lib/services/events"
import { log } from "@/lib/log"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unauthorized"
    if (msg === "Admin only") {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: msg }, { status: 401 })
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = SportEventPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid patch", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const event = await updateEvent(id, parsed.data)
    return NextResponse.json(event)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error"
    if (msg.startsWith("Sport event not found")) {
      return NextResponse.json({ error: msg }, { status: 404 })
    }
    log.error("api.admin.events.update_failed", msg)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unauthorized"
    if (msg === "Admin only") {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: msg }, { status: 401 })
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  try {
    await deleteEvent(id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error"
    if (msg.startsWith("Sport event not found")) {
      return NextResponse.json({ error: msg }, { status: 404 })
    }
    log.error("api.admin.events.delete_failed", msg)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
