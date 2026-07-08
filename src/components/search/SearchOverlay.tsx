"use client";

import { useDeferredValue, useEffect, useId, useRef, useState } from "react";
import { Search, X, MapPin, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Overlay } from "@/components/feedback/Overlay";
import { SEARCH_FOCUS_DELAY_MS } from "@/lib/constants";
import { ROUTES } from "@/lib/nav";
import { useUIStore } from "@/stores/ui-store";
import type { Spot } from "@/lib/types";
import { getSpotDistanceLabel } from "@/lib/spots/geo";
import { RegionFilter } from "@/components/search/RegionFilter";
import { useMapFilter } from "@/hooks/useMapFilter";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  spots: readonly Spot[];
  onSelectSpot: (spot: Spot) => void;
}

export function SearchOverlay({
  isOpen,
  onClose,
  spots,
  onSelectSpot,
}: SearchOverlayProps) {
  const titleId = useId();
  const inputId = useId();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const openSearch = useUIStore((s) => s.openSearch);

  const {
    region,
    country,
    availableCountries,
    filteredSpots,
    setRegion,
    setCountry,
    clearAll,
  } = useMapFilter(spots, { targetPath: ROUTES.map });

  useEffect(() => {
    if (isOpen) {
      const id = window.setTimeout(
        () => inputRef.current?.focus(),
        SEARCH_FOCUS_DELAY_MS,
      );
      return () => window.clearTimeout(id);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) openSearch();
  }, [isOpen, openSearch]);

  const handlePick = (spot: Spot) => {
    onSelectSpot(spot);
    onClose();
  };

  return (
    <Overlay
      isOpen={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      flush
      containerClassName="bg-surface-bright"
      panelClassName="bg-surface-bright p-4 md:p-8 overflow-y-auto"
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-6">
          <h2 id={titleId} className="visually-hidden">
            Search spots
          </h2>
          <div className="flex items-center space-x-3 flex-1 mr-4">
            <label htmlFor={inputId} className="visually-hidden">
              Search spots by name, city, style, or features
            </label>
            <Search
              size={20}
              className="text-secondary shrink-0"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              id={inputId}
              type="search"
              role="searchbox"
              autoComplete="off"
              placeholder="Search spots by name, city, style, or features..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-lg font-medium text-on-surface focus:outline-none placeholder:text-secondary"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="text-secondary hover:text-on-surface"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 items-center space-x-1 px-4 border border-outline rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-surface-container text-secondary hover:text-on-surface transition-all"
          >
            <span>Close</span>
            <kbd
              aria-hidden="true"
              className="hidden md:inline rounded bg-surface-container px-1 py-0.5 text-[9px] font-mono"
            >
              ESC
            </kbd>
          </button>
        </div>

        <div className="mx-auto w-full max-w-3xl flex-1">
          {deferredQuery.trim() === "" ? (
            <div className="grid grid-cols-1 md:grid-cols-1 gap-8 pt-4">
              <RegionFilter
                region={region}
                country={country}
                availableCountries={availableCountries}
                filteredSpots={filteredSpots}
                hasFilter={region !== null || country !== null}
                setRegion={setRegion}
                setCountry={setCountry}
                clearAll={clearAll}
                onAfterChange={onClose}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <h3
                aria-live="polite"
                aria-atomic="true"
                className="font-mono text-[10px] font-bold tracking-widest text-secondary uppercase mb-2"
              >
                Matched codes ({filteredSpots.length})
              </h3>

              {filteredSpots.length > 0 ? (
                <ul className="space-y-3" aria-label="Matched spots">
                  {filteredSpots.map((spot) => (
                    <li key={spot.id}>
                      <button
                        type="button"
                        onClick={() => handlePick(spot)}
                        className="w-full p-4 rounded-xl border border-outline-variant bg-surface hover:border-outline hover:bg-surface-container flex space-x-4 items-center cursor-pointer transition-all text-left"
                      >
                        <span className="relative h-16 w-16 rounded-lg bg-black overflow-hidden shrink-0">
                          <Image
                            src={spot.image}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover grayscale"
                            referrerPolicy="no-referrer"
                            unoptimized
                          />
                        </span>

                        <span className="flex-1 min-w-0">
                          <span className="flex items-center justify-between text-[9px] font-mono text-secondary mb-0.5">
                            <span className="font-bold uppercase">
                              {spot.type}
                            </span>
                            <span>{getSpotDistanceLabel(spot)}</span>
                          </span>
                          <span className="block font-display text-sm font-bold tracking-wide text-on-surface uppercase truncate">
                            {spot.name}
                          </span>
                          <span className="text-xs text-secondary flex items-center mt-1">
                            <MapPin
                              size={11}
                              className="mr-0.5 shrink-0"
                              aria-hidden="true"
                            />
                            {spot.city} •{" "}
                            <span className="ml-1 italic">
                              &ldquo;
                              {spot.features.slice(0, 2).join(", ")}
                              &rdquo;
                            </span>
                          </span>
                        </span>

                        <ArrowRight
                          size={16}
                          className="text-secondary shrink-0"
                          aria-hidden="true"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-12 text-center text-xs font-mono text-secondary rounded-xl border border-dashed border-outline-variant">
                  No plots detected for &ldquo;
                  {deferredQuery.toUpperCase()}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Overlay>
  );
}
