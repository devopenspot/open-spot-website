import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Open Spot',
    short_name: 'Open Spot',
    description:
      'High-contrast directory for skateboarders. Discover plazas, DIYs, bowls, ledges, and pools.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f9f9f9',
    theme_color: '#000000',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png', purpose: 'any' },
    ],
  };
}
