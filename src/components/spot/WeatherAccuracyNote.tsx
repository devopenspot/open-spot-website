import { Info } from 'lucide-react';
import { InfoPopover } from '@/components/feedback/InfoPopover';
import { cn } from '@/lib/cn';

interface WeatherAccuracyNoteProps {
  variant: 'block' | 'compact';
  className?: string;
}

const BODY_TEXT =
  'Forecast is approximate — verify on site before heading out.';

export function WeatherAccuracyNote({
  variant,
  className,
}: WeatherAccuracyNoteProps) {
  if (variant === 'block') {
    return (
      <p
        role="note"
        data-testid="weather-accuracy-note-block"
        className={cn(
          'flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-secondary uppercase',
          className,
        )}
      >
        <Info size={12} aria-hidden="true" className="shrink-0" />
        <span>{BODY_TEXT}</span>
      </p>
    );
  }

  return (
    <InfoPopover
      triggerLabel="Forecast accuracy"
      trigger={
        <Info size={10} aria-hidden="true" className="text-secondary" />
      }
      panelClassName={cn('w-56', className)}
    >
      <p className="font-mono text-[9px] tracking-wider text-secondary uppercase mb-1.5">
        Forecast accuracy
      </p>
      <p className="text-[10px] font-medium leading-relaxed text-on-surface">
        {BODY_TEXT}
      </p>
    </InfoPopover>
  );
}
