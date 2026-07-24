import { connection } from 'next/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass } from 'lucide-react';
import { findSpotById } from '@/lib/services/spots';
import { getSpotWeather } from '@/lib/weather/weather-cached';
import { EMPTY_WEATHER, withSafeDefault } from '@/lib/safe-fetch';
import { SpotDetailsFullPage } from '@/components/spot/SpotDetailsFullPage';

const OG_DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
const OG_MONTH_NAMES = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
] as const;

function formatOgDate(d: Date): string {
  const day = OG_DAY_NAMES[d.getDay()] ?? 'MON';
  const month = OG_MONTH_NAMES[d.getMonth()] ?? 'JAN';
  const dayOfMonth = String(d.getDate()).padStart(2, '0');
  return `${day} · ${dayOfMonth} ${month} ${d.getFullYear()}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  await connection();
  const { id } = await params;
  const spot = await withSafeDefault(
    () => findSpotById(id),
    null,
    'findSpotById',
  );
  if (!spot) {
    return { title: 'Spot unavailable' };
  }
  const typeList = spot.types.map((t) => t.name).join(', ');
  const dateLabel = formatOgDate(new Date());
  const w = await withSafeDefault(
    () =>
      getSpotWeather({
        spotId: spot.id,
        latitude: spot.location.lat,
        longitude: spot.location.lon,
      }),
    EMPTY_WEATHER,
    'getSpotWeather',
  );
  const weatherLabel =
    w.current != null ? `${w.current}°C ${w.description}` : null;
  const description = [typeList, weatherLabel, dateLabel]
    .filter(Boolean)
    .join(' · ');
  return {
    title: spot.name,
    description,
    openGraph: {
      title: spot.name,
      description,
      images: [{ url: spot.image }],
    },
  };
}

export default async function SpotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const spot = await withSafeDefault(
    () => findSpotById(id),
    null,
    'findSpotById',
  );
  if (!spot) {
    return <SpotUnavailableFallback />;
  }
  return <SpotDetailsFullPage spot={spot} />;
}

function SpotUnavailableFallback() {
  return (
    <div
      role="alert"
      className="min-h-[60vh] flex items-center justify-center p-6"
    >
      <div className="mx-auto my-12 max-w-md rounded-none-none border border-outline-variant bg-surface-bright p-6 text-center">
        <span className="font-mono text-[10px] font-bold tracking-widest text-secondary uppercase block mb-3">
          503 · Off the grid
        </span>
        <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-on-surface">
          Plot temporarily unavailable
        </h1>
        <p className="mt-2 text-xs text-secondary leading-relaxed">
          We can&rsquo;t reach the directory right now. Try again in a moment.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center space-x-2 rounded-none-none bg-on-surface text-surface px-5 py-2 text-xs font-bold tracking-widest uppercase hover:bg-on-surface/90 transition-all"
        >
          <Compass size={14} aria-hidden="true" />
          <span>Back to directory</span>
        </Link>
      </div>
    </div>
  );
}
