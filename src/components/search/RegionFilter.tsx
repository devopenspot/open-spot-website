"use client";

import { useRouter } from "next/navigation";
import { Filter } from "lucide-react";
import { getRegions } from "@/lib/spots";
import { useUIStore } from "@/stores/ui-store";
import type { MapFilter } from "@/hooks/useMapFilter";

const regions = getRegions();

export function RegionFilter({
  region,
  country,
  availableCountries,
  setRegion,
  setCountry,
}: MapFilter) {
  const router = useRouter();
  const closeSearch = useUIStore((s) => s.closeSearch);
  return (
    <div className="space-y-3">
      <h3 className="font-display text-base font-bold uppercase tracking-wider text-on-surface flex items-center">
        <Filter
          size={14}
          className="mr-1.5 text-secondary"
          aria-hidden="true"
        />
        Filter by region
      </h3>

      <div
        role="group"
        aria-label="Filter spots by region"
        className="flex flex-wrap gap-1.5 no-scrollbar"
      >
        {regions.map((r) => (
          <FilterPill
            key={r.name}
            label={r.name}
            active={region === r.name}
            onClick={() => setRegion(region === r.name ? null : r.name)}
          />
        ))}
      </div>

      {region && availableCountries.length > 0 && (
        <div
          role="group"
          aria-label="Filter spots by country"
          className="flex flex-wrap gap-1.5 no-scrollbar"
        >
          {availableCountries.map((c) => (
            <FilterPill
              key={c}
              label={c}
              active={country === c}
              onClick={() => {
                const willSelect = country !== c;
                setCountry(willSelect ? c : null);
                if (willSelect) {
                  closeSearch();
                  router.push("/map");
                }
              }}
              muted
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
  muted?: boolean;
}

function FilterPill({ label, active, onClick, muted }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1 text-[10px] font-medium tracking-wide transition-all border ${
        active
          ? "bg-primary text-surface border-primary"
          : muted
            ? "bg-surface-container-low border-outline-variant/60 text-secondary hover:text-on-surface hover:border-outline"
            : "bg-surface border-outline-variant text-secondary hover:text-on-surface hover:border-outline"
      }`}
    >
      {label.toUpperCase()}
    </button>
  );
}
