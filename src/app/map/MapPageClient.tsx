'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppState } from '@/components/layout/AppStateProvider';
import { getRegions } from '@/lib/spots';
import { MapSkeleton } from './MapSkeleton';

const MapTab = dynamic(
  () => import('@/components/map/MapTab').then(m => m.default),
  { ssr: false, loading: () => <MapSkeleton /> },
);

const REGION_SLUG_TO_NAME: Readonly<Record<string, string>> = {
  americas: 'Americas',
  europe: 'Europe',
  asia: 'Asia',
};

const COUNTRY_SLUG_TO_NAME: Readonly<Record<string, string>> = {
  'united-states': 'United States',
  canada: 'Canada',
  mexico: 'Mexico',
  brazil: 'Brazil',
  argentina: 'Argentina',
  colombia: 'Colombia',
  chile: 'Chile',
  peru: 'Peru',
  france: 'France',
  germany: 'Germany',
  'united-kingdom': 'United Kingdom',
  italy: 'Italy',
  spain: 'Spain',
  netherlands: 'Netherlands',
  portugal: 'Portugal',
  sweden: 'Sweden',
  japan: 'Japan',
  'south-korea': 'South Korea',
  china: 'China',
  thailand: 'Thailand',
  singapore: 'Singapore',
  indonesia: 'Indonesia',
  philippines: 'Philippines',
  malaysia: 'Malaysia',
};

const NAME_TO_REGION_SLUG: Readonly<Record<string, string>> = {
  Americas: 'americas',
  Europe: 'europe',
  Asia: 'asia',
};

const NAME_TO_COUNTRY_SLUG: Readonly<Record<string, string>> = {
  'United States': 'united-states',
  Canada: 'canada',
  Mexico: 'mexico',
  Brazil: 'brazil',
  Argentina: 'argentina',
  Colombia: 'colombia',
  Chile: 'chile',
  Peru: 'peru',
  France: 'france',
  Germany: 'germany',
  'United Kingdom': 'united-kingdom',
  Italy: 'italy',
  Spain: 'spain',
  Netherlands: 'netherlands',
  Portugal: 'portugal',
  Sweden: 'sweden',
  Japan: 'japan',
  'South Korea': 'south-korea',
  China: 'china',
  Thailand: 'thailand',
  Singapore: 'singapore',
  Indonesia: 'indonesia',
  Philippines: 'philippines',
  Malaysia: 'malaysia',
};

export function MapPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { region, country, setRegion, setCountry } = useAppState();
  const [hasInitialized, setHasInitialized] = useState(false);
  const regions = getRegions();
  const validRegionNames = useMemo(
    () => new Set(regions.map((r) => r.name)),
    [regions],
  );
  const validCountryNames = useMemo(
    () => new Set(regions.flatMap((r) => r.countries)),
    [regions],
  );

  useEffect(() => {
    if (hasInitialized) return;
    const paramRegion = searchParams.get('region');
    const paramCountry = searchParams.get('country');
    const nextRegion = paramRegion
      ? REGION_SLUG_TO_NAME[paramRegion.toLowerCase()] ?? null
      : null;
    const nextCountry = paramCountry
      ? COUNTRY_SLUG_TO_NAME[paramCountry.toLowerCase()] ?? null
      : null;
    const safeRegion =
      nextRegion && validRegionNames.has(nextRegion) ? nextRegion : null;
    const safeCountry =
      nextCountry && validCountryNames.has(nextCountry) ? nextCountry : null;
    if (safeRegion !== region) setRegion(safeRegion);
    if (safeCountry !== country) setCountry(safeCountry);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasInitialized(true);
  }, [
    hasInitialized,
    searchParams,
    region,
    country,
    setRegion,
    setCountry,
    validRegionNames,
    validCountryNames,
  ]);

  useEffect(() => {
    if (!hasInitialized) return;
    const params = new URLSearchParams(searchParams.toString());
    const regionSlug = region ? NAME_TO_REGION_SLUG[region] ?? null : null;
    const countrySlug = country ? NAME_TO_COUNTRY_SLUG[country] ?? null : null;

    if (regionSlug) params.set('region', regionSlug);
    else params.delete('region');
    if (countrySlug) params.set('country', countrySlug);
    else params.delete('country');

    const next = params.toString();
    const current = searchParams.toString();
    if (next === current) return;
    router.replace(next ? `/map?${next}` : '/map', { scroll: false });
  }, [hasInitialized, region, country, router, searchParams]);

  return <MapTab />;
}
