import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureProfileRow } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/env'
import { sanitizeNext } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = sanitizeNext(url.searchParams.get('next'))
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL(next, url))
  }
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=oauth', url))
  }
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL('/login?error=oauth', url))
  }
  const { data } = await supabase.auth.getUser()
  if (data.user) {
    const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>
    const email = data.user.email ?? ''
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
      id: data.user.id,
      name,
      email,
      initials,
      avatarUrl,
    })
  }
  return NextResponse.redirect(new URL(next, url))
}
