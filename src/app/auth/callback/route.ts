import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureProfileRow } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/env'
import { sanitizeNext } from '@/lib/auth/server'
import { log } from '@/lib/log'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = sanitizeNext(url.searchParams.get('next'))

  // Log which query keys are present so we can diagnose the
  // `?error=oauth` redirect without dumping the one-time `code`.
  const presentKeys = Array.from(url.searchParams.keys())
  log.error('auth/callback: hit', { presentKeys, hasCode: Boolean(code) })

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL(next, url))
  }
  if (!code) {
    log.error('auth/callback: missing code', {
      error: url.searchParams.get('error'),
      errorDescription: url.searchParams.get('error_description'),
    })
    return NextResponse.redirect(new URL('/login?error=oauth', url))
  }
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    log.error('auth/callback: exchangeCodeForSession failed', error.message)
    return NextResponse.redirect(new URL('/login?error=oauth', url))
  }
  // getClaims validates the freshly-set session cookie and returns the
  // user identity from the JWT payload. No network round trip to /user.
  const { data: claimsResult, error: claimsError } = await supabase.auth.getClaims()
  if (claimsError) {
    log.error('auth/callback: getClaims failed after exchange', claimsError.message)
    return NextResponse.redirect(new URL('/login?error=oauth', url))
  }
  const claims = claimsResult?.claims
  if (claims?.sub) {
    const meta = (claims.user_metadata ?? {}) as Record<string, unknown>
    const email = (typeof claims.email === 'string' && claims.email) || ''
    const name =
      (typeof meta['display_name'] === 'string' && meta['display_name']) ||
      (typeof meta['full_name'] === 'string' && meta['full_name']) ||
      (typeof meta['name'] === 'string' && meta['name']) ||
      email.split('@')[0] ||
      'Scout'
    const initials =
      (typeof meta['initials'] === 'string' && meta['initials']) ||
      name
        .split(/\s+/)
        .map((p: string) => p[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('') ||
      'OS'
    const avatarUrl =
      (typeof meta['avatar_url'] === 'string' && meta['avatar_url']) ||
      (typeof meta['picture'] === 'string' && meta['picture']) ||
      null
    await ensureProfileRow({
      id: claims.sub,
      name,
      email,
      initials,
      avatarUrl,
    })
  }
  return NextResponse.redirect(new URL(next, url))
}
