import { NextResponse } from "next/server"
import { AuthConfigError, configNotReadyResponse, signOut } from "@/lib/auth/server"

export async function POST() {
  try {
    const { error } = await signOut()
    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof AuthConfigError) return configNotReadyResponse()
    const message = err instanceof Error ? err.message : "Unexpected error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
