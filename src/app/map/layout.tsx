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
import {
	EMPTY_SAVED_SPOTS,
	EMPTY_SPOT_LIST,
	withSafeDefault,
} from "@/lib/safe-fetch";
import type { Region, SpotTypeEntity } from "@/lib/types";
import type { SpotWeather } from "@/lib/weather/weather-cached";
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
  // Each fan-out thunk is wrapped in `withSafeDefault` so a single DB
  // call failing (bad env, paused project, network partition) cannot
  // crash the whole layout — see AGENTS.md "anonymous browsing works
  // even when Supabase env is missing."
  const [spotsList, initialUser, initialRegions, initialSpotTypes] =
    await withDbConcurrency(poolMax, [
      () => withSafeDefault(() => listSpots(), EMPTY_SPOT_LIST, "listSpots"),
      () =>
        withSafeDefault(
          () => getServerUserFromCookies(),
          null,
          "getServerUserFromCookies",
        ),
      () =>
        withSafeDefault(
          () => listRegions(),
          [] as readonly Region[],
          "listRegions",
        ),
      () =>
        withSafeDefault(
          () => listSpotTypes(),
          [] as readonly SpotTypeEntity[],
          "listSpotTypes",
        ),
    ]);
  const initialSpots = spotsList.items;
  const [initialWeather, savedSpotsResult] = await withDbConcurrency(poolMax, [
    () =>
      withSafeDefault(
        () => getWeatherForAllSpots(initialSpots),
        {} as Record<string, SpotWeather>,
        "getWeatherForAllSpots",
      ),
    () =>
      initialUser
        ? withSafeDefault(
            () => listSavedSpotsForUser(initialUser.id, { limit: 200 }),
            EMPTY_SAVED_SPOTS,
            "listSavedSpotsForUser",
          )
        : Promise.resolve(EMPTY_SAVED_SPOTS),
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
