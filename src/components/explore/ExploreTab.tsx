"use client";

import { useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronRight, Award, Globe } from "lucide-react";
import { getRegions } from "@/lib/spots";
import { ROUTES } from "@/lib/nav";
import { useAppState } from "@/components/layout/AppStateProvider";
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
  const { spots, savedIds, toggleSaved } = useAppState();
  const regions = useMemo(() => getRegions(), []);

  const spotlightSpots = useMemo(() => spots.slice(0, 6), [spots]);
  const shelfEvents = useMemo(() => {
    const pool = featured
      ? events.filter((event) => event.id !== featured.id)
      : events;
    return pool.slice(0, SHELF_LIMIT);
  }, [events, featured]);

  const openSpot = useCallback(
    (spot: Spot) => router.push(`/spots/${spot.id}`),
    [router],
  );
  const openEvents = useCallback(() => router.push(ROUTES.events), [router]);

  return (
    <section
      id="explore-tab"
      role="tabpanel"
      aria-labelledby="nav-btn-explore"
      className="space-y-12 pb-24 animate-fade-in"
    >
      <h1 className="visually-hidden">Explore Open Spot</h1>

      <section id="browse-regions" aria-labelledby="regions-heading">
        <SectionHeader
          eyebrow="Global Perspectives"
          eyebrowIcon={
            <Globe size={14} className="text-primary" aria-hidden="true" />
          }
          title="Browse Regions"
          titleId="regions-heading"
        />

        <div
          id="regions-grid"
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {regions.map((region) => (
            <div
              key={region.name}
              className="group relative h-48 overflow-hidden rounded-xl bg-black border border-outline-variant shadow-sm"
            >
              <a href={region.link} rel="noopener noreferrer">
                <Image
                  src={region.image}
                  alt={region.name}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover opacity-60 grayscale transition-transform duration-700 ease-out group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  unoptimized
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"
                  aria-hidden="true"
                />

                <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
                  <span className="self-end rounded-full bg-white/20 px-2.5 py-0.5 text-[9px] font-mono tracking-widest uppercase backdrop-blur-sm">
                    {region.count}
                  </span>

                  <div>
                    <h3 className="font-display text-lg font-bold tracking-wide uppercase sm:text-xl">
                      {region.name}
                    </h3>
                    <p className="mt-1 text-[10px] text-slate-300 leading-normal line-clamp-2">
                      {region.desc}
                    </p>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </section>

      <section
        id="sport-events"
        aria-label="Sport Events"
        aria-labelledby="legendary-heading"
        className="space-y-6"
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

      <section id="spotlight-spots" aria-labelledby="spotlight-heading">
        <SectionHeader
          eyebrow="Curated Archive"
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
