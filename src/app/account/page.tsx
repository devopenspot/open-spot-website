'use client';

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { showToast } from '@/hooks/useToast'
import { UserAvatar } from '@/components/ui'

export default function AccountPage() {
  const router = useRouter()
  const user = useUser()
  const [pending, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/signout', { method: 'POST' })
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; error?: string }
          | null
        if (!res.ok || !data?.ok) {
          showToast(data?.error ?? 'Sign-out failed', 'error')
          return
        }
        showToast('Signed out', 'success')
        router.push('/')
        router.refresh()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Sign-out failed'
        showToast(msg, 'error')
      }
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

      <div className="mt-8 flex items-center gap-4">
        <UserAvatar user={user} size="lg" />
        <div className="min-w-0">
          <span className="block font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">
            Signed in as
          </span>
          <span className="block text-base font-bold text-on-surface truncate">
            {user.name}
          </span>
          <span className="block text-xs font-mono text-secondary truncate">
            {user.email}
          </span>
        </div>
      </div>

      <dl className="mt-8 space-y-3 rounded-lg border border-outline-variant bg-surface-container-low p-4 text-xs">
        <div className="flex items-center justify-between gap-4">
          <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-secondary">
            User ID
          </dt>
          <dd className="font-mono text-[10px] break-all text-on-surface text-right">
            {user.id}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-secondary">
            Provider
          </dt>
          <dd className="font-mono text-[10px] text-on-surface">Google</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={pending}
        className="mt-6 w-full px-5 py-3 rounded-lg border border-outline text-xs font-bold tracking-widest uppercase hover:bg-surface-container transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? 'Signing out…' : 'Sign out'}
      </button>
    </section>
  )
}
