'use client';

import { AppStateProvider } from './AppStateProvider';
import { AppShell } from './AppShell';
import type { ReactNode } from 'react';
import type { Spot } from '@/lib/types';

export function AppProviders({
  children,
  initialSpots,
}: {
  children: ReactNode;
  initialSpots: readonly Spot[];
}) {
  return (
    <AppStateProvider initialSpots={initialSpots}>
      <AppShell>{children}</AppShell>
    </AppStateProvider>
  );
}
