'use client';

// SPEC §A.1: no server actions for auth. Sign-out is a client `fetch` to
// the dedicated `/api/auth/signout` route handler.
import { useUser } from '@/hooks/useUser'
import { useSignOut } from '@/hooks/useSignOut'
import { UserAvatar } from '@/components/ui'

export default function AccountPage() {
  const user = useUser()
  const { signOut, pending } = useSignOut()

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
        onClick={signOut}
        disabled={pending}
        aria-busy={pending}
        className="mt-6 w-full px-5 py-3 rounded-lg border border-outline text-xs font-bold tracking-widest uppercase hover:bg-surface-container transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? 'Signing out…' : 'Sign out'}
      </button>
    </section>
  )
}
