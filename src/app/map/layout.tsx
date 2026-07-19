import { Suspense } from "react";
import { connection } from "next/server";
import { listSpots } from "@/lib/services/spots";
import { listSavedSpotsForUser } from "@/lib/services/saved-spots";
import { listRegions } from "@/lib/services/regions";
import { listSpotTypes } from "@/lib/services/spot-types";
import { getWeatherForAllSpots } from "@/lib/weather/weather-bundle";
import { getServerUserFromCookies } from "@/lib/auth";
import { getDbPoolMax } from "@/lib/db/client";
import { withDbConcurrency } from "@/lib/db/concurrency";
import { MapProvider } from "@/components/map/MapProvider";
import { MapShell } from "@/components/map/MapShell";

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <MapDataProviders>{children}</MapDataProviders>
    </Suspense>
  );
}

async function MapDataProviders({ children }: { children: React.ReactNode }) {
  await connection();
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
    <MapProvider
      initialSpots={initialSpots}
      initialRegions={initialRegions}
      initialSpotTypes={initialSpotTypes}
      initialWeather={initialWeather}
      initialUser={initialUser}
      initialSavedSpots={initialSavedSpots}
    >
      <MapShell>{children}</MapShell>
    </MapProvider>
  );
}
