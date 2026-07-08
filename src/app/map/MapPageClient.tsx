'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { MapSkeleton } from './MapSkeleton';

const MapTab = dynamic(
  () => import('@/components/map/MapTab').then(m => m.default),
  { ssr: false, loading: () => <MapSkeleton /> },
);

export function MapPageClient() {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <MapPageInner />
    </Suspense>
  );
}

function MapPageInner() {
  const searchParams = useSearchParams();
  const nearbyRequested = searchParams.get('nearby') === '1';
  return <MapTab searchParams={searchParams} nearbyRequested={nearbyRequested} />;
}
