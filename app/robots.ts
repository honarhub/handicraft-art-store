import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://honarhub.com';

  const disallowList = [
    '/admin/',
    '/artist-panel/',
    '/panel/',
    '/api/',
    '/checkout/',
    '/forgot-password/',
    '/login/',
  ];

  return {
    rules: [
      // 1. General search engines (Google, Bing, etc.)
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowList,
      },
      // 2. Generative AI Crawlers (GEO - OpenAI, Perplexity, Anthropic, Gemini, Apple)
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'PerplexityBot',
          'ClaudeBot',
          'anthropic-ai',
          'Google-Extended',
          'Applebot-Extended',
          'cohere-ai',
        ],
        allow: [
          '/',
          '/products',
          '/product/',
          '/artist/',
          '/blog',
          '/about',
          '/support',
          '/terms',
          '/llms.txt',
          '/llms-full.txt',
        ],
        disallow: disallowList,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
