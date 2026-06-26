import { Heart, Compass } from 'lucide-react';
import { Spot } from '../types';
import { SpotCard } from './SpotCard';

interface SavedTabProps {
  spots: Spot[];
  savedSpotIds: Set<string>;
  onSelectSpot: (spot: Spot) => void;
  onToggleSave: (id: string) => void;
  onNavigateToExplore: () => void;
}

export default function SavedTab({
  spots,
  savedSpotIds,
  onSelectSpot,
  onToggleSave,
  onNavigateToExplore,
}: SavedTabProps) {
  const savedSpots = spots.filter(s => savedSpotIds.has(s.id));

  return (
    <section
      id="saved-tab"
      role="tabpanel"
      aria-labelledby="nav-btn-saved"
      className="space-y-8 pb-24 animate-fade-in"
    >
      <header className="border-b border-outline-variant pb-5">
        <span className="font-mono text-[10px] font-bold tracking-widest text-secondary uppercase block mb-1">
          Personal Matrix
        </span>
        <h2 className="font-display text-2xl font-bold tracking-tight text-on-surface uppercase sm:text-3xl">
          Saved Locations
        </h2>
        <p className="mt-1.5 text-xs text-secondary leading-relaxed max-w-xl">
          Your bookmarked street spots, parks, and DIY terrain. Active weather and crowd logs kept live.
        </p>
      </header>

      {savedSpots.length === 0 ? (
        <div
          id="saved-empty-state"
          className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low max-w-md mx-auto mt-6"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high border border-outline-variant text-secondary mb-4">
            <Heart size={20} className="text-secondary" aria-hidden="true" />
          </div>
          <h3 className="font-display text-base font-bold uppercase tracking-wider text-on-surface">
            No registered spots
          </h3>
          <p className="mt-2 text-xs text-secondary leading-relaxed">
            Sift through our curated directory, tap the heart emblem, and compile your local blueprint for rapid reference.
          </p>
          <button
            type="button"
            onClick={onNavigateToExplore}
            className="mt-6 inline-flex items-center space-x-2 rounded-lg bg-on-surface text-surface px-5 py-2 text-xs font-bold tracking-widest uppercase hover:bg-on-surface/90 transition-all"
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
          {savedSpots.map(spot => (
            <SpotCard
              key={spot.id}
              spot={spot}
              isSaved={true}
              onOpen={onSelectSpot}
              onToggleSave={onToggleSave}
              variant="saved"
            />
          ))}
        </div>
      )}
    </section>
  );
}
