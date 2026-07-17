"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Award } from "lucide-react";
import { ROUTES } from "@/lib/nav";
import { useSpotsStore } from "@/stores/spots-store";
import { useSavedSpots } from "@/hooks/useSavedSpots";
import { useUser } from "@/hooks/useUser";
import { ExploreSpotCard } from "@/components/spot/SpotCard";
import { SectionHeader } from "./SectionHeader";
import { EventCard } from "@/components/sport-events/EventCard";
import { EventFeaturedHero } from "@/components/sport-events/EventFeaturedHero";
import type { Spot } from "@/lib/types";
import type { SportEventEnriched } from "@/types/sport-events";

const SHELF_LIMIT = 4;

interface ExploreTabProps {
  events: readonly SportEventEnriched[];
  featured?: SportEventEnriched;
}

export default function ExploreTab({ events, featured }: ExploreTabProps) {
  const router = useRouter();
  const spots = useSpotsStore((s) => s.spots);
  const user = useUser();
  const { savedIds, toggle: toggleSaved } = useSavedSpots(user.id);

  const spotlightSpots = useMemo(() => spots.slice(0, 6), [spots]);
  const shelfEvents = useMemo(() => {
    const pool = featured
      ? events.filter((event) => event.id !== featured.id)
      : events;
    return pool.slice(0, SHELF_LIMIT);
  }, [events, featured]);

  const openSpot = useCallback(
    (spot: Spot) => router.push(ROUTES.spot(spot.id)),
    [router],
  );
  const openEvents = useCallback(() => router.push(ROUTES.events), [router]);

  return (
    <section
      id="explore-tab"
      role="tabpanel"
      aria-labelledby="nav-btn-explore"
      className="animate-fade-in space-y-12"
    >
      <h1 className="visually-hidden">Explore Open Spot</h1>

      <section
        id="sport-events"
        aria-label="Sport Events"
        aria-labelledby="legendary-heading"
        className="md:space-y-12 md:-mx-8"
      >
        <SectionHeader
          eyebrow="Hall of Fame"
          eyebrowIcon={
            <Award size={14} className="text-primary" aria-hidden="true" />
          }
          title="Events"
          titleId="legendary-heading"
          description="The official circuit that defines the season — world tours, championships, and festivals."
          cta={
            <button
              id="view-all-events-link"
              type="button"
              onClick={openEvents}
              className="group flex items-center space-x-1 text-xs font-semibold tracking-wider text-primary uppercase hover:underline"
            >
              <span>View all events</span>
              <ChevronRight
                size={14}
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-0.5"
              />
            </button>
          }
        />

        {featured ? <EventFeaturedHero event={featured} /> : null}

        {shelfEvents.length > 0 ? (
          <div
            id="legendary-shelf"
            className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth snap-x"
          >
            {shelfEvents.map((event, idx) => (
              <div
                key={event.id}
                className="min-w-[260px] sm:min-w-[300px] lg:min-w-[320px] flex-shrink-0 snap-start"
              >
                <EventCard event={event} priority={idx === 0} />
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section
        id="spotlight-spots"
        aria-labelledby="spotlight-heading"
        className="md:space-y-12 md:-mx-8"
      >
        <SectionHeader
          eyebrow="Fresh"
          title="Spotlight Spots"
          titleId="spotlight-heading"
        />
        <div
          id="spotlight-grid"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {spotlightSpots.map((spot) => (
            <ExploreSpotCard
              key={spot.id}
              spot={spot}
              isSaved={savedIds.has(spot.id)}
              onOpen={openSpot}
              onToggleSave={toggleSaved}
            />
          ))}
        </div>
      </section>
    </section>
  );
}
