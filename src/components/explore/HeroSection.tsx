"use client";

import { ArrowRight, Globe } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSpotsStore } from "@/stores/spots-store";
import { useUIStore } from "@/stores/ui-store";
import { SectionHeader } from "@/components/explore/SectionHeader";
import { NearbyCtaButton } from "@/components/explore/NearbyCtaButton";

export function HeroSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const regions = useSpotsStore((s) => s.regions);
  const openSearch = useUIStore((s) => s.openSearch);
  return (
    <section className="relative -mx-4 mb-12 overflow-hidden bg-primary px-4 py-12 md:py-20 md:-mx-8 md:px-8 lg:py-20">
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

      <div className="relative flex flex-col md:flex-row items-stretch justify-between gap-8">
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
              Spots.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-surface/70 sm:text-base">
            A directory for Riders & Athletes. Find plazas, DIYs, and
            Skateparks.
          </p>
        </div>
        <section
          id="browse-regions"
          aria-labelledby="regions-heading"
          className="space-y-6"
        >
          <SectionHeader
            eyebrow="Weather & Forecasts"
            eyebrowIcon={
              <Globe size={14} className="text-surface/80" aria-hidden="true" />
            }
            title="Browse Regions"
            titleId="regions-heading"
            eyebrowClassName="text-surface/80"
            cta={<NearbyCtaButton />}
          />

          <div id="regions-grid" className="gap-3 sm:grid-cols-3 sm:gap-4">
            {regions.map((region) => (
              <div
                key={region.name}
                className="group relative border border-surface/30 bg-transparent"
              >
                <button
                  type="button"
                  aria-label={`Browse ${region.name} spots`}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("searchRegion", region.name);
                    router.replace(`/?${params.toString()}`, {
                      scroll: false,
                    });
                    openSearch();
                  }}
                  className="flex w-full flex-col gap-3 p-5 text-left text-surface transition-colors hover:bg-surface hover:text-primary focus-visible:bg-surface focus-visible:text-primary focus-visible:outline-none sm:gap-4 sm:p-6"
                >
                  <div className="mt-2 flex justify-between gap-1.5 text-[10px] font-bold tracking-widest uppercase group-hover:border-primary/30">
                    <h3 className="font-display text-2xl font-bold leading-[0.95] tracking-tight uppercase sm:text-3xl">
                      {region.name}
                    </h3>

                    <div className="flex items-center justify-end group-hover:border-primary/30 gap-3">
                      <ArrowRight
                        size={12}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                      <span className="font-mono text-[10px] font-bold tracking-widest text-surface/60 uppercase group-hover:text-primary/60">
                        {region.count}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
