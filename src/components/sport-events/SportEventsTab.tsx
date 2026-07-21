import { Trophy } from "lucide-react";
import { EventCard } from "./EventCard";
import { EventFeaturedHero } from "./EventFeaturedHero";
import type { SportEventEnriched } from "@/types/sport-events";
import { cn } from "@/lib/cn";

interface SportEventsTabProps {
  featured: SportEventEnriched | undefined;
  events: readonly SportEventEnriched[];
}

export function SportEventsTab({ featured, events }: SportEventsTabProps) {
  const gridEvents = featured
    ? events.filter((event) => event.id !== featured.id)
    : events;

  const counts = events.reduce(
    (acc, event) => {
      acc[event.status] += 1;
      return acc;
    },
    { live: 0, upcoming: 0, completed: 0 },
  );

  const featuredEventForGrid = featured ?? gridEvents[0];
  const gridList = featured ? gridEvents : gridEvents.slice(1);

  return (
    <section
      id="sport-events-tab"
      role="tabpanel"
      aria-labelledby="nav-btn-events"
      className="space-y-12 py-8 animate-fade-in"
    >
      <h1 className="visually-hidden">Sport Events</h1>

      <header className="sticky top-0 z-40 w-full border-b border-outline-variant bg-surface p-4">
        <div className="flex items-center gap-2 mb-2 font-mono text-[10px] font-bold tracking-widest text-secondary uppercase">
          <Trophy size={12} className="text-primary" aria-hidden="true" />
          <span>Action Sports Calendar</span>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-bold tracking-tight text-on-surface uppercase sm:text-3xl">
              Sport Events
            </h2>
            <p className="mt-2 max-w-2xl text-xs text-secondary leading-relaxed sm:text-sm">
              The circuit that defines the season. World tours, federations, and
              festivals — the official stages where action sports happen. Tap
              any card to open the organizer's site.
            </p>
          </div>

          <dl
            aria-label="Event status summary"
            className="grid grid-cols-3 gap-0 self-start border border-outline-variant sm:self-end"
          >
            <StatusStat label="Live" value={counts.live} dotClass="bg-error" />
            <StatusStat
              label="Upcoming"
              value={counts.upcoming}
              dotClass="bg-primary"
              separator
            />
            <StatusStat
              label="Past"
              value={counts.completed}
              dotClass="bg-outline"
              separator
            />
          </dl>
        </div>
      </header>

      {featuredEventForGrid && (
        <section
          id="featured-event-section"
          aria-labelledby="featured-event-heading"
          className="space-y-4"
        >
          <div className="flex items-end justify-between gap-4 px-4">
            <div>
              <h3
                id="featured-event-heading"
                className="font-display text-lg font-bold tracking-wide text-on-surface uppercase sm:text-xl"
              >
                Featured
              </h3>
              <p className="mt-1 font-mono text-[10px] font-bold tracking-widest text-secondary uppercase">
                Editor's pick
              </p>
            </div>
          </div>
          <EventFeaturedHero event={featuredEventForGrid} />
        </section>
      )}

      <section
        id="events-grid-section"
        aria-labelledby="events-grid-heading"
        className="space-y-4"
      >
        <div className="flex items-end justify-between gap-4 px-4 md:px-0">
          <div>
            <h3
              id="events-grid-heading"
              className="font-display text-lg font-bold tracking-wide text-on-surface uppercase sm:text-xl"
            >
              All Events
            </h3>
            <p className="mt-1 font-mono text-[10px] font-bold tracking-widest text-secondary uppercase">
              {gridList.length} on the circuit
            </p>
          </div>
        </div>

        {gridList.length === 0 ? (
          <div
            id="events-empty-state"
            className="flex flex-col items-center justify-center border border-dashed border-outline-variant bg-surface-container-low px-4 py-16 text-center max-w-md mx-auto"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center border border-outline-variant bg-surface-container-high text-secondary">
              <Trophy size={20} aria-hidden="true" />
            </div>
            <h4 className="font-display text-base font-bold uppercase tracking-wider text-on-surface">
              No events on the horizon
            </h4>
            <p className="mt-2 text-xs text-secondary leading-relaxed">
              The calendar is quiet for now. Check back as the next qualifier
              window opens.
            </p>
          </div>
        ) : (
          <div
            id="events-grid"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {gridList.map((event, idx) => (
              <EventCard key={event.id} event={event} priority={idx === 0} />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-outline-variant pt-6 text-center">
        <p className="font-mono text-[10px] font-bold tracking-widest text-secondary uppercase">
          All dates are subject to change. Tap a card to verify on the official
          site.
        </p>
        <p className="mt-1.5 text-[10px] text-secondary">
          Looking for a missing event?{" "}
          <a
            href="https://www.worldskate.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-display font-bold tracking-widest uppercase underline underline-offset-2 hover:text-on-surface"
          >
            Browse the federations
          </a>
        </p>
      </footer>
    </section>
  );
}

interface StatusStatProps {
  label: string;
  value: number;
  dotClass: string;
  separator?: boolean;
}

function StatusStat({ label, value, dotClass, separator }: StatusStatProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-1.5 px-4 py-3 min-w-[90px]",
        separator && "border-l border-outline-variant",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span aria-hidden="true" className={cn("h-1.5 w-1.5", dotClass)} />
        <dt className="font-mono text-[9px] font-bold tracking-widest text-secondary uppercase">
          {label}
        </dt>
      </div>
      <dd className="font-display text-xl font-bold tracking-tight text-on-surface">
        {value.toString().padStart(2, "0")}
      </dd>
    </div>
  );
}
