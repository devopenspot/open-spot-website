import type { MetadataRoute } from 'next';
import { connection } from 'next/server';
import { env } from '@/lib/env';
import { getSpotRepositoryAsync } from '@/lib/repositories';

const BASE_URL = env.APP_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/explore`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/map`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/saved`, lastModified: now, changeFrequency: 'never', priority: 0.3 },
    { url: `${BASE_URL}/sport-events`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  ];

  // The /admin/* dashboard is intentionally absent: it's auth-gated by
  // `requireAdminOrRedirect`, the layout sets `robots: { index: false,
  // follow: false }`, and `src/app/robots.ts` disallows `/admin/` for all
  // user-agents. We keep the static list hand-curated to public pages.

  const repo = await getSpotRepositoryAsync()
  const { items: spots } = await repo.list();
  const spotEntries: MetadataRoute.Sitemap = spots.map(spot => ({
    url: `${BASE_URL}/spots/${spot.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticEntries, ...spotEntries];
}
