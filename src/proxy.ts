import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { log } from "@/lib/log"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? null

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return response
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // Refresh the session if needed. getClaims validates the cookie JWT
  // locally (asymmetric signing) or via the auth server (symmetric) — no
  // network round trip to fetch the full user record on every request.
  const { error } = await supabase.auth.getClaims()
  if (error) {
    log.warn("proxy: supabase.auth.getClaims failed", error.message)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
