import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://honarhub.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/artist-panel/',
          '/api/',
          '/checkout/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
