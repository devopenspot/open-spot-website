import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import type { Metadata } from 'next';
import { getSpotRepositoryAsync } from '@/lib/repositories';
import { getSpotDistanceLabel } from '@/lib/spots/geo';
import { SpotDetailsFullPage } from '@/components/spot/SpotDetailsFullPage';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  await connection();
  const { id } = await params;
  const spot = await (await getSpotRepositoryAsync()).findById(id);
  if (!spot) {
    return { title: 'Spot not found' };
  }
  return {
    title: spot.name,
    description: `${spot.type} spot in ${spot.city} — ${getSpotDistanceLabel(spot).toLowerCase()}.`,
    openGraph: {
      title: spot.name,
      description: `${spot.type} skate spot in ${spot.city}.`,
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
  const spot = await (await getSpotRepositoryAsync()).findById(id);
  if (!spot) {
    notFound();
  }
  return <SpotDetailsFullPage spot={spot} />;
}
