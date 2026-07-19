"use client";

import { useId } from "react";
import { SpotDetailsContent } from "./SpotDetailsContent";
import { SuggestedSpots } from "./SuggestedSpots";
import { useWeather } from "@/components/shell/WeatherContext";
import { useSavedSpots } from "@/hooks/useSavedSpots";
import { useUser } from "@/hooks/useUser";
import type { Spot } from "@/lib/types";

export function SpotDetailsFullPage({ spot }: { spot: Spot }) {
  const titleId = useId();
  const user = useUser();
  const { isSaved, toggle: toggleSaved } = useSavedSpots(user?.id ?? null);
  const { getWeather } = useWeather();

  return (
    <div className="max-w-5xl mx-auto md:py-8 animate-fade-in">
      <article aria-labelledby={titleId}>
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
      <SuggestedSpots spot={spot} />
    </div>
  );
}
