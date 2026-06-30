import Image from 'next/image';
import { MapPin, Calendar, ExternalLink, Trophy } from 'lucide-react';
import type { SportEventEnriched } from '@/types/sport-events';
import { TIER_DISPLAY, STATUS_LABELS } from '@/lib/sport-events';
import { cn } from '@/lib/cn';

interface EventFeaturedHeroProps {
  event: SportEventEnriched;
}

export function EventFeaturedHero({ event }: EventFeaturedHeroProps) {
  const { location } = event;
  const isLive = event.status === 'live';
  const isCompleted = event.status === 'completed';

  return (
    <article
      id="featured-event"
      data-event-id={event.id}
      className="group relative w-full overflow-hidden border border-outline bg-black"
    >
      <div className="relative h-[420px] w-full sm:h-[480px] md:h-[560px]">
        <Image
          src={event.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 1200px, 100vw"
          className={cn(
            'object-cover grayscale transition-opacity duration-500',
            isCompleted && 'opacity-50',
          )}
          referrerPolicy="no-referrer"
          unoptimized
          priority
        />

        <div
          className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/30"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"
          aria-hidden="true"
        />

        <div
          className="absolute inset-0 flex flex-col justify-between p-6 text-surface sm:p-10 md:p-14"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-widest text-surface/80 uppercase">
                <Trophy size={12} aria-hidden="true" className="text-surface" />
                <span>Featured Event</span>
              </div>
              <span
                className="self-start border border-surface/70 bg-transparent px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest text-surface uppercase backdrop-blur-sm"
              >
                {TIER_DISPLAY[event.tier]}
              </span>
            </div>

            {isLive && (
              <div className="flex items-center gap-2 self-start border border-error bg-error/15 px-3 py-1 font-mono text-[10px] font-bold tracking-widest text-error uppercase backdrop-blur-sm">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-error animate-pulse-dot"
                />
                <span>Live · {STATUS_LABELS.live}</span>
              </div>
            )}
          </div>

          <div className="max-w-3xl space-y-5">
            <h2 className="font-display text-4xl font-bold leading-[0.95] tracking-tight text-surface uppercase sm:text-5xl md:text-6xl">
              {event.name}
            </h2>

            <p className="max-w-2xl text-sm leading-relaxed text-surface/85 sm:text-base">
              {event.description}
            </p>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8">
              <div className="flex items-center gap-3 border-t border-surface/30 pt-3">
                <Calendar
                  size={16}
                  className="shrink-0 text-surface"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <dt className="font-mono text-[9px] font-bold tracking-widest text-surface/60 uppercase">
                    Date
                  </dt>
                  <dd className="font-display text-sm font-bold tracking-wide text-surface uppercase sm:text-base">
                    {event.dateRangeLabel}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3 border-t border-surface/30 pt-3">
                <MapPin
                  size={16}
                  className="shrink-0 text-surface"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <dt className="font-mono text-[9px] font-bold tracking-widest text-surface/60 uppercase">
                    Location
                  </dt>
                  <dd className="font-display text-sm font-bold tracking-wide text-surface uppercase sm:text-base truncate">
                    {location.city}
                    {location.country ? `, ${location.country}` : ''}
                    {location.venue && (
                      <span className="block font-mono text-[10px] font-normal tracking-wider text-surface/70 normal-case">
                        {location.venue}
                      </span>
                    )}
                  </dd>
                </div>
              </div>
            </dl>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${event.name} official site in a new tab`}
                className="inline-flex items-center gap-2 bg-surface px-6 py-3 font-display text-xs font-bold tracking-widest text-on-surface uppercase hover:bg-surface/90 transition-colors"
              >
                <span>Visit official site</span>
                <ExternalLink
                  size={14}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </a>

              {event.sports.length > 0 && (
                <ul
                  aria-label="Disciplines"
                  className="flex flex-wrap gap-1.5"
                >
                  {event.sports.map(sport => (
                    <li
                      key={sport}
                      className="border border-surface/40 bg-transparent px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest text-surface uppercase backdrop-blur-sm"
                    >
                      {sport}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

