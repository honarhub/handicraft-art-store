import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://honarhub.com';

  // 1. Static Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  try {
    // 2. Craft Specialties (Categories)
    const specialties = await prisma.specialty.findMany({
      where: { isApproved: true },
      select: { name: true, createdAt: true },
    });

    const specialtyRoutes: MetadataRoute.Sitemap = specialties.map((spec) => ({
      url: `${baseUrl}/products?specialty=${encodeURIComponent(spec.name)}`,
      lastModified: spec.createdAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // 3. Approved Products
    const products = await prisma.product.findMany({
      where: {
        status: 'APPROVED',
        deletedAt: null,
        artist: { isActive: true, isDeleted: false, verificationLevel: { gte: 2 } },
      },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 5000,
    });

    const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.9,
    }));

    // 4. Approved Artists (Level 2+)
    const artists = await prisma.artistProfile.findMany({
      where: {
        isApproved: true,
        isActive: true,
        isDeleted: false,
        verificationLevel: { gte: 2 },
      },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 2000,
    });

    const artistRoutes: MetadataRoute.Sitemap = artists.map((artist) => ({
      url: `${baseUrl}/artist/${artist.id}`,
      lastModified: artist.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // 5. Published Blog Posts
    const blogPosts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 2000,
    });

    const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [
      ...staticRoutes,
      ...specialtyRoutes,
      ...productRoutes,
      ...artistRoutes,
      ...blogRoutes,
    ];
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    return staticRoutes;
  }
}
