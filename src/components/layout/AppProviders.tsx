'use client';

import { AppStateProvider } from './AppStateProvider';
import { AppShell } from './AppShell';
import type { ReactNode } from 'react';

export function AppProviders({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AppStateProvider>
      <AppShell>{children}</AppShell>
    </AppStateProvider>
  );
}
