import { NextResponse, type NextRequest } from "next/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireUser } from "@/lib/auth/server"
import { getServerUserFromCookies } from "@/lib/auth"
import { isSupabaseConfigured } from "@/lib/env"
import {
  listSavedSpotsForUser,
  saveSpotForUser,
} from "@/lib/services/saved-spots"
import { log } from "@/lib/log"

const PostBody = z
  .object({
    spotId: z.string().min(1),
  })
  .strict()

/**
 * Resolves the current user for an API route. Throws if the visitor
 * is not signed in and Supabase is configured. Returns the dev
 * placeholder in unconfigured environments.
 */
async function currentUserOrThrow() {
  if (!isSupabaseConfigured()) {
    return getServerUserFromCookies()
  }
  return requireUser()
}

export async function GET() {
  let user
  try {
    user = await currentUserOrThrow()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const result = await listSavedSpotsForUser(user.id, { limit: 200 })
    return NextResponse.json(result)
  } catch (err) {
    log.error(
      "api.saved_spots.list_failed",
      err instanceof Error ? err.message : err,
    )
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let user
  try {
    user = await currentUserOrThrow()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = PostBody.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    await saveSpotForUser(user.id, parsed.data.spotId)
    // `revalidatePath` keeps the `/saved` page in sync on next
    // navigation. `revalidateTag` inside the service invalidates
    // the per-user cache.
    revalidatePath("/saved")
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error"
    if (msg.startsWith("Spot not found")) {
      return NextResponse.json({ error: msg }, { status: 404 })
    }
    log.error("api.saved_spots.save_failed", msg)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
