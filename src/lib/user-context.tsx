'use client';

import { createContext, useContext, type ReactNode } from 'react'
import type { User } from '@/lib/user'

const UserCtx = createContext<User | null>(null)

export function UserProvider({
  user,
  children,
}: {
  user: User
  children: ReactNode
}) {
  return <UserCtx.Provider value={user}>{children}</UserCtx.Provider>
}

export function useUser(): User {
  const ctx = useContext(UserCtx)
  if (!ctx) {
    // Fall back to a synthesized placeholder if the provider is missing.
    return {
      id: 'dev',
      name: 'Active Scout',
      email: 'dev@openspot.local',
      initials: 'OS',
      avatarUrl: null,
    }
  }
  return ctx
}