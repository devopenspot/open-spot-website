import type { MetadataRoute } from 'next';
import { getSpots } from '@/lib/spots/loader';

export const dynamic = 'force-static';

const BASE_URL =
  process.env.APP_URL ?? 'https://openspot.example.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/explore`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/map`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/saved`, lastModified: now, changeFrequency: 'never', priority: 0.3 },
    { url: `${BASE_URL}/post`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/sport-events`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  ];

  const spots = await getSpots();
  const spotEntries: MetadataRoute.Sitemap = spots.map(spot => ({
    url: `${BASE_URL}/spots/${spot.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticEntries, ...spotEntries];
}
