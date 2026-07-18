import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import { listSpots, findSpotById } from '@/lib/services/spots';
import { getWeatherForAllSpots } from '@/lib/weather/weather-bundle';
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
  const [spot, allSpotsList] = await Promise.all([
    findSpotById(id),
    listSpots(),
  ]);
  if (!spot) {
    return { title: 'Spot not found' };
  }
  const typeList = spot.types.map((t) => t.name).join(', ');
  const dateLabel = formatOgDate(new Date());
  const weatherById = await getWeatherForAllSpots(allSpotsList.items);
  const w = weatherById[spot.id];
  const weatherLabel = w ? `${w.current}°C ${w.description}` : null;
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
  const spot = await findSpotById(id);
  if (!spot) {
    notFound();
  }
  return <SpotDetailsFullPage spot={spot} />;
}
