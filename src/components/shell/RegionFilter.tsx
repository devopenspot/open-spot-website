"use client";

import { useMemo } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Globe } from "lucide-react";
import { useSpotsStore } from "@/stores/spots-store";
import { cn } from "@/lib/cn";
import type { Region, Spot } from "@/lib/types";

interface RegionFilterProps {
  region: string | null;
  country: string | null;
  availableCountries: readonly string[];
  hasFilter: boolean;
  setRegion: (name: string | null) => void;
  setCountry: (name: string | null) => void;
  clearAll: () => void;
  /**
   * Called after a user-initiated action (region/country/clear). The parent
   * typically uses this to close the surrounding overlay.
   */
  onAfterChange?: () => void;
  /**
   * When provided, the picker runs in deferred mode: region selection stages
   * locally without closing, exposing the country list for the chosen
   * region. Country picks and the "view all" CTA then call this to flush
   * the staged selection to the URL (and the parent also closes via
   * `onAfterChange`).
   */
  onCommit?: () => void;
  /** Full spot list, used to compute per-country counts in the drill-down. */
  allSpots?: readonly Spot[];
}

export function RegionFilter({
  region,
  country,
  availableCountries,
  allSpots = [],
  setRegion,
  setCountry,
  onAfterChange,
  onCommit,
}: RegionFilterProps) {
  const regions = useSpotsStore((s) => s.regions);
  const isPicker = typeof onCommit === "function";

  const countryCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const spot of allSpots) {
      map.set(spot.country, (map.get(spot.country) ?? 0) + 1);
    }
    return map;
  }, [allSpots]);

  const selectedRegion = useMemo(
    () => regions.find((r) => r.name === region) ?? null,
    [regions, region],
  );

  const handleRegionPick = (name: string) => {
    const next = region === name ? null : name;
    setRegion(next);
    if (!isPicker) onAfterChange?.();
  };

  const handleCountryPick = (name: string) => {
    const next = country === name ? null : name;
    setCountry(next);
    onCommit?.();
    onAfterChange?.();
  };

  const handleBack = () => {
    setRegion(null);
  };

  const handleViewAll = () => {
    onCommit?.();
    onAfterChange?.();
  };

  if (region && selectedRegion) {
    return (
      <CountryDrillDown
        region={selectedRegion}
        countries={availableCountries}
        country={country}
        countryCount={countryCount}
        isPicker={isPicker}
        onBack={handleBack}
        onPick={handleCountryPick}
        onViewAll={handleViewAll}
      />
    );
  }

  return (
    <RegionList regions={regions} region={region} onPick={handleRegionPick} />
  );
}

interface RegionListProps {
  regions: readonly Region[];
  region: string | null;
  onPick: (name: string) => void;
}

function RegionList({ regions, region, onPick }: RegionListProps) {
  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between border-b border-outline pb-3">
        <h3 className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-widest uppercase text-secondary">
          <Globe size={12} aria-hidden="true" />
          Browse by region
        </h3>
        <span
          aria-hidden="true"
          className="font-mono text-[9px] font-bold tracking-widest uppercase text-secondary"
        >
          Step 01 / 02
        </span>
      </header>

      <ul role="list" className="space-y-2" aria-label="Available regions">
        {regions.map((r) => {
          const active = region === r.name;
          return (
            <li key={r.name}>
              <button
                type="button"
                onClick={() => onPick(r.name)}
                aria-pressed={active}
                className={cn(
                  "group flex w-full items-stretch border bg-surface text-left transition-colors focus-visible:bg-primary focus-visible:text-surface",
                  active
                    ? "border-primary bg-primary text-surface"
                    : "border-outline hover:bg-primary hover:text-surface",
                )}
              >
                {r.image ? (
                  <span
                    aria-hidden="true"
                    className="relative h-20 w-20 shrink-0 border-r border-outline bg-black overflow-hidden"
                  >
                    <Image
                      src={r.image}
                      alt=""
                      fill
                      sizes="80px"
                      className={cn(
                        "object-cover",
                        active
                          ? "opacity-90"
                          : "opacity-70 group-hover:opacity-90",
                      )}
                      referrerPolicy="no-referrer"
                      unoptimized
                    />
                  </span>
                ) : null}

                <span className="flex flex-1 flex-col justify-center gap-1 p-3 min-w-0">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-display text-sm font-bold tracking-wide uppercase truncate">
                      {r.name}
                    </span>
                    <span className="font-mono text-[9px] font-bold tracking-widest uppercase opacity-70 shrink-0">
                      {r.count}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "text-[11px] leading-snug line-clamp-2",
                      active
                        ? "text-surface/80"
                        : "text-secondary group-hover:text-surface/80",
                    )}
                  >
                    {r.desc}
                  </span>
                </span>

                <span
                  aria-hidden="true"
                  className="flex items-center justify-center px-3 border-l border-outline opacity-60 group-hover:opacity-100 transition-opacity"
                >
                  <ArrowRight size={14} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface CountryDrillDownProps {
  region: Region;
  countries: readonly string[];
  country: string | null;
  countryCount: ReadonlyMap<string, number>;
  isPicker: boolean;
  onBack: () => void;
  onPick: (name: string) => void;
  onViewAll: () => void;
}

function CountryDrillDown({
  region,
  countries,
  country,
  countryCount,
  isPicker,
  onBack,
  onPick,
  onViewAll,
}: CountryDrillDownProps) {
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between border-b border-outline pb-3">
        {isPicker ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 font-mono text-[10px] font-bold tracking-widest uppercase text-secondary hover:text-on-surface focus-visible:text-on-surface"
          >
            <ArrowLeft size={12} aria-hidden="true" />
            All regions
          </button>
        ) : (
          <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-secondary">
            Filter by country
          </span>
        )}
        <span
          aria-hidden="true"
          className="font-mono text-[9px] font-bold tracking-widest uppercase text-secondary"
        >
          Step 02 / 02
        </span>
      </header>

      <div className="space-y-1">
        <h3 className="font-display text-2xl font-bold tracking-wide uppercase text-on-surface">
          {region.name}
        </h3>
        <p className="text-xs text-secondary leading-snug max-w-prose">
          {region.desc}
        </p>
      </div>

      {countries.length > 0 ? (
        <ul
          role="list"
          className="border border-outline divide-y divide-outline-variant"
          aria-label={`Countries in ${region.name}`}
        >
          {countries.map((c) => {
            const active = country === c;
            const count = countryCount.get(c) ?? 0;
            return (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => onPick(c)}
                  aria-pressed={active}
                  className={cn(
                    "group flex w-full items-center justify-between gap-3 p-3 text-left transition-colors focus-visible:bg-primary focus-visible:text-surface",
                    active
                      ? "bg-primary text-surface"
                      : "bg-surface hover:bg-primary hover:text-surface",
                  )}
                >
                  <span className="font-display text-sm font-bold tracking-wide uppercase truncate">
                    {c}
                  </span>
                  <span className="flex items-center gap-3 shrink-0">
                    <span
                      className={cn(
                        "font-mono text-[10px] font-bold tracking-widest uppercase",
                        active
                          ? "text-surface/80"
                          : "text-secondary group-hover:text-surface/80",
                      )}
                    >
                      {count} {count === 1 ? "spot" : "spots"}
                    </span>
                    <ArrowRight
                      size={12}
                      className="opacity-60 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="border border-dashed border-outline-variant p-4 text-center font-mono text-[10px] font-bold tracking-widest uppercase text-secondary">
          No countries in this region yet
        </p>
      )}

      {isPicker && (
        <button
          type="button"
          onClick={onViewAll}
          className="group flex w-full items-center justify-between gap-3 border border-outline bg-surface p-3 text-left transition-colors hover:bg-primary hover:text-surface focus-visible:bg-primary focus-visible:text-surface"
        >
          <span className="font-display text-sm font-bold tracking-wide uppercase">
            View all {region.name} spots
          </span>
          <ArrowRight
            size={14}
            className="opacity-60 group-hover:opacity-100"
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}
