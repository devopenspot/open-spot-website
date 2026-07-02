'use client';

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { showToast } from '@/hooks/useToast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSending(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        showToast(error.message, 'error')
      } else {
        setSent(true)
        showToast('Check your email for the magic link', 'success')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <section
      id="login-tab"
      role="tabpanel"
      aria-labelledby="nav-btn-login"
      className="max-w-md mx-auto py-16 animate-fade-in"
    >
      <h1 className="font-display text-2xl font-bold tracking-tight uppercase text-on-surface sm:text-3xl">
        Sign in
      </h1>
      <p className="mt-2 text-xs text-secondary leading-relaxed">
        We use a passwordless email link. We never store your password.
      </p>
      {sent ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-xs"
        >
          Magic link sent to <span className="font-mono">{email}</span>. Check your inbox.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-secondary mb-1.5">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-xs font-medium text-on-surface shadow-sm focus:border-outline focus:outline-none"
              placeholder="rider@openspot.local"
            />
          </label>
          <button
            type="submit"
            disabled={sending}
            className="w-full px-5 py-3 rounded-lg bg-on-surface text-surface text-xs font-bold tracking-widest uppercase hover:bg-on-surface/90 transition-all disabled:opacity-60"
          >
            {sending ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
      )}
      <button
        type="button"
        onClick={() => router.push('/')}
        className="mt-6 text-[10px] font-mono uppercase tracking-widest text-secondary hover:text-on-surface"
      >
        Back to directory
      </button>
    </section>
  )
}