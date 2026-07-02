import type { Metadata, Viewport } from 'next';
import { Inter, Archivo_Narrow } from 'next/font/google';
import { cn } from '@/lib/cn';
import { getSpotRepository } from '@/lib/repositories';
import { getWeatherForAllSpots } from '@/lib/weather/weather-bundle';
import { SpotsProvider } from '@/components/layout/SpotsProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const archivo = Archivo_Narrow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-archivo',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.APP_URL ?? 'https://openspot.example.com',
  ),
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [spotsResult, initialWeather] = await Promise.all([
    getSpotRepository().list(),
    getWeatherForAllSpots(),
  ]);
  const initialSpots = spotsResult.items;
  return (
    <html
      lang="en"
      className={cn(inter.variable, archivo.variable)}
      suppressHydrationWarning
    >
      <body className="bg-background font-sans text-on-background antialiased">
        <SpotsProvider initialSpots={initialSpots} initialWeather={initialWeather}>
          {children}
        </SpotsProvider>
      </body>
    </html>
  );
}
