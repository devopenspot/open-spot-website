import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

export const dynamic = 'force-static';

const BASE_URL = env.APP_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
