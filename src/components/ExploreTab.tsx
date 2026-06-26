import React from 'react';
import { ChevronRight, Heart, MapPin, Compass, Award, Globe, ArrowRight } from 'lucide-react';
import { Spot } from '../types';
import { EXPLORE_CATEGORIES, LEGENDARY_TERRAINS, REGIONS_DATA } from '../data';

interface ExploreTabProps {
  spots: Spot[];
  savedSpotIds: Set<string>;
  onSelectSpot: (spot: Spot) => void;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
  onNavigateToMap: () => void;
}

export default function ExploreTab({
  spots,
  savedSpotIds,
  onSelectSpot,
  onToggleSave,
  onNavigateToMap,
}: ExploreTabProps) {
  // Take 6 spots for the spotlight grid/list
  const spotlightSpots = spots.slice(0, 6);

  return (
    <div id="explore-tab" className="space-y-12 pb-24 animate-fade-in">
      {/* 1. Category Panels */}
      <section id="explore-categories">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {EXPLORE_CATEGORIES.map((cat, idx) => (
            <div
              key={idx}
              id={`category-card-${cat.name.toLowerCase()}`}
              className="group relative h-40 overflow-hidden rounded-xl bg-black cursor-pointer shadow-md"
            >
              <img
                src={cat.image}
                alt={cat.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover opacity-70 filter grayscale transition-transform duration-700 ease-out group-hover:scale-105 group-hover:opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-5 left-5 text-white">
                <span className="font-display text-2xl font-bold tracking-widest uppercase sm:text-3xl">
                  {cat.name}
                </span>
                <p className="mt-1 text-xs tracking-wider text-slate-300 font-mono uppercase">
                  DISCOVER SPOTS & TRICKS
                </p>
              </div>
              <div className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:bg-white/25 backdrop-blur-sm">
                <ArrowRight size={16} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Spotlight Spots */}
      <section id="spotlight-spots">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <span className="font-mono text-[10px] font-bold tracking-widest text-secondary uppercase block mb-1">
              CURATED ARCHIVE
            </span>
            <h2 className="font-display text-2xl font-bold tracking-tight text-on-surface uppercase sm:text-3xl">
              SPOTLIGHT SPOTS
            </h2>
          </div>
          <button 
            id="view-all-map-link"
            onClick={onNavigateToMap}
            className="group flex items-center space-x-1 text-xs font-semibold tracking-wider text-primary uppercase hover:underline"
          >
            <span>VIEW ON MAP</span>
            <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Spot Grid Cards */}
        <div id="spotlight-grid" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {spotlightSpots.map((spot) => {
            const isSaved = savedSpotIds.has(spot.id);
            return (
              <div
                key={spot.id}
                id={`spot-card-${spot.id}`}
                onClick={() => onSelectSpot(spot)}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-bright shadow-sm cursor-pointer transition-all hover:shadow-md"
              >
                {/* Image Section */}
                <div className="relative h-48 w-full overflow-hidden bg-black/5">
                  <img
                    src={spot.image}
                    alt={spot.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover filter grayscale transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  {/* Heart / Save Overlay */}
                  <button
                    onClick={(e) => onToggleSave(spot.id, e)}
                    id={`spot-save-btn-${spot.id}`}
                    className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border bg-white/80 text-on-surface backdrop-blur-sm shadow-sm transition-all hover:scale-105 ${
                      isSaved 
                        ? 'border-primary bg-primary text-surface' 
                        : 'border-outline-variant hover:bg-white'
                    }`}
                  >
                    <Heart size={14} className={isSaved ? 'fill-surface' : ''} />
                  </button>

                  {/* Spot Type Badge */}
                  <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase text-white backdrop-blur-sm">
                    {spot.type}
                  </span>
                </div>

                {/* Info Text Section */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <span className="font-mono text-[9px] font-bold text-secondary uppercase tracking-wider block mb-1">
                      {spot.distance}
                    </span>
                    <h3 className="font-display text-base font-bold tracking-wide text-on-surface uppercase group-hover:underline">
                      {spot.name}
                    </h3>
                    <p className="mt-1 text-xs text-secondary flex items-center">
                      <MapPin size={11} className="mr-1 shrink-0" />
                      {spot.city}
                    </p>
                  </div>

                  {/* Visual Status Indicator line */}
                  <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center space-x-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        spot.crowdLevel > 70 ? 'bg-amber-600 animate-pulse' : 'bg-primary'
                      }`} />
                      <span className="text-secondary uppercase">CROWD: {spot.crowdLevel}%</span>
                    </div>
                    <span className="text-primary font-semibold uppercase">VIEW DETAILS</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Legendary Terrains (Mockup 3 Row) */}
      <section id="legendary-terrains" className="rounded-2xl border border-outline-variant bg-surface-container-low p-6 sm:p-8">
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-1">
            <Award size={14} className="text-primary" />
            <span className="font-mono text-[10px] font-bold tracking-widest text-secondary uppercase">
              HALL OF FAME
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-on-surface uppercase sm:text-3xl">
            LEGENDARY PLAZAS
          </h2>
          <p className="mt-1 text-xs text-secondary leading-relaxed max-w-xl">
            Explore world-renowned monuments that shaped skateboarding history, captured in high contrast.
          </p>
        </div>

        {/* Horizontal Scroll Shelf */}
        <div id="legendary-shelf" className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth snap-x">
          {LEGENDARY_TERRAINS.map((terrain, idx) => (
            <div
              key={idx}
              className="min-w-[240px] sm:min-w-[280px] snap-start rounded-xl overflow-hidden bg-surface-bright border border-outline-variant flex flex-col"
            >
              <div className="h-32 bg-black overflow-hidden relative">
                <img
                  src={terrain.image}
                  alt={terrain.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover filter grayscale opacity-90 transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                <span className="absolute bottom-2 left-3 font-display text-sm font-bold tracking-wider text-white uppercase">
                  {terrain.name}
                </span>
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between">
                <p className="text-[11px] text-secondary leading-relaxed">
                  {terrain.desc}
                </p>
                <div className="mt-2 text-[9px] font-mono tracking-wider font-semibold text-primary uppercase">
                  HISTORIC MEMORIAL
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Browse Regions (Mockup 5 bottom section) */}
      <section id="browse-regions">
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-1">
            <Globe size={14} className="text-primary" />
            <span className="font-mono text-[10px] font-bold tracking-widest text-secondary uppercase">
              GLOBAL PERSPECTIVES
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-on-surface uppercase sm:text-3xl">
            BROWSE REGIONS
          </h2>
        </div>

        <div id="regions-grid" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {REGIONS_DATA.map((region, idx) => (
            <div
              key={idx}
              className="group relative h-48 overflow-hidden rounded-xl bg-black cursor-pointer border border-outline-variant shadow-sm"
            >
              <img
                src={region.image}
                alt={region.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover opacity-60 filter grayscale transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              
              {/* Region Metadata Overlay */}
              <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
                <span className="self-end rounded-full bg-white/20 px-2.5 py-0.5 text-[9px] font-mono tracking-widest uppercase backdrop-blur-sm">
                  {region.count}
                </span>

                <div>
                  <h3 className="font-display text-lg font-bold tracking-wide uppercase sm:text-xl">
                    {region.name}
                  </h3>
                  <p className="mt-1 text-[10px] text-slate-300 leading-normal line-clamp-2">
                    {region.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
