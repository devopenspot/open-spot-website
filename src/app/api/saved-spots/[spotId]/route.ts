import { NextResponse, type NextRequest } from "next/server"
import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth/server"
import { getServerUserFromCookies } from "@/lib/auth"
import { isSupabaseConfigured } from "@/lib/env"
import { unsaveSpotForUser } from "@/lib/services/saved-spots"
import { log } from "@/lib/log"

async function currentUserOrThrow() {
  if (!isSupabaseConfigured()) {
    return getServerUserFromCookies()
  }
  return requireUser()
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ spotId: string }> },
) {
  let user
  try {
    user = await currentUserOrThrow()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { spotId } = await context.params
  if (!spotId) {
    return NextResponse.json({ error: "Missing spotId" }, { status: 400 })
  }
  try {
    await unsaveSpotForUser(user.id, spotId)
    revalidatePath("/saved")
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error"
    log.error("api.saved_spots.unsave_failed", msg)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
