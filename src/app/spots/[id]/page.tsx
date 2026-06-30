import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSpots, getSpotById } from '@/lib/spots/loader';
import { SpotDetailsFullPage } from '@/components/spot/SpotDetailsFullPage';

export async function generateStaticParams() {
  const spots = await getSpots();
  return spots.map(spot => ({ id: spot.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const spot = await getSpotById(id);
  if (!spot) {
    return { title: 'Spot not found' };
  }
  return {
    title: spot.name,
    description: `${spot.type} spot in ${spot.city} — ${spot.distance.toLowerCase()}. ${spot.communityNote}`,
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
  const { id } = await params;
  const spot = await getSpotById(id);
  if (!spot) {
    notFound();
  }
  return <SpotDetailsFullPage spot={spot} />;
}
