import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSpotRepository } from '@/lib/repositories';
import { getSpotDistanceLabel } from '@/lib/spots/geo';
import { SpotDetailsFullPage } from '@/components/spot/SpotDetailsFullPage';

export async function generateStaticParams() {
  const { items } = await getSpotRepository().list();
  return items.map(spot => ({ id: spot.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const spot = await getSpotRepository().findById(id);
  if (!spot) {
    return { title: 'Spot not found' };
  }
  return {
    title: spot.name,
    description: `${spot.type} spot in ${spot.city} — ${getSpotDistanceLabel(spot).toLowerCase()}. ${spot.communityNote}`,
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
  const spot = await getSpotRepository().findById(id);
  if (!spot) {
    notFound();
  }
  return <SpotDetailsFullPage spot={spot} />;
}
