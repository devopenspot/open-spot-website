"use client";

import { useRouter } from "next/navigation";
import { Compass, Heart } from "lucide-react";
import { useSpotsStore } from "@/stores/spots-store";
import { useSavedSpots } from "@/hooks/useSavedSpots";
import { useUser } from "@/hooks/useUser";
import { ROUTES } from "@/lib/nav";
import { SavedSpotCard } from "@/components/spot/SpotCard";
import Header from "@/components/saved/Header";

export default function SavedTab() {
  const router = useRouter();
  const user = useUser();
  const spots = useSpotsStore((s) => s.spots);
  const { savedIds, toggle: toggleSaved } = useSavedSpots(user?.id ?? null);
  const savedSpots = spots.filter((s) => savedIds.has(s.id));

  const openSpot = (spot: { id: string }) => router.push(ROUTES.spot(spot.id));

  return (
    <section
      id="saved-tab"
      role="tabpanel"
      aria-labelledby="nav-btn-saved"
      className="space-y-8 py-8 animate-fade-in"
    >
      <Header />

      {savedSpots.length === 0 ? (
        <div
          id="saved-empty-state"
          className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-none-none border border-dashed border-outline-variant bg-surface-container-low max-w-md mx-auto mt-6"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-none-none bg-surface-container-high border border-outline-variant text-secondary mb-4">
            <Heart size={20} className="text-secondary" aria-hidden="true" />
          </div>
          <h3 className="font-display text-base font-bold uppercase tracking-wider text-on-surface">
            No registered spots
          </h3>
          <p className="mt-2 text-xs text-secondary leading-relaxed">
            Sift through our curated directory, tap the heart emblem, and
            compile your local blueprint for rapid reference.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 inline-flex items-center space-x-2 rounded-none-none bg-on-surface text-surface px-5 py-2 text-xs font-bold tracking-widest uppercase hover:bg-on-surface/90 transition-all"
          >
            <Compass size={14} aria-hidden="true" />
            <span>Explore archive</span>
          </button>
        </div>
      ) : (
        <div
          id="saved-spots-grid"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {savedSpots.map((spot) => (
            <SavedSpotCard
              key={spot.id}
              spot={spot}
              isSaved={true}
              onOpen={openSpot}
              onToggleSave={toggleSaved}
            />
          ))}
        </div>
      )}
    </section>
  );
}
