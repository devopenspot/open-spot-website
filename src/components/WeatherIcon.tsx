import { Sun, CloudSun, Cloud, CloudRain, CloudSnow } from 'lucide-react';
import { cn } from '../utils/cn';

export type WeatherIconName = 'sunny' | 'partly_cloudy_day' | 'cloudy' | 'rain' | 'snow';

interface WeatherIconProps {
  name: WeatherIconName;
  size?: number;
  className?: string;
}

const ICONS: Record<WeatherIconName, { Icon: typeof Sun; className: string; spin: boolean }> = {
  sunny: { Icon: Sun, className: 'text-amber-500', spin: true },
  partly_cloudy_day: { Icon: CloudSun, className: 'text-slate-500', spin: false },
  cloudy: { Icon: Cloud, className: 'text-slate-400', spin: false },
  rain: { Icon: CloudRain, className: 'text-slate-500', spin: false },
  snow: { Icon: CloudSnow, className: 'text-slate-300', spin: false },
};

export function WeatherIcon({ name, size = 20, className }: WeatherIconProps) {
  const { Icon, className: color, spin } = ICONS[name] ?? ICONS.sunny;
  return (
    <Icon
      size={size}
      aria-hidden="true"
      className={cn(color, spin && 'animate-spin-slow', className)}
    />
  );
}
