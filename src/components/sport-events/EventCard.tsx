import Image from "next/image";
import { MapPin, ExternalLink, Calendar } from "lucide-react";
import type {
  SportEventEnriched,
  SportEventStatus,
} from "@/types/sport-events";
import { cn } from "@/lib/cn";

interface EventCardProps {
  event: SportEventEnriched;
  priority?: boolean;
}

const STATUS_DOT_STYLES: Record<SportEventStatus, string> = {
  live: "bg-error animate-pulse-dot",
  upcoming: "bg-primary",
  completed: "bg-outline",
};

const STATUS_TEXT_STYLES: Record<SportEventStatus, string> = {
  live: "text-error",
  upcoming: "text-on-surface",
  completed: "text-secondary",
};

function TierBadge({ tierName }: { tierName: string }) {
  return (
    <span
      aria-hidden="true"
      className="rounded-none-none border border-outline bg-surface/95 px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest text-on-surface uppercase backdrop-blur-sm"
    >
      {tierName}
    </span>
  );
}

const STATUS_LABEL: Record<SportEventStatus, string> = {
  live: "Live",
  upcoming: "Upcoming",
  completed: "Completed",
};

export function EventCard({ event, priority = false }: EventCardProps) {
  const { location } = event;
  const isCompleted = event.status === "completed";
  const statusLabel = STATUS_LABEL[event.status];
  const showStatus = event.status !== "upcoming";

  return (
    <article
      data-event-card={event.id}
      data-event-status={event.status}
      className="group relative flex w-full flex-col border border-outline-variant bg-surface-bright text-left transition-colors hover:border-on-surface focus-within:border-on-surface"
    >
      <div className="relative h-52 w-full overflow-hidden bg-black">
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${event.name} official site in a new tab`}
          className="absolute inset-0 z-0 block cursor-pointer"
        >
          <span className="visually-hidden">
            Open {event.name} official site
          </span>
          <Image
            src={event.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={cn(
              "object-cover transition-transform duration-500 ease-out group-hover:scale-105 pointer-events-none",
              isCompleted && "opacity-60",
            )}
            referrerPolicy="no-referrer"
            unoptimized
            priority={priority}
          />
        </a>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
          aria-hidden="true"
        />

        <div className="absolute top-3 left-3 z-10">
          <TierBadge tierName={event.tierName} />
        </div>

        {event.status === "live" && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-surface/95 px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest text-error uppercase backdrop-blur-sm">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-none-none bg-error animate-pulse-dot"
            />
            Live
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 mb-2">
          <span
            aria-hidden="true"
            className={cn(
              "h-1.5 w-1.5 rounded-none-none",
              STATUS_DOT_STYLES[event.status],
            )}
          />
          <span
            className={cn(
              "font-mono text-[10px] font-bold tracking-widest uppercase",
              STATUS_TEXT_STYLES[event.status],
            )}
          >
            {showStatus ? statusLabel : event.dateRangeLabel}
          </span>
        </div>

        <h3 className="font-display text-lg font-bold tracking-wide text-on-surface uppercase group-hover:underline">
          {event.name}
        </h3>

        {event.shortName && (
          <span className="mt-1 block font-mono text-[10px] tracking-widest text-secondary uppercase">
            {event.shortName}
          </span>
        )}

        <p className="mt-3 text-xs text-secondary leading-relaxed line-clamp-3">
          {event.description}
        </p>

        <dl className="mt-4 space-y-1.5 border-t border-outline-variant pt-3 text-[11px]">
          <div className="flex items-start gap-2 text-on-surface">
            <Calendar
              size={12}
              className="mt-0.5 shrink-0 text-secondary"
              aria-hidden="true"
            />
            <dt className="visually-hidden">Date</dt>
            <dd className="font-mono tracking-wider font-semibold uppercase">
              {event.dateRangeLabel}
            </dd>
          </div>
          <div className="flex items-start gap-2 text-on-surface">
            <MapPin
              size={12}
              className="mt-0.5 shrink-0 text-secondary"
              aria-hidden="true"
            />
            <dt className="visually-hidden">Location</dt>
            <dd className="text-secondary">
              <span className="text-on-surface font-semibold">
                {location.city}
              </span>
              {location.country ? `, ${location.country}` : ""}
              {location.venue && (
                <span className="block text-[10px] tracking-wider uppercase mt-0.5">
                  {location.venue}
                </span>
              )}
            </dd>
          </div>
        </dl>

        {event.sports.length > 0 && (
          <ul aria-label="Disciplines" className="mt-4 flex flex-wrap gap-1.5">
            {event.sports.map((sport) => (
              <li
                key={sport}
                className="border border-outline-variant bg-surface-container-low px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest text-on-surface uppercase"
              >
                {sport}
              </li>
            ))}
          </ul>
        )}

        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ${event.name} official site in a new tab`}
          className="mt-5 inline-flex items-center justify-between gap-2 border-t border-outline-variant pt-3 font-display text-xs font-bold tracking-widest text-on-surface uppercase hover:underline"
        >
          <span>Visit official site</span>
          <ExternalLink
            size={12}
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5"
          />
        </a>
      </div>
    </article>
  );
}
