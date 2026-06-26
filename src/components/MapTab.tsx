import React, { useState, useMemo } from 'react';
import { 
  MapPin, Navigation, ZoomIn, ZoomOut, Filter, Info, Heart, Calendar, Activity, Compass, Flame 
} from 'lucide-react';
import { Spot } from '../types';

interface MapTabProps {
  spots: Spot[];
  savedSpotIds: Set<string>;
  onSelectSpot: (spot: Spot) => void;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
}

export default function MapTab({
  spots,
  savedSpotIds,
  onSelectSpot,
  onToggleSave,
}: MapTabProps) {
  const [selectedType, setSelectedType] = useState<string>('All');
  const [activePin, setActivePin] = useState<Spot | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [mapPan, setMapPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Get unique spot types for filtering
  const spotTypes = useMemo(() => {
    const types = new Set<string>();
    spots.forEach(s => types.add(s.type));
    return ['All', ...Array.from(types)];
  }, [spots]);

  // Filtered spots
  const filteredSpots = useMemo(() => {
    if (selectedType === 'All') return spots;
    return spots.filter(s => s.type === selectedType);
  }, [spots, selectedType]);

  // Map panning triggers
  const handleZoom = (direction: 'in' | 'out') => {
    if (direction === 'in') {
      setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
    } else {
      setZoomLevel(prev => Math.max(prev - 0.25, 0.75));
    }
  };

  const handleResetMap = () => {
    setZoomLevel(1);
    setMapPan({ x: 0, y: 0 });
    setActivePin(null);
  };

  return (
    <div id="map-tab" className="flex flex-col lg:flex-row gap-6 pb-24 animate-fade-in h-[calc(100vh-160px)] min-h-[500px]">
      {/* Sidebar List (Left Side on Desktop) */}
      <div id="map-sidebar" className="w-full lg:w-80 flex flex-col border border-outline-variant rounded-2xl bg-surface-bright overflow-hidden h-[300px] lg:h-full">
        {/* Sidebar Header & Filters */}
        <div className="p-4 border-b border-outline-variant bg-surface-container-low">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] font-bold tracking-widest text-secondary uppercase">
              LOCATOR MATRIX
            </span>
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[9px] font-mono font-semibold text-primary">
              {filteredSpots.length} PLOTS ACTIVE
            </span>
          </div>

          <h3 className="font-display text-base font-bold uppercase tracking-wider text-on-surface mb-3 flex items-center">
            <Filter size={14} className="mr-1.5 text-secondary" />
            FILTER BY TERRAIN
          </h3>

          {/* Inline Pills for Filters */}
          <div className="flex flex-wrap gap-1.5 no-scrollbar max-h-24 overflow-y-auto">
            {spotTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`rounded-full px-3 py-1 text-[10px] font-medium tracking-wide transition-all border ${
                  selectedType === type
                    ? 'bg-primary text-surface border-primary'
                    : 'bg-surface border-outline-variant text-secondary hover:text-on-surface hover:border-outline'
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic spot scrolling column */}
        <div id="sidebar-spots-list" className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
          {filteredSpots.map((spot) => {
            const isSaved = savedSpotIds.has(spot.id);
            const isHovered = activePin?.id === spot.id;
            return (
              <div
                key={spot.id}
                id={`sidebar-spot-item-${spot.id}`}
                onClick={() => {
                  setActivePin(spot);
                  // Focus the coordinates
                  setMapPan({
                    x: (50 - spot.coordinates.x) * 2 * zoomLevel,
                    y: (50 - spot.coordinates.y) * 2 * zoomLevel,
                  });
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex space-x-3 items-center ${
                  isHovered 
                    ? 'border-primary bg-surface-container-high shadow-sm' 
                    : 'border-outline-variant/60 bg-surface-container-low hover:border-outline hover:bg-surface-container'
                }`}
              >
                {/* Thumbnail B&W */}
                <div className="h-12 w-12 rounded-lg bg-black overflow-hidden shrink-0">
                  <img
                    src={spot.image}
                    alt={spot.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover filter grayscale"
                  />
                </div>

                {/* Info Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-semibold text-secondary uppercase">
                      {spot.type}
                    </span>
                    <span className="text-[8px] font-mono font-medium text-secondary">
                      {spot.distance}
                    </span>
                  </div>
                  <h4 className="font-display text-xs font-bold uppercase tracking-wide truncate text-on-surface">
                    {spot.name}
                  </h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-secondary truncate">
                      {spot.city}
                    </span>
                    <div className="flex items-center space-x-1">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      <span className="text-[8px] font-mono text-secondary">CRD: {spot.crowdLevel}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredSpots.length === 0 && (
            <div className="p-6 text-center text-xs text-secondary font-mono">
              NO LOCATIONS MATCH FILTER
            </div>
          )}
        </div>
      </div>

      {/* Simulated Map Canvas */}
      <div id="map-canvas-container" className="flex-1 border border-outline-variant rounded-2xl bg-surface-container-low overflow-hidden relative flex flex-col">
        {/* Map Header Toolbar Overlay */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          <div className="flex items-center space-x-2 bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-outline-variant shadow-sm pointer-events-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-mono text-[10px] font-bold tracking-wider text-on-surface uppercase">
              LOS ANGELES GRID ACTIVE
            </span>
          </div>

          {/* Map Controls */}
          <div className="flex items-center space-x-1 bg-surface/90 backdrop-blur-md p-1 rounded-lg border border-outline-variant shadow-sm pointer-events-auto">
            <button
              onClick={() => handleZoom('in')}
              title="Zoom In"
              className="p-1.5 rounded text-secondary hover:text-on-surface hover:bg-surface-container transition-all"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => handleZoom('out')}
              title="Zoom Out"
              className="p-1.5 rounded text-secondary hover:text-on-surface hover:bg-surface-container transition-all"
            >
              <ZoomOut size={14} />
            </button>
            <div className="h-4 w-px bg-outline-variant mx-1" />
            <button
              onClick={handleResetMap}
              className="px-2 py-1 text-[9px] font-mono font-bold tracking-wider uppercase text-primary hover:bg-surface-container rounded transition-all"
            >
              RESET VIEW
            </button>
          </div>
        </div>

        {/* The Interactive Coordinate Board (Minimalist blueprint contours) */}
        <div 
          id="map-viewport" 
          className="flex-1 relative cursor-grab overflow-hidden active:cursor-grabbing bg-[#eeeeee]"
          style={{
            backgroundImage: `
              radial-gradient(#cfc4c5 1px, transparent 1px),
              linear-gradient(to right, #e2e2e2 1px, transparent 1px),
              linear-gradient(to bottom, #e2e2e2 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
          }}
        >
          {/* Animated Map Plotting Coordinates */}
          <div
            id="map-transform-layer"
            className="absolute inset-0 transition-transform duration-500 ease-out"
            style={{
              transform: `scale(${zoomLevel}) translate(${mapPan.x}px, ${mapPan.y}px)`,
              transformOrigin: 'center center',
            }}
          >
            {/* Center Axis Reference */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-outline-variant/40" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-outline-variant/40" />

            {/* Render Pins */}
            {filteredSpots.map((spot) => {
              const isActive = activePin?.id === spot.id;
              return (
                <div
                  key={spot.id}
                  id={`map-pin-${spot.id}`}
                  className="absolute"
                  style={{
                    left: `${spot.coordinates.x}%`,
                    top: `${spot.coordinates.y}%`,
                  }}
                >
                  {/* Pin Circle Dot with Ripple */}
                  <div className="relative -left-3 -top-3">
                    {/* Ring ripple on active */}
                    {isActive && (
                      <span className="absolute -inset-2 rounded-full bg-primary/20 animate-ping duration-1000" />
                    )}
                    
                    <button
                      onClick={() => setActivePin(isActive ? null : spot)}
                      className={`h-6 w-6 rounded-full flex items-center justify-center transition-all shadow-md ${
                        isActive 
                          ? 'bg-primary text-surface scale-125 border-2 border-surface' 
                          : 'bg-surface border border-outline hover:border-primary hover:scale-110 text-on-surface'
                      }`}
                    >
                      <MapPin size={11} className={isActive ? 'fill-current' : ''} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Info Card Overlay at bottom when a pin is selected */}
          {activePin && (
            <div 
              id="map-info-popup" 
              className="absolute bottom-4 left-4 right-4 z-20 md:left-auto md:right-4 md:w-80 bg-surface/95 backdrop-blur-md rounded-xl border border-outline-variant shadow-lg p-4 animate-slide-up"
            >
              <div className="flex space-x-3">
                <div className="h-16 w-16 bg-black rounded-lg overflow-hidden shrink-0">
                  <img
                    src={activePin.image}
                    alt={activePin.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover filter grayscale"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase tracking-wider text-primary mb-1">
                    {activePin.type}
                  </span>
                  <h4 className="font-display text-sm font-bold tracking-wide uppercase text-on-surface truncate">
                    {activePin.name}
                  </h4>
                  <p className="text-[10px] text-secondary flex items-center">
                    <MapPin size={10} className="mr-0.5" />
                    {activePin.city}
                  </p>
                </div>
              </div>

              {/* Status details */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-outline-variant/60 text-[10px] font-mono">
                <div>
                  <span className="block text-[8px] text-secondary">CROWD DENSITY</span>
                  <span className="font-semibold text-on-surface">{activePin.crowdLevel}% OCCUPIED</span>
                </div>
                <div>
                  <span className="block text-[8px] text-secondary">AIR TEMP</span>
                  <span className="font-semibold text-on-surface">{activePin.weather.current}°C SUNNY</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => onSelectSpot(activePin)}
                  className="flex-1 bg-on-surface text-surface py-1.5 rounded-md text-[10px] font-bold tracking-wider uppercase hover:bg-on-surface/90 transition-all text-center"
                >
                  FULL INFO MATRIX
                </button>
                <button
                  onClick={() => setActivePin(null)}
                  className="px-2.5 border border-outline rounded-md text-[10px] font-bold tracking-wider uppercase hover:bg-surface-container text-secondary transition-all"
                >
                  DISMISS
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Legend strip overlay at bottom */}
        <div className="bg-surface border-t border-outline-variant px-4 py-2.5 flex flex-wrap gap-4 text-[10px] font-mono justify-center items-center">
          <span className="text-secondary font-bold uppercase">MARKER LEGEND:</span>
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-secondary uppercase">SKATEABLE PLOTS</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-[#eeeeee] border border-outline" />
            <span className="text-secondary uppercase">UNSELECTED OBSTACLE</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-primary/20" />
            <span className="text-on-surface font-semibold uppercase">ACTIVE SCOUT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
