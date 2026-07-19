"use client";

import { memo } from "react";
import { Search } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { BrandLogo } from "@/components/main/BrandLogo";
import { MobileDrawerTrigger } from "@/components/layout/MobileDrawerTrigger";
import { NearbyControl } from "./NearbyControl";

function MapHeaderBarBase() {
  const openSearch = useUIStore((s) => s.openSearch);
  return (
    <div
      id="map-header-bar"
      className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex items-start justify-between gap-2 p-4"
    >
      <div className="pointer-events-auto flex items-center gap-2">
        <BrandLogo size="sm" />
        <MobileDrawerTrigger />
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        <button
          id="map-search-btn"
          type="button"
          onClick={openSearch}
          aria-label="Search spots (⌘K)"
          title="Search spots (⌘K)"
          className="flex h-8 w-8 items-center justify-center border border-outline-variant bg-surface/90 text-on-surface backdrop-blur-md transition-colors hover:border-primary hover:text-primary focus-visible:border-primary focus-visible:text-primary"
        >
          <Search size={14} aria-hidden="true" />
        </button>
        <NearbyControl />
      </div>
    </div>
  );
}

export const MapHeaderBar = memo(MapHeaderBarBase);
