import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EarnXpress — Full-Stack Freelance Task Marketplace',
    short_name: 'EarnXpress',
    description:
      'Verified crowdsourcing and freelance micro-task platform with automated escrow protection and instant payouts.',
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
