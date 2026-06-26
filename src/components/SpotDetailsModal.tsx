import { useId } from 'react';
import { X, MapPin, Heart, Share2, ExternalLink } from 'lucide-react';
import { Spot } from '../types';
import { Overlay } from './Overlay';
import { WeatherIcon } from './WeatherIcon';
import { showToast } from '../hooks/useToast';

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
  const titleId = useId();

  if (!spot) return null;

  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.name + ' ' + spot.address)}`;

  const handleShare = async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard', 'success');
      } else {
        showToast('Sharing not supported in this browser', 'error');
      }
    } catch {
      showToast('Could not copy link', 'error');
    }
  };

  return (
    <Overlay
      isOpen={Boolean(spot)}
      onClose={onClose}
      labelledBy={titleId}
      panelClassName="overflow-hidden rounded-2xl bg-surface text-on-surface shadow-2xl border border-outline-variant flex flex-col md:flex-row md:max-h-[85vh] max-w-4xl"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close spot details"
        className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-all hover:bg-black/75 backdrop-blur-md"
      >
        <X size={20} aria-hidden="true" />
      </button>

      <div className="relative h-64 w-full bg-black md:h-auto md:w-1/2 overflow-hidden flex items-center justify-center group">
        <img
          src={spot.image}
          alt={spot.name}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover filter grayscale transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" aria-hidden="true" />

        <div className="absolute bottom-6 left-6 right-6 text-white">
          <span className="inline-block rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm mb-2">
            {spot.type}
          </span>
          <h2
            id={titleId}
            className="font-display text-2xl font-bold tracking-wide leading-tight uppercase sm:text-3xl"
          >
            {spot.name}
          </h2>
          <p className="mt-1 flex items-center text-xs text-slate-300">
            <MapPin size={12} className="mr-1 shrink-0" aria-hidden="true" />
            {spot.city}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-6 gap-2">
            <span className="font-mono text-xs font-semibold tracking-wider text-secondary uppercase">
              {spot.distance}
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onToggleSave(spot.id)}
                aria-pressed={isSaved}
                aria-label={isSaved ? `Unsave ${spot.name}` : `Save ${spot.name}`}
                className={`flex h-9 items-center space-x-1.5 rounded-full px-4 text-xs font-semibold tracking-wider uppercase transition-all border ${
                  isSaved
                    ? 'bg-primary text-surface border-primary hover:bg-primary/95'
                    : 'border-outline text-on-surface hover:bg-surface-container'
                }`}
              >
                <Heart size={14} aria-hidden="true" className={isSaved ? 'fill-surface' : ''} />
                <span>{isSaved ? 'Saved' : 'Save spot'}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                aria-label="Copy link to this spot"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-outline text-on-surface hover:bg-surface-container transition-all"
              >
                <Share2 size={14} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
            <div className="rounded-xl bg-surface-container-low border border-outline-variant p-4">
              <span className="block font-mono text-[10px] tracking-wider text-secondary uppercase mb-2">
                Weather status
              </span>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <WeatherIcon name="sunny" size={24} />
                  <div>
                    <span className="text-2xl font-bold font-display">{spot.weather.current}°C</span>
                    <span className="block text-[10px] text-secondary font-mono">Current temp</span>
                  </div>
                </div>
              </div>
              <span className="block font-mono text-[9px] tracking-wider text-secondary uppercase mb-1.5">
                3-day forecast
              </span>
              <div className="flex justify-between gap-1.5 text-center">
                {spot.weather.forecast.map(fc => (
                  <div key={fc.day} className="flex-1 rounded bg-surface-container p-2 border border-outline-variant/50">
                    <span className="block text-[10px] font-bold text-on-surface font-mono">{fc.day}</span>
                    <div className="my-1 flex justify-center">
                      <WeatherIcon
                        name={fc.icon as 'sunny' | 'partly_cloudy_day' | 'cloudy'}
                        size={14}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-secondary">{fc.temp}°C</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-surface-container-low border border-outline-variant p-4 flex flex-col justify-between">
              <div>
                <span className="block font-mono text-[10px] tracking-wider text-secondary uppercase mb-2">
                  Live crowd level
                </span>
                <div className="flex items-end space-x-2 mb-2">
                  <span className="text-3xl font-bold font-display leading-none">{spot.crowdLevel}%</span>
                  <span className="text-xs text-secondary font-mono mb-0.5">occupancy</span>
                </div>
                <div
                  className="h-2 w-full bg-surface-container rounded-full overflow-hidden border border-outline-variant/30"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={spot.crowdLevel}
                  aria-valuetext={`${spot.crowdLevel} percent occupied`}
                >
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

          <div className="mb-6 rounded-xl bg-surface-container-low border border-outline-variant p-4">
            <span className="block font-mono text-[10px] tracking-wider text-secondary uppercase mb-1">
              Location address
            </span>
            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
              {spot.address}
            </p>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 inline-flex items-center text-[10px] font-bold tracking-wider uppercase text-primary hover:underline"
            >
              <span>Get directions</span>
              <ExternalLink size={10} className="ml-1" aria-hidden="true" />
            </a>
          </div>

          <blockquote className="mb-6 border-l-2 border-primary pl-4 py-1">
            <span className="block font-mono text-[10px] tracking-wider text-secondary uppercase mb-1">
              Community intel
            </span>
            <p className="italic text-xs text-on-surface leading-relaxed">
              &ldquo;{spot.communityNote}&rdquo;
            </p>
          </blockquote>

          <div className="mb-4">
            <span className="block font-mono text-[10px] tracking-wider text-secondary uppercase mb-2">
              Spot details
            </span>
            <ul className="flex flex-wrap gap-1.5" aria-label="Spot features">
              {spot.features.map(feature => (
                <li
                  key={feature}
                  className="rounded-full bg-surface-container-high px-2.5 py-1 text-[10px] font-medium text-on-surface border border-outline-variant/60"
                >
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 border-t border-outline-variant pt-4 flex flex-col sm:flex-row gap-2 sm:space-x-3">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex h-10 items-center justify-center space-x-1.5 rounded-lg bg-on-surface text-surface text-xs font-bold tracking-widest uppercase hover:bg-on-surface/90 transition-all shadow-sm"
          >
            <span>Launch route</span>
            <ExternalLink size={12} aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 flex h-10 items-center justify-center rounded-lg border border-outline text-xs font-bold tracking-widest uppercase hover:bg-surface-container transition-all"
          >
            Close info
          </button>
        </div>
      </div>
    </Overlay>
  );
}
