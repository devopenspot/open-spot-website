import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { Inter, Archivo_Narrow } from 'next/font/google';
import { cn } from '@/lib/cn';
import { env } from '@/lib/env';
import {
  getSpotRepositoryAsync,
  getSavedSpotsRepositoryAsync,
  getPresetImagesRepositoryAsync,
} from '@/lib/repositories';
import { getWeatherForAllSpots } from '@/lib/weather/weather-bundle';
import { getServerUserFromCookies } from '@/lib/auth';
import { getRegionsForClient } from '@/lib/data/regions';
import { getSpotTypesForClient } from '@/lib/data/spot-types';
import { SpotsProvider } from '@/components/layout/SpotsProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const archivo = Archivo_Narrow({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-archivo',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: {
    default: 'Open Spot — Discover and map skate spots',
    template: '%s · Open Spot',
  },
  description:
    'Open Spot is a high-contrast, monochrome directory for skateboarders and riders. Discover plazas, DIYs, bowls, ledges, and pools. Save your spots. Share intel.',
  applicationName: 'Open Spot',
  keywords: [
    'skateboarding',
    'skate spots',
    'DIY',
    'plaza',
    'bowl',
    'BMX',
    'street league',
  ],
  authors: [{ name: 'Open Spot' }],
  openGraph: {
    type: 'website',
    siteName: 'Open Spot',
    title: 'Open Spot — Discover and map skate spots',
    description:
      'High-contrast directory for skateboarders. Discover plazas, DIYs, bowls, ledges, and pools.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Open Spot',
    description: 'Discover and map skate spots.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(inter.variable, archivo.variable)}
      suppressHydrationWarning
    >
      <body className="bg-background font-sans text-on-background antialiased">
        <Suspense fallback={null}>
          <RootDataProviders>{children}</RootDataProviders>
        </Suspense>
      </body>
    </html>
  );
}

async function RootDataProviders({ children }: { children: React.ReactNode }) {
  await connection();
  const [spotsResult, initialWeather, initialUser, initialRegions, initialSpotTypes, presetImagesRepo] =
    await Promise.all([
      getSpotRepositoryAsync(),
      getWeatherForAllSpots(),
      getServerUserFromCookies(),
      getRegionsForClient(),
      getSpotTypesForClient(),
      getPresetImagesRepositoryAsync(),
    ]);
  const { items: initialSpots } = await spotsResult.list();
  const initialPresetImages = (await presetImagesRepo.list()).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    url: p.url,
  }));
  // The dev placeholder user (`id === "dev"`) is a first-class citizen of
  // `saved_spots` — the column is `text` (not `uuid`) so "dev" is
  // representable. The dev user has a seeded bucket of all 23 base spots
  // in `src/db/seed-data/saved-spots.ts`. Real Supabase users with a
  // session fetch their own bucket the same way.
  const initialSavedSpots = (
    await (await getSavedSpotsRepositoryAsync()).list(initialUser.id, {
      limit: 200,
    })
  ).items
  return (
    <SpotsProvider
      initialSpots={initialSpots}
      initialRegions={initialRegions}
      initialPresetImages={initialPresetImages}
      initialSpotTypes={initialSpotTypes}
      initialWeather={initialWeather}
      initialUser={initialUser}
      initialSavedSpots={initialSavedSpots}
    >
      {children}
    </SpotsProvider>
  );
}
