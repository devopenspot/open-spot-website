import { Compass } from "lucide-react";
import { ROUTES } from "@/lib/nav";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative -mx-4 mb-12 overflow-hidden bg-primary px-4 py-20 md:-mx-8 md:px-8 md:py-28 lg:py-36">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        aria-hidden="true"
      >
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px w-8 bg-surface/50" aria-hidden="true" />
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-surface/60 uppercase">
              Open Spot
            </span>
          </div>

          <h1 className="font-display text-5xl font-bold leading-[0.92] tracking-tight text-surface uppercase sm:text-7xl md:text-8xl lg:text-9xl">
            Discover
            <br />
            <span className="inline-block border-t-2 border-surface/30 pt-2 mt-1">
              Map. Ride.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-sm leading-relaxed text-surface/70 sm:text-base">
            A high-contrast directory for Riders & Athletes. Find plazas, DIYs,
            bowls, ledges, and pools. Save your spots.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Link
              href={ROUTES.explore}
              className="inline-flex items-center gap-2 border-2 border-surface px-6 py-3 font-display text-xs font-bold tracking-widest text-surface uppercase transition-colors hover:bg-surface hover:text-primary"
            >
              <Compass size={14} aria-hidden="true" />
              <span>Explore spots</span>
            </Link>

            <Link
              href={ROUTES.events}
              className="inline-flex items-center gap-1.5 font-display text-xs font-bold tracking-widest text-surface/80 uppercase underline underline-offset-4 transition-colors hover:text-surface"
            >
              <span>View events</span>
              <span aria-hidden="true" className="inline-block ml-0.5">
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
