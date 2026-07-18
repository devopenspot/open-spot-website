import { NextResponse } from "next/server"
import { listSpotTypes } from "@/lib/services/spot-types"
import { log } from "@/lib/log"

export async function GET() {
  try {
    const types = await listSpotTypes()
    return NextResponse.json({ items: types })
  } catch (err) {
    log.error(
      "api.spot_types.list_failed",
      err instanceof Error ? err.message : err,
    )
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
