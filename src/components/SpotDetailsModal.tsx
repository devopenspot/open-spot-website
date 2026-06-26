import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, MapPin, Heart, Share2, Compass, Sun, CloudSun, Cloud, ArrowLeft, ExternalLink 
} from 'lucide-react';
import { Spot } from '../types';

interface SpotDetailsModalProps {
  spot: Spot | null;
  onClose: () => void;
  onToggleSave: (id: string) => void;
  isSaved: boolean;
}

export default function SpotDetailsModal({
  spot,
  onClose,
  onToggleSave,
  isSaved,
}: SpotDetailsModalProps) {
  if (!spot) return null;

  // Render weather icon based on name
  const renderWeatherIcon = (iconName: string, size = 20) => {
    switch (iconName) {
      case 'sunny':
        return <Sun size={size} className="text-amber-500 animate-spin-slow" />;
      case 'partly_cloudy_day':
        return <CloudSun size={size} className="text-slate-500" />;
      case 'cloudy':
        return <Cloud size={size} className="text-slate-400" />;
      default:
        return <Sun size={size} className="text-amber-500" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6 sm:px-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl bg-surface text-on-surface shadow-2xl border border-outline-variant flex flex-col md:flex-row md:max-h-[85vh]"
        >
          {/* Close button - Top Right on mobile, or just handy */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-all hover:bg-black/75 backdrop-blur-md"
          >
            <X size={20} />
          </button>

          {/* Left Column: Black & White Image Spot Banner */}
          <div className="relative h-64 w-full bg-black md:h-auto md:w-1/2 overflow-hidden flex items-center justify-center group">
            <img
              src={spot.image}
              alt={spot.name}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover filter grayscale transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
            
            {/* Spot title and details on image overlay for larger feel */}
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="inline-block rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm mb-2">
                {spot.type}
              </span>
              <h2 className="font-display text-2xl font-bold tracking-wide leading-tight uppercase sm:text-3xl">
                {spot.name}
              </h2>
              <p className="mt-1 flex items-center text-xs text-slate-300">
                <MapPin size={12} className="mr-1 shrink-0" />
                {spot.city}
              </p>
            </div>
          </div>

          {/* Right Column: Information & Forecast Sheets */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar flex flex-col justify-between">
            <div>
              {/* Distance and Save Header */}
              <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-6">
                <span className="font-mono text-xs font-semibold tracking-wider text-secondary uppercase">
                  {spot.distance}
                </span>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onToggleSave(spot.id)}
                    className={`flex h-9 items-center space-x-1.5 rounded-full px-4 text-xs font-semibold tracking-wider uppercase transition-all border ${
                      isSaved
                        ? 'bg-primary text-surface border-primary hover:bg-primary/95'
                        : 'border-outline text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <Heart size={14} className={isSaved ? 'fill-surface' : ''} />
                    <span>{isSaved ? 'SAVED' : 'SAVE SPOT'}</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copied to clipboard!');
                    }}
                    title="Copy Link"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-outline text-on-surface hover:bg-surface-container transition-all"
                  >
                    <Share2 size={14} />
                  </button>
                </div>
              </div>

              {/* Grid Widgets (Crowd, Weather, Community Notes) */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
                
                {/* Weather widget */}
                <div className="rounded-xl bg-surface-container-low border border-outline-variant p-4">
                  <span className="block font-mono text-[10px] tracking-wider text-secondary uppercase mb-2">
                    WEATHER STATUS
                  </span>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Sun size={24} className="text-amber-500 animate-spin-slow" />
                      <div>
                        <span className="text-2xl font-bold font-display">{spot.weather.current}°C</span>
                        <span className="block text-[10px] text-secondary font-mono">CURRENT TEMP</span>
                      </div>
                    </div>
                  </div>

                  <span className="block font-mono text-[9px] tracking-wider text-secondary uppercase mb-1.5">
                    3-DAY FORECAST
                  </span>
                  <div className="flex justify-between gap-1.5 text-center">
                    {spot.weather.forecast.map((fc, idx) => (
                      <div key={idx} className="flex-1 rounded bg-surface-container p-2 border border-outline-variant/50">
                        <span className="block text-[10px] font-bold text-on-surface font-mono">{fc.day}</span>
                        <div className="my-1 flex justify-center">{renderWeatherIcon(fc.icon, 14)}</div>
                        <span className="text-[10px] font-medium text-secondary">{fc.temp}°C</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Crowd meter widget */}
                <div className="rounded-xl bg-surface-container-low border border-outline-variant p-4 flex flex-col justify-between">
                  <div>
                    <span className="block font-mono text-[10px] tracking-wider text-secondary uppercase mb-2">
                      LIVE CROWD LEVEL
                    </span>
                    <div className="flex items-end space-x-2 mb-2">
                      <span className="text-3xl font-bold font-display leading-none">{spot.crowdLevel}%</span>
                      <span className="text-xs text-secondary font-mono mb-0.5">OCCUPANCY</span>
                    </div>
                    {/* Visual bar */}
                    <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden border border-outline-variant/30">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          spot.crowdLevel > 70 ? 'bg-amber-600' : spot.crowdLevel > 40 ? 'bg-primary' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${spot.crowdLevel}%` }}
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] font-medium text-on-surface font-sans">
                    {spot.crowdLevelLabel}
                  </p>
                </div>

              </div>

              {/* Exact Address / Map Assist */}
              <div className="mb-6 rounded-xl bg-surface-container-low border border-outline-variant p-4">
                <span className="block font-mono text-[10px] tracking-wider text-secondary uppercase mb-1">
                  LOCATION ADDRESS
                </span>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                  {spot.address}
                </p>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.name + ' ' + spot.address)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2.5 inline-flex items-center text-[10px] font-bold tracking-wider uppercase text-primary hover:underline"
                >
                  <span>GET DIRECTIONS</span>
                  <ExternalLink size={10} className="ml-1" />
                </a>
              </div>

              {/* Community Note */}
              <div className="mb-6 border-l-2 border-primary pl-4 py-1">
                <span className="block font-mono text-[10px] tracking-wider text-secondary uppercase mb-1">
                  COMMUNITY INTEL
                </span>
                <p className="italic text-xs text-on-surface leading-relaxed">
                  "{spot.communityNote}"
                </p>
              </div>

              {/* Terrain tags */}
              <div className="mb-4">
                <span className="block font-mono text-[10px] tracking-wider text-secondary uppercase mb-2">
                  SPOT DETAILS
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {spot.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-surface-container-high px-2.5 py-1 text-[10px] font-medium text-on-surface border border-outline-variant/60"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Quick action buttons at bottom of details panel */}
            <div className="mt-6 border-t border-outline-variant pt-4 flex space-x-3">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.name + ' ' + spot.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex h-10 items-center justify-center space-x-1.5 rounded-lg bg-on-surface text-surface text-xs font-bold tracking-widest uppercase hover:bg-on-surface/90 transition-all shadow-sm"
              >
                <span>LAUNCHAR ROUTE</span>
                <ExternalLink size={12} />
              </a>
              <button
                onClick={onClose}
                className="flex-1 flex h-10 items-center justify-center rounded-lg border border-outline text-xs font-bold tracking-widest uppercase hover:bg-surface-container transition-all"
              >
                CLOSE INFO
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
