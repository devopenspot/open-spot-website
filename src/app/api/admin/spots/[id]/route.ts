import { NextResponse, type NextRequest } from "next/server"
import { requireAdmin } from "@/lib/auth/server"
import { getServerUserFromCookies } from "@/lib/auth"
import { isSupabaseConfigured } from "@/lib/env"
import { SpotPatchSchema } from "@/lib/schemas/spot"
import { deleteSpot, updateSpot } from "@/lib/services/spots"
import { log } from "@/lib/log"

async function currentUserOrThrow() {
  if (!isSupabaseConfigured()) {
    return getServerUserFromCookies()
  }
  return requireAdmin()
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
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

  const parsed = SpotPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid patch", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const spot = await updateSpot(id, parsed.data)
    return NextResponse.json(spot)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error"
    if (msg.startsWith("Spot not found")) {
      return NextResponse.json({ error: msg }, { status: 404 })
    }
    log.error("api.admin.spots.update_failed", msg)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }

  void user
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await currentUserOrThrow()
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unauthorized"
    if (msg === "Admin only") {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  try {
    await deleteSpot(id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error"
    if (msg.startsWith("Spot not found")) {
      return NextResponse.json({ error: msg }, { status: 404 })
    }
    log.error("api.admin.spots.delete_failed", msg)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
