import { memo, useCallback, type KeyboardEvent } from 'react';
import { Heart, Trash2, MapPin } from 'lucide-react';
import { Spot } from '../types';
import { cn } from '../utils/cn';

export type SpotCardVariant = 'explore' | 'saved' | 'search';

interface SpotCardProps {
  spot: Spot;
  isSaved: boolean;
  onOpen: (spot: Spot) => void;
  onToggleSave: (id: string) => void;
  variant?: SpotCardVariant;
  className?: string;
}

const ROOT_CLASSES =
  'group relative flex w-full flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-bright text-left shadow-sm transition-all hover:shadow-md focus-within:shadow-md';

const HOVER_BAR_CLASSES =
  'mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between text-[10px] font-mono';

const TOGGLE_BASE_CLASSES =
  'absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition-all hover:scale-105';

const TOGGLE_SAVED_CLASSES = 'border-primary bg-primary text-surface';
const TOGGLE_DEFAULT_CLASSES =
  'border-outline-variant bg-white/80 text-on-surface backdrop-blur-sm hover:bg-white';

const TYPE_BADGE_CLASSES =
  'absolute bottom-3 left-3 rounded bg-black/60 px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase text-white backdrop-blur-sm';

function toggleAriaLabel(spot: Spot, isSaved: boolean, variant: SpotCardVariant): string {
  if (variant === 'saved' || isSaved) {
    return `Remove ${spot.name} from saved spots`;
  }
  return `Save ${spot.name}`;
}

function SpotCardImpl({
  spot,
  isSaved,
  onOpen,
  onToggleSave,
  variant = 'explore',
  className,
}: SpotCardProps) {
  const handleOpen = useCallback(() => onOpen(spot), [onOpen, spot]);

  const handleCardClick = useCallback(() => handleOpen(), [handleOpen]);
  const handleCardKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpen();
      }
    },
    [handleOpen],
  );

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleSave(spot.id);
    },
    [onToggleSave, spot.id],
  );

  const showRemoveIcon = variant === 'saved';
  const ToggleIcon = showRemoveIcon ? Trash2 : Heart;
  const toggleIconClass = showRemoveIcon
    ? isSaved
      ? ''
      : 'text-red-600'
    : isSaved
      ? 'fill-surface'
      : '';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      aria-label={`Open ${spot.name} in ${spot.city} (${spot.type} spot)`}
      className={cn(ROOT_CLASSES, className)}
    >
      <div className="relative h-48 w-full overflow-hidden bg-black/5">
        <img
          src={spot.image}
          alt=""
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover filter grayscale transition-transform duration-500 ease-out group-hover:scale-105"
        />

        <button
          type="button"
          onClick={handleToggle}
          aria-pressed={isSaved}
          aria-label={toggleAriaLabel(spot, isSaved, variant)}
          className={cn(
            TOGGLE_BASE_CLASSES,
            isSaved ? TOGGLE_SAVED_CLASSES : TOGGLE_DEFAULT_CLASSES,
          )}
        >
          <ToggleIcon size={14} aria-hidden="true" className={toggleIconClass} />
        </button>

        <span aria-hidden="true" className={TYPE_BADGE_CLASSES}>
          {spot.type}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <span className="font-mono text-[9px] font-bold text-secondary uppercase tracking-wider block mb-1">
            {spot.distance}
          </span>
          <h3 className="font-display text-base font-bold tracking-wide text-on-surface uppercase group-hover:underline">
            {spot.name}
          </h3>
          <p className="mt-1 text-xs text-secondary flex items-center">
            <MapPin size={11} className="mr-1 shrink-0" aria-hidden="true" />
            {spot.city}
          </p>
        </div>

        <div className={HOVER_BAR_CLASSES}>
          <div className="flex items-center space-x-1">
            <span
              aria-hidden="true"
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                spot.crowdLevel > 70 ? 'bg-amber-600 animate-pulse' : 'bg-primary',
              )}
            />
            <span className="text-secondary uppercase">CROWD: {spot.crowdLevel}%</span>
          </div>
          <span aria-hidden="true" className="text-primary font-semibold uppercase">
            View details
          </span>
        </div>
      </div>
    </div>
  );
}

export const SpotCard = memo(SpotCardImpl);
