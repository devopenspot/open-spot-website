import { NextResponse } from "next/server"
import { checkDbHealth } from "@/lib/db/health"
import { APP_VERSION } from "@/lib/system-info"

export async function GET() {
  const db = await checkDbHealth()
  return NextResponse.json({
    ok: db.ok,
    db: { ok: db.ok, latencyMs: db.latencyMs, error: db.error },
    version: APP_VERSION,
  })
}