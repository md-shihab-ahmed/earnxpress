import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EarnXpress - Earn Money Online & Microtasks',
    short_name: 'EarnXpress',
    description:
      'Earn money online by completing simple microtasks, data annotation, app testing, and surveys with instant Binance Pay & bKash payouts.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0d9488',
    orientation: 'portrait-primary',
    categories: ['finance', 'business', 'productivity', 'lifestyle'],
    icons: [
      {
        src: '/icon?size=192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon?size=512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
