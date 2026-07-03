import { NextResponse } from "next/server"
import { isSupabaseConfigured } from "@/lib/env"
import { getSessionUser } from "@/lib/auth/server"

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ user: null, configured: false }, { status: 200 })
  }
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ user: null, configured: true }, { status: 200 })
  }
  return NextResponse.json({ user, configured: true }, { status: 200 })
}
