import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://earnxpress-marketplace.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/tasks',
          '/tasks/*',
          '/about',
          '/help',
          '/contact',
          '/terms',
          '/privacy',
          '/kyc',
          '/login',
          '/register',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/worker/tasks/*/workspace',
          '/buyer/tasks/new',
          '/api/*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
