import { useMemo } from 'react';
import { ChevronRight, Award, Globe, ArrowRight } from 'lucide-react';
import { Spot } from '../types';
import { EXPLORE_CATEGORIES, LEGENDARY_TERRAINS, REGIONS_DATA } from '../data';
import { SpotCard } from './SpotCard';
import { SectionHeader } from './SectionHeader';

interface ExploreTabProps {
  spots: Spot[];
  savedSpotIds: Set<string>;
  onSelectSpot: (spot: Spot) => void;
  onToggleSave: (id: string) => void;
  onNavigateToMap: () => void;
}

export default function ExploreTab({
  spots,
  savedSpotIds,
  onSelectSpot,
  onToggleSave,
  onNavigateToMap,
}: ExploreTabProps) {
  const spotlightSpots = useMemo(() => spots.slice(0, 6), [spots]);

  return (
    <section
      id="explore-tab"
      role="tabpanel"
      aria-labelledby="nav-btn-explore"
      className="space-y-12 pb-24 animate-fade-in"
    >
      {/* 1. Category Panels */}
      <section id="explore-categories" aria-label="Spot categories">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {EXPLORE_CATEGORIES.map(cat => (
            <div
              key={cat.name}
              id={`category-card-${cat.name.toLowerCase()}`}
              className="group relative h-40 overflow-hidden rounded-xl bg-black shadow-md"
            >
              <img
                src={cat.image}
                alt={cat.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover opacity-70 filter grayscale transition-transform duration-700 ease-out group-hover:scale-105 group-hover:opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" aria-hidden="true" />
              <div className="absolute bottom-5 left-5 text-white">
                <span className="font-display text-2xl font-bold tracking-widest uppercase sm:text-3xl">
                  {cat.name}
                </span>
                <p className="mt-1 text-xs tracking-wider text-slate-300 font-mono uppercase">
                  Discover spots & tricks
                </p>
              </div>
              <div className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:bg-white/25 backdrop-blur-sm" aria-hidden="true">
                <ArrowRight size={16} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Spotlight Spots */}
      <section id="spotlight-spots" aria-labelledby="spotlight-heading">
        <SectionHeader
          eyebrow="Curated Archive"
          title="Spotlight Spots"
          titleId="spotlight-heading"
          cta={
            <button
              id="view-all-map-link"
              type="button"
              onClick={onNavigateToMap}
              className="group flex items-center space-x-1 text-xs font-semibold tracking-wider text-primary uppercase hover:underline"
            >
              <span>View on map</span>
              <ChevronRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
            </button>
          }
        />

        <div
          id="spotlight-grid"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {spotlightSpots.map(spot => (
            <SpotCard
              key={spot.id}
              spot={spot}
              isSaved={savedSpotIds.has(spot.id)}
              onOpen={onSelectSpot}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      </section>

      {/* 3. Legendary Terrains */}
      <section
        id="legendary-terrains"
        aria-labelledby="legendary-heading"
        className="rounded-2xl border border-outline-variant bg-surface-container-low p-6 sm:p-8"
      >
        <SectionHeader
          eyebrow="Hall of Fame"
          eyebrowIcon={<Award size={14} className="text-primary" aria-hidden="true" />}
          title="Legendary Plazas"
          titleId="legendary-heading"
          description="Explore world-renowned monuments that shaped skateboarding history, captured in high contrast."
          className="mb-6"
        />

        <div
          id="legendary-shelf"
          className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth snap-x"
        >
          {LEGENDARY_TERRAINS.map(terrain => (
            <article
              key={terrain.name}
              className="min-w-[240px] sm:min-w-[280px] snap-start rounded-xl overflow-hidden bg-surface-bright border border-outline-variant flex flex-col"
            >
              <div className="h-32 bg-black overflow-hidden relative">
                <img
                  src={terrain.image}
                  alt={terrain.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover filter grayscale opacity-90 transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" aria-hidden="true" />
                <span className="absolute bottom-2 left-3 font-display text-sm font-bold tracking-wider text-white uppercase">
                  {terrain.name}
                </span>
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between">
                <p className="text-[11px] text-secondary leading-relaxed">
                  {terrain.desc}
                </p>
                <div className="mt-2 text-[9px] font-mono tracking-wider font-semibold text-primary uppercase">
                  Historic Memorial
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 4. Browse Regions */}
      <section id="browse-regions" aria-labelledby="regions-heading">
        <SectionHeader
          eyebrow="Global Perspectives"
          eyebrowIcon={<Globe size={14} className="text-primary" aria-hidden="true" />}
          title="Browse Regions"
          titleId="regions-heading"
        />

        <div
          id="regions-grid"
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {REGIONS_DATA.map(region => (
            <div
              key={region.name}
              className="group relative h-48 overflow-hidden rounded-xl bg-black border border-outline-variant shadow-sm"
            >
              <img
                src={region.image}
                alt={region.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover opacity-60 filter grayscale transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" aria-hidden="true" />

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
    </section>
  );
}
