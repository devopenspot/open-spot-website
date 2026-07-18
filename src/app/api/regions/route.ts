import { NextResponse } from "next/server"
import { listRegions } from "@/lib/services/regions"
import { log } from "@/lib/log"

export async function GET() {
  try {
    const regions = await listRegions()
    return NextResponse.json({ items: regions })
  } catch (err) {
    log.error(
      "api.regions.list_failed",
      err instanceof Error ? err.message : err,
    )
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
