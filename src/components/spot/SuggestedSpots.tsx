"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ExploreSpotCard } from "./SpotCard";
import { SectionHeader } from "@/components/explore/SectionHeader";
import { useSpotsStore } from "@/stores/spots-store";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useUser } from "@/hooks/useUser";
import { useSavedSpots } from "@/hooks/useSavedSpots";
import { ROUTES } from "@/lib/nav";
import { buildSuggestedSpots, SUGGESTED_SPOTS_MIN } from "@/lib/spots/suggestions";
import type { Spot } from "@/lib/types";

interface SuggestedSpotsProps {
  spot: Spot;
}

export function SuggestedSpots({ spot }: SuggestedSpotsProps) {
  const all = useSpotsStore((s) => s.spots);
  const regions = useSpotsStore((s) => s.regions);
  const user = useUser();
  const { location } = useUserLocation();
  const { isSaved, toggle } = useSavedSpots(user?.id ?? null);
  const router = useRouter();

  const result = useMemo(
    () => buildSuggestedSpots({ current: spot, all, regions, origin: location }),
    [spot, all, regions, location],
  );

  const open = useCallback(
    (s: Spot) => router.push(ROUTES.spot(s.id)),
    [router],
  );

  if (result.spots.length < SUGGESTED_SPOTS_MIN) return null;

  return (
    <section
      id="suggested-spots"
      aria-labelledby="suggested-heading"
      className="mt-12 md:mt-16 border-t border-outline-variant pt-8"
    >
      <SectionHeader
        eyebrow="More to ride"
        title="Suggested Spots"
        titleId="suggested-heading"
        description={result.scopeLabel}
        className="pl-4 md:pl-0"
      />
      <div
        role="region"
        aria-label={result.scopeLabel}
        className="hidden md:flex md:gap-4 md:overflow-x-auto md:pb-2 md:no-scrollbar md:scroll-smooth md:snap-x px-4 md:px-0"
      >
        {result.spots.map((s) => (
          <div
            key={s.id}
            className="md:min-w-[300px] lg:min-w-[320px] md:flex-shrink-0 md:snap-start"
          >
            <ExploreSpotCard
              spot={s}
              isSaved={isSaved(s.id)}
              onOpen={open}
              onToggleSave={toggle}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 px-4 md:hidden">
        {result.spots.map((s) => (
          <ExploreSpotCard
            key={s.id}
            spot={s}
            isSaved={isSaved(s.id)}
            onOpen={open}
            onToggleSave={toggle}
          />
        ))}
      </div>
    </section>
  );
}
