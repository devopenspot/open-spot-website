'use client';

import { useId } from 'react';
import { SpotDetailsContent } from './SpotDetailsContent';
import { useWeather } from '@/components/layout/WeatherContext';
import { useSavedSpots } from '@/hooks/useSavedSpots';
import { useUser } from '@/hooks/useUser';
import type { Spot } from '@/lib/types';

export function SpotDetailsFullPage({ spot }: { spot: Spot }) {
  const titleId = useId();
  const user = useUser();
  const { isSaved, toggle: toggleSaved } = useSavedSpots(user.id);
  const { getWeather } = useWeather();

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
        weather={getWeather(spot.id)}
      />
    </article>
  );
}
