import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { getServerUserFromCookies } from "@/lib/auth"
import { isAdminUser } from "@/lib/admin"
import { env } from "@/lib/env"
import { log } from "@/lib/log"
import { projectAddress, type NominatimResponse } from "@/lib/geocode/project"

const Query = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
})

export async function GET(request: NextRequest) {
  const user = await getServerUserFromCookies()
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 })
  }

  const url = new URL(request.url)
  const latStr = url.searchParams.get("lat")
  const lonStr = url.searchParams.get("lon")
  if (!latStr || !lonStr) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 })
  }
  const parsed = Query.safeParse({ lat: latStr, lon: lonStr })
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 })
  }

  const { lat, lon } = parsed.data
  const nominatim = `${env.NOMINATIM_URL}/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1&zoom=18`
  try {
    const r = await fetch(nominatim, {
      headers: {
        "User-Agent": env.NOMINATIM_USER_AGENT,
        Accept: "application/json",
      },
      // Nominatim enforces a 1 req/sec policy; do not cache.
      cache: "no-store",
    })
    if (!r.ok) {
      log.warn("geocode.reverse_failed", { status: r.status, lat, lon })
      return NextResponse.json(
        { error: "Reverse geocode failed" },
        { status: 502 },
      )
    }
    const raw = (await r.json()) as NominatimResponse
    return NextResponse.json({ address: projectAddress(raw) })
  } catch (e) {
    log.error("geocode.reverse_threw", e instanceof Error ? e.message : String(e))
    return NextResponse.json(
      { error: "Reverse geocode unavailable" },
      { status: 502 },
    )
  }
}
