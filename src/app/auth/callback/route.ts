import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureProfileRow } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/env'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL(next, url))
  }
  if (!code) {
    return NextResponse.redirect(new URL(next, url))
  }
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(new URL('/login?error=oauth', url))
  }
  const { data } = await supabase.auth.getUser()
  if (data.user) {
    await ensureProfileRow({
      id: data.user.id,
      name:
        (data.user.user_metadata as { display_name?: string } | null)
          ?.display_name ?? data.user.email?.split('@')[0] ?? 'Scout',
      email: data.user.email ?? '',
      initials:
        (data.user.user_metadata as { initials?: string } | null)
          ?.initials ?? 'OS',
    })
  }
  return NextResponse.redirect(new URL(next, url))
}