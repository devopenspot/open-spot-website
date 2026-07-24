"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Map } from "lucide-react";
import { ROUTES } from "@/lib/nav";
import { useSpotsStore } from "@/stores/spots-store";
import { useSavedSpots } from "@/hooks/useSavedSpots";
import { useUser } from "@/hooks/useUser";
import { useUIStore } from "@/stores/ui-store";

export default function SavedTab() {
  const router = useRouter();
  const tryRun = useUIStore((s) => s.tryRun);

  const spots = useSpotsStore((s) => s.spots);
  const user = useUser();
  const { savedIds } = useSavedSpots(user?.id ?? null);
  const savedSpots = spots.filter((s) => savedIds.has(s.id));

  const handleViewOnMap = useCallback(
    () => tryRun(() => router.push(`${ROUTES.map}?saved=1`)),
    [router, tryRun],
  );
  return (
    <header className="sticky flex top-0 z-40 w-full border-b border-outline-variant bg-surface p-4">
      <div className="min-w-0 flex-1">
        <span className="font-mono text-[10px] font-bold tracking-widest text-secondary uppercase block mb-1">
          Favorites Spots
        </span>
        <h1 className="font-display text-2xl font-bold tracking-tight text-on-surface uppercase sm:text-3xl">
          Saved Locations
        </h1>
        <p className="mt-1.5 text-xs text-secondary leading-relaxed max-w-xl">
          Your bookmarked street spots, parks, and DIY terrain. Active weather
          and crowd logs kept live.
        </p>
      </div>
      {savedSpots.length > 0 && (
        <button
          id="view-saved-on-map-link"
          type="button"
          onClick={handleViewOnMap}
          aria-label="View saved spots on the map"
          className="inline-flex shrink-0 items-center space-x-2 self-start rounded-none-none bg-on-surface text-surface px-5 py-2 text-xs font-bold tracking-widest uppercase hover:bg-on-surface/90 transition-all md:self-end"
        >
          <Map size={14} aria-hidden="true" />
          <span>View on map</span>
        </button>
      )}
    </header>
  );
}
