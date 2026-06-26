import { memo, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { Spot } from '../types';
import { cn } from '../utils/cn';

interface MapPinButtonProps {
  spot: Spot;
  active: boolean;
  onToggle: (spot: Spot) => void;
}

function MapPinButtonImpl({ spot, active, onToggle }: MapPinButtonProps) {
  const handleClick = useCallback(() => onToggle(spot), [onToggle, spot]);

  return (
    <div
      id={`map-pin-${spot.id}`}
      className="absolute"
      style={{ left: `${spot.coordinates.x}%`, top: `${spot.coordinates.y}%` }}
    >
      <div className="relative -left-3 -top-3">
        {active && (
          <span
            aria-hidden="true"
            className="absolute -inset-2 rounded-full bg-primary/20 animate-ping duration-1000"
          />
        )}
        <button
          type="button"
          onClick={handleClick}
          aria-pressed={active}
          aria-label={`${active ? 'Hide' : 'Show'} details for ${spot.name}`}
          className={cn(
            'h-6 w-6 rounded-full flex items-center justify-center transition-all shadow-md',
            active
              ? 'bg-primary text-surface scale-125 border-2 border-surface'
              : 'bg-surface border border-outline hover:border-primary hover:scale-110 text-on-surface',
          )}
        >
          <MapPin size={11} aria-hidden="true" className={active ? 'fill-current' : ''} />
        </button>
      </div>
    </div>
  );
}

export const MapPinButton = memo(MapPinButtonImpl);
