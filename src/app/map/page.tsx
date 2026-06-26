import { MapPageClient } from './MapPageClient';

export const metadata = {
  title: 'Spot Map',
  description:
    'Browse the Los Angeles skate grid. Filter by terrain, find ledges, plazas, and DIYs.',
};

export default function MapPage() {
  return <MapPageClient />;
}
