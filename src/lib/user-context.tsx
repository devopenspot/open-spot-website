'use client';

import { createContext, useContext, type ReactNode } from 'react'
import { DEV_USER_ID, type User } from '@/lib/user'

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
    return {
      id: DEV_USER_ID,
      name: 'Active Scout',
      email: 'devopenspot@gmail.com',
      initials: 'OS',
      avatarUrl: null,
      isAdmin: true,
    }
  }
  return ctx
}