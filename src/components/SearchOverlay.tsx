import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Compass, ArrowRight, History } from 'lucide-react';
import { Spot } from '../types';
import { POPULAR_SEARCH_TERMS, RECENT_SEARCHES } from '../data';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  spots: Spot[];
  onSelectSpot: (spot: Spot) => void;
}

export default function SearchOverlay({
  isOpen,
  onClose,
  spots,
  onSelectSpot,
}: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      // Disable body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter spots based on queries
  const filteredSpots = query.trim() === '' 
    ? [] 
    : spots.filter(spot => {
        const q = query.toLowerCase();
        return (
          spot.name.toLowerCase().includes(q) ||
          spot.city.toLowerCase().includes(q) ||
          spot.type.toLowerCase().includes(q) ||
          spot.address.toLowerCase().includes(q) ||
          spot.features.some(f => f.toLowerCase().includes(q))
        );
      });

  return (
    <div id="search-overlay" className="fixed inset-0 z-50 flex flex-col bg-surface-bright p-4 md:p-8 animate-fade-in overflow-y-auto">
      {/* Top Header Row */}
      <div className="mx-auto w-full max-w-3xl flex items-center justify-between border-b border-outline-variant pb-4 mb-6">
        <div className="flex items-center space-x-3 flex-1 mr-4">
          <Search size={20} className="text-secondary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search spots by name, city, style, or features..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-lg font-medium text-on-surface focus:outline-none placeholder:text-secondary"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-secondary hover:text-on-surface"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="flex h-10 items-center space-x-1 px-4 border border-outline rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-surface-container text-secondary hover:text-on-surface transition-all"
        >
          <span>CLOSE</span>
          <kbd className="hidden md:inline rounded bg-surface-container px-1 py-0.5 text-[9px] font-mono">
            ESC
          </kbd>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-3xl flex-1">
        
        {/* If Query is Empty: Display popular and recent queries */}
        {query.trim() === '' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {/* Recent Searches */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <History size={14} className="text-secondary" />
                <h3 className="font-mono text-[10px] font-bold tracking-widest text-secondary uppercase">
                  RECENT SCOUT LOGS
                </h3>
              </div>
              <ul className="space-y-2">
                {RECENT_SEARCHES.map((term, idx) => (
                  <li
                    key={idx}
                    onClick={() => setQuery(term)}
                    className="flex items-center justify-between p-3 rounded-lg border border-outline-variant/60 bg-surface hover:border-outline hover:bg-surface-container cursor-pointer transition-all text-xs font-semibold uppercase tracking-wider text-on-surface"
                  >
                    <span>{term}</span>
                    <ArrowRight size={12} className="text-secondary" />
                  </li>
                ))}
              </ul>
            </div>

            {/* Popular Searches */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Compass size={14} className="text-secondary" />
                <h3 className="font-mono text-[10px] font-bold tracking-widest text-secondary uppercase">
                  POPULAR QUERIES
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCH_TERMS.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(term)}
                    className="px-4 py-2 rounded-lg border border-outline-variant bg-surface text-xs font-semibold uppercase tracking-wider text-on-surface hover:border-outline hover:bg-surface-container transition-all"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Live Query Matching List */
          <div className="space-y-4">
            <h3 className="font-mono text-[10px] font-bold tracking-widest text-secondary uppercase mb-2">
              MATCHED CODES ({filteredSpots.length})
            </h3>

            {filteredSpots.length > 0 ? (
              <div className="space-y-3">
                {filteredSpots.map((spot) => (
                  <div
                    key={spot.id}
                    onClick={() => {
                      onSelectSpot(spot);
                      onClose();
                    }}
                    className="p-4 rounded-xl border border-outline-variant bg-surface hover:border-outline hover:bg-surface-container flex space-x-4 items-center cursor-pointer transition-all"
                  >
                    {/* B&W Thumbnail */}
                    <div className="h-16 w-16 rounded-lg bg-black overflow-hidden shrink-0">
                      <img
                        src={spot.image}
                        alt={spot.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover filter grayscale"
                      />
                    </div>

                    {/* Metadata specs */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[9px] font-mono text-secondary mb-0.5">
                        <span className="font-bold uppercase">{spot.type}</span>
                        <span>{spot.distance}</span>
                      </div>
                      <h4 className="font-display text-sm font-bold tracking-wide text-on-surface uppercase truncate">
                        {spot.name}
                      </h4>
                      <p className="text-xs text-secondary flex items-center mt-1">
                        <MapPin size={11} className="mr-0.5 shrink-0" />
                        {spot.city} • <span className="ml-1 italic">"{spot.features.slice(0, 2).join(', ')}"</span>
                      </p>
                    </div>

                    <ArrowRight size={16} className="text-secondary shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs font-mono text-secondary rounded-xl border border-dashed border-outline-variant">
                NO PLOTS DETECTED FOR "{query.toUpperCase()}"
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
