import React from 'react';
import { Heart, Trash2, MapPin, Compass, ArrowRight, Activity } from 'lucide-react';
import { Spot } from '../types';

interface SavedTabProps {
  spots: Spot[];
  savedSpotIds: Set<string>;
  onSelectSpot: (spot: Spot) => void;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
  onNavigateToExplore: () => void;
}

export default function SavedTab({
  spots,
  savedSpotIds,
  onSelectSpot,
  onToggleSave,
  onNavigateToExplore,
}: SavedTabProps) {
  // Filter spots to show only the ones that are saved
  const savedSpots = spots.filter(s => savedSpotIds.has(s.id));

  return (
    <div id="saved-tab" className="space-y-8 pb-24 animate-fade-in">
      <div className="border-b border-outline-variant pb-5">
        <span className="font-mono text-[10px] font-bold tracking-widest text-secondary uppercase block mb-1">
          PERSONAL MATRIX
        </span>
        <h2 className="font-display text-2xl font-bold tracking-tight text-on-surface uppercase sm:text-3xl">
          SAVED LOCATIONS
        </h2>
        <p className="mt-1.5 text-xs text-secondary leading-relaxed max-w-xl">
          Your bookmarked street spots, parks, and DIY terrain. Active weather and crowd logs kept live.
        </p>
      </div>

      {/* Empty State */}
      {savedSpots.length === 0 ? (
        <div id="saved-empty-state" className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low max-w-md mx-auto mt-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high border border-outline-variant text-secondary mb-4">
            <Heart size={20} className="text-secondary" />
          </div>
          <h3 className="font-display text-base font-bold uppercase tracking-wider text-on-surface">
            NO REGISTERED SPOTS
          </h3>
          <p className="mt-2 text-xs text-secondary leading-relaxed">
            Sift through our curated directory, tap the heart emblem, and compile your local blueprint for rapid reference.
          </p>
          <button
            onClick={onNavigateToExplore}
            className="mt-6 inline-flex items-center space-x-2 rounded-lg bg-on-surface text-surface px-5 py-2 text-xs font-bold tracking-widest uppercase hover:bg-on-surface/90 transition-all"
          >
            <Compass size={14} />
            <span>EXPLORE ARCHIVE</span>
          </button>
        </div>
      ) : (
        /* Saved Spots Grid */
        <div id="saved-spots-grid" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {savedSpots.map((spot) => (
            <div
              key={spot.id}
              id={`saved-card-${spot.id}`}
              onClick={() => onSelectSpot(spot)}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-bright shadow-sm cursor-pointer transition-all hover:shadow-md"
            >
              {/* Thumbnail Header Area */}
              <div className="relative h-44 w-full bg-black/10 overflow-hidden">
                <img
                  src={spot.image}
                  alt={spot.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover filter grayscale transition-transform duration-500 group-hover:scale-105"
                />

                {/* Remove Bookmarked Button */}
                <button
                  onClick={(e) => onToggleSave(spot.id, e)}
                  title="Remove Bookmark"
                  className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-surface/95 text-red-600 shadow-sm border border-outline-variant hover:bg-surface hover:scale-105 transition-all"
                >
                  <Trash2 size={13} />
                </button>

                <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2.5 py-0.5 text-[9px] font-mono tracking-widest uppercase text-white backdrop-blur-sm">
                  {spot.type}
                </span>
              </div>

              {/* Main Metadata Panel */}
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <div className="flex items-center justify-between text-[9px] font-mono text-secondary mb-1">
                    <span className="font-semibold uppercase">{spot.distance}</span>
                    <span className="uppercase">{spot.city}</span>
                  </div>
                  <h3 className="font-display text-sm font-bold tracking-wide text-on-surface uppercase group-hover:underline">
                    {spot.name}
                  </h3>
                  <p className="mt-1 text-xs text-secondary line-clamp-1">
                    {spot.address}
                  </p>
                </div>

                {/* Live info panel footer */}
                <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between text-[9px] font-mono">
                  <div className="flex items-center space-x-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-secondary uppercase">CROWD: {spot.crowdLevel}%</span>
                  </div>
                  <div className="flex items-center space-x-1 text-secondary">
                    <Activity size={10} />
                    <span>TEMP: {spot.weather.current}°C</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
