import { MapPageClient } from './MapPageClient';

export const metadata = {
  title: 'Spot Map',
  description:
    'Browse the global skate grid. Filter by region or country, find ledges, plazas, bowls, and DIYs.',
};

export default function MapPage() {
  return <MapPageClient />;
}
