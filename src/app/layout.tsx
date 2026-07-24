import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Inter, Archivo_Narrow, Geist } from "next/font/google";
import { cn } from "@/lib/cn";
import { env } from "@/lib/env";
import { listSpots } from "@/lib/services/spots";
import { listSavedSpotsForUser } from "@/lib/services/saved-spots";
import { listRegions } from "@/lib/services/regions";
import { listSpotTypes } from "@/lib/services/spot-types";
import { getWeatherForAllSpots } from "@/lib/weather/weather-bundle";
import { getServerUserFromCookies } from "@/lib/auth";
import { getDbPoolMax } from "@/lib/db/client";
import { withDbConcurrency } from "@/lib/db/concurrency";
import { SpotsProvider } from "@/components/explore/SpotsProvider";
import "./globals.css";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const archivo = Archivo_Narrow({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: {
    default: "Open Spot — Discover and map skate spots",
    template: "%s · Open Spot",
  },
  description:
    "Open Spot is a high-contrast, monochrome directory for skateboarders and riders. Discover plazas, DIYs, bowls, ledges, and pools. Save your spots. Share intel.",
  applicationName: "Open Spot",
  keywords: [
    "skateboarding",
    "skate spots",
    "DIY",
    "plaza",
    "bowl",
    "BMX",
    "street league",
  ],
  authors: [{ name: "Open Spot" }],
  openGraph: {
    type: "website",
    siteName: "Open Spot",
    title: "Open Spot — Discover and map skate spots",
    description:
      "High-contrast directory for skateboarders. Discover plazas, DIYs, bowls, ledges, and pools.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Spot",
    description: "Discover and map skate spots.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(inter.variable, archivo.variable, "font-sans", geist.variable)}
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
  // The spots list is fetched once and shared with the weather
  // derivation — the BFF pattern. `getWeatherForAllSpots(spots)`
  // derives the per-spot weather from the already-fetched spots,
  // so we no longer pay for a second `spots.list()` round trip.
  const poolMax = getDbPoolMax();
  const [spotsList, initialUser, initialRegions, initialSpotTypes] =
    await withDbConcurrency(poolMax, [
      () => listSpots(),
      () => getServerUserFromCookies(),
      () => listRegions(),
      () => listSpotTypes(),
    ]);
  const initialSpots = spotsList.items;
  const [initialWeather, savedSpotsResult] = await withDbConcurrency(poolMax, [
    () => getWeatherForAllSpots(initialSpots),
    () =>
      initialUser
        ? listSavedSpotsForUser(initialUser.id, { limit: 200 })
        : Promise.resolve({ items: [], nextCursor: null }),
  ]);
  const initialSavedSpots = savedSpotsResult.items;
  return (
    <SpotsProvider
      initialSpots={initialSpots}
      initialRegions={initialRegions}
      initialSpotTypes={initialSpotTypes}
      initialWeather={initialWeather}
      initialUser={initialUser}
      initialSavedSpots={initialSavedSpots}
    >
      {children}
    </SpotsProvider>
  );
}
