'use client';

import dynamic from 'next/dynamic';
import { MapSkeleton } from './MapSkeleton';

const MapTab = dynamic(
  () => import('@/components/map/MapTab').then(m => m.default),
  { ssr: false, loading: () => <MapSkeleton /> },
);

export function MapPageClient() {
  return <MapTab />;
}
