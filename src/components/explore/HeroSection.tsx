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
  const openSearch = useUIStore((s) => s.tryOpenSearch);
  return (
    <section className="relative bg-primary p-4 md:px-8 w-full">
      <div className="relative flex flex-col md:flex-row items-center justify-start gap-8">
        <div className="w-full">
          <h1 className="font-display text-4xl font-bold leading-[0.92] tracking-tight text-surface uppercase sm:text-7xl md:text-8xl lg:text-9xl">
            directory for Riders
            <br />
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-surface/70 sm:text-base">
            Discover Plazas, DIYs, Bowls, Skateparks and Events.
          </p>
        </div>
        <section
          id="browse-regions"
          aria-labelledby="regions-heading"
          className="space-y-6"
        >
          <SectionHeader
            eyebrow="Weather & Forecast"
            className="-ml-4 md:ml-0"
            eyebrowIcon={
              <Globe
                size={14}
                className="text-surface/80 animate-pulse-dot"
                aria-hidden="true"
              />
            }
            title="Browse Regions"
            titleId="regions-heading"
            eyebrowClassName="text-surface/80"
            cta={<NearbyCtaButton />}
          />

          <div
            id="regions-grid"
            role="list"
            aria-label="Available regions"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
          >
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
                  className="flex w-full flex-col gap-1.5 p-3 text-left text-surface transition-colors hover:bg-surface hover:text-primary focus-visible:bg-surface focus-visible:text-primary focus-visible:outline-none sm:gap-2 sm:p-4"
                >
                  <div className="mt-2 flex justify-between gap-1.5 text-[10px] font-bold tracking-widest uppercase group-hover:border-primary/30">
                    <h3 className="font-display text-lg font-bold leading-[0.95] tracking-tight uppercase sm:text-xl">
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
