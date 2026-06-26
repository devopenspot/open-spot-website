'use client';

import { useId } from 'react';
import { SpotDetailsContent } from './SpotDetailsContent';
import { useAppState } from '@/components/layout/AppStateProvider';
import type { Spot } from '@/lib/types';

export function SpotDetailsFullPage({ spot }: { spot: Spot }) {
  const titleId = useId();
  const { isSaved, toggleSaved } = useAppState();

  return (
    <article
      aria-labelledby={titleId}
      className="max-w-5xl mx-auto pb-24 animate-fade-in"
    >
      <header className="sr-only">
        <h1 id={titleId}>{spot.name}</h1>
      </header>
      <SpotDetailsContent
        spot={spot}
        isSaved={isSaved(spot.id)}
        onToggleSave={toggleSaved}
        variant="page"
      />
    </article>
  );
}
