'use client';

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { useUser } from '@/hooks/useUser'
import { showToast } from '@/hooks/useToast'

export default function AccountPage() {
  const router = useRouter()
  const user = useUser()
  const [pending, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(async () => {
      try {
        if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const supabase = getSupabaseBrowserClient()
          await supabase.auth.signOut()
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Sign-out failed'
        showToast(msg, 'error')
        return
      }
      showToast('Signed out', 'success')
      router.push('/')
      router.refresh()
    })
  }

  return (
    <section
      id="account-tab"
      role="tabpanel"
      aria-labelledby="nav-btn-account"
      className="max-w-md mx-auto py-16 animate-fade-in"
    >
      <h1 className="font-display text-2xl font-bold tracking-tight uppercase text-on-surface sm:text-3xl">
        Account
      </h1>
      <div className="mt-6 space-y-2 rounded-lg border border-outline-variant bg-surface-container-low p-4">
        <div>
          <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary">
            Display name
          </span>
          <span className="text-xs font-semibold">{user.name}</span>
        </div>
        <div>
          <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary">
            Email
          </span>
          <span className="text-xs font-mono">{user.email}</span>
        </div>
        <div>
          <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary">
            User ID
          </span>
          <span className="text-[10px] font-mono break-all">{user.id}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={pending}
        className="mt-6 w-full px-5 py-3 rounded-lg border border-outline text-xs font-bold tracking-widest uppercase hover:bg-surface-container transition-all disabled:opacity-60"
      >
        {pending ? 'Signing out…' : 'Sign out'}
      </button>
    </section>
  )
}