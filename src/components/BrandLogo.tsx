import { cn } from '../utils/cn';

interface BrandLogoProps {
  onClick?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function BrandLogo({ onClick, size = 'md', className }: BrandLogoProps) {
  return (
    <button
      id={size === 'md' ? 'brand-logo' : undefined}
      type="button"
      onClick={onClick}
      aria-label="Open Spot home"
      className={cn(
        'flex items-center space-x-2 rounded-sm',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      <span
        className={cn(
          'font-display font-bold tracking-widest text-on-surface uppercase',
          size === 'md' ? 'text-xl sm:text-2xl' : 'text-lg',
        )}
      >
        OPEN SPOT
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'rounded-full bg-primary animate-pulse',
          size === 'md' ? 'h-2 w-2' : 'h-1.5 w-1.5',
        )}
      />
    </button>
  );
}
