import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';
import RelatedProductsCarousel, { RelatedProductItem } from '@/app/components/RelatedProductsCarousel';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let post = null;
  try {
    post = await prisma.blogPost.findUnique({
      where: { slug, isPublished: true }
    });
  } catch (error) {
    console.error('Error fetching blog post in generateMetadata:', error);
  }

  if (!post) {
    return { title: 'پیدا نشد | هنرهاب' };
  }

  const meta = post.seoMeta as any;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://honarhub.com';
  const coverUrl = post.coverImage ? (post.coverImage.startsWith('http') ? post.coverImage : `${baseUrl}${post.coverImage}`) : undefined;

  return {
    title: meta?.title || `${post.title} | مجله هنرهاب`,
    description: meta?.description || post.excerpt,
    keywords: meta?.keywords || post.tags.join(', '),
    openGraph: {
      title: meta?.title || post.title,
      description: meta?.description || post.excerpt,
      type: 'article',
      url: `${baseUrl}/blog/${post.slug}`,
      publishedTime: post.publishedAt.toISOString(),
      tags: post.tags,
      images: coverUrl ? [{ url: coverUrl, alt: post.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: meta?.title || post.title,
      description: meta?.description || post.excerpt,
      images: coverUrl ? [coverUrl] : undefined,
    }
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  
  let post = null;
  try {
    post = await prisma.blogPost.findUnique({
      where: { slug, isPublished: true },
      include: {
        specialty: true,
        artistProfile: {
          include: {
            user: { select: { name: true } }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching blog post in BlogPostPage:', error);
  }

  if (!post) {
    notFound();
  }

  // 1. Fetch related products:
  // Either by post's specialty, or by post's artist, or matching by tags/specialties
  let relatedProductsQuery: any = {
    status: 'APPROVED',
    deletedAt: null,
    artist: {
      isActive: true,
      isDeleted: false
    }
  };

  if (post.artistProfileId) {
    // If post is about a specific artist
    relatedProductsQuery.artistId = post.artistProfileId;
  } else if (post.specialtyId) {
    // If post is about a specific craft/specialty
    relatedProductsQuery.specialties = {
      some: { id: post.specialtyId }
    };
  } else if (post.tags && post.tags.length > 0) {
    // Match by specialty name in tags
    relatedProductsQuery.specialties = {
      some: {
        name: { in: post.tags }
      }
    };
  }

  let dbProducts = await prisma.product.findMany({
    where: relatedProductsQuery,
    take: 12,
    include: {
      artist: { include: { user: { select: { name: true } } } },
      specialties: { select: { name: true } },
      pricingTiers: { orderBy: { price: 'asc' }, take: 1 }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Fallback: If no products found for this specific specialty, fetch top approved craft products
  if (dbProducts.length === 0) {
    dbProducts = await prisma.product.findMany({
      where: {
        status: 'APPROVED',
        deletedAt: null,
        artist: { isActive: true, isDeleted: false }
      },
      take: 8,
      include: {
        artist: { include: { user: { select: { name: true } } } },
        specialties: { select: { name: true } },
        pricingTiers: { orderBy: { price: 'asc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Map to RelatedProductItem
  const carouselProducts: RelatedProductItem[] = dbProducts.map(p => ({
    id: p.id,
    title: p.title,
    imageUrl: p.imageUrl,
    stockQuantity: p.stockQuantity,
    isUnique: p.isUnique,
    isPreOrderEnabled: p.isPreOrderEnabled,
    price: p.pricingTiers[0]?.price || 0,
    artistName: p.artist.user.name || 'هنرمند اصیل',
    specialtyName: p.specialties[0]?.name
  }));

  // Generate JSON-LD for AI Bots (AIO) and Google SEO
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://honarhub.com';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || (post.seoMeta as any)?.description,
    image: post.coverImage ? (post.coverImage.startsWith('http') ? post.coverImage : `${baseUrl}${post.coverImage}`) : undefined,
    author: {
      '@type': 'Organization',
      name: 'هنرهاب (HonarHub)',
      url: baseUrl
    },
    publisher: {
      '@type': 'Organization',
      name: 'هنرهاب',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`
      }
    },
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    keywords: post.tags.join(', ')
  };

  const carouselTitle = post.artistProfile
    ? `آثار اصیل ${post.artistProfile.user.name} در هنرهاب`
    : post.specialty
    ? `شاهکارهای دست‌ساز هنر ${post.specialty.name}`
    : 'آثار برگزیده و مرتبط در هنرهاب';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans" dir="rtl">
      <SiteHeader />

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 pb-24">
        {/* Article Hero Banner with Cover */}
        <section className="relative w-full bg-slate-950 text-white overflow-hidden py-16 md:py-24 border-b border-emerald-900/30">
          {post.coverImage && (
            <div className="absolute inset-0 z-0 opacity-25">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover blur-md scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
            </div>
          )}

          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            {/* Breadcrumb / Tags */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <Link href="/blog" className="text-xs font-bold bg-white/10 hover:bg-white/20 text-emerald-300 px-3 py-1 rounded-full backdrop-blur-md transition">
                ← بازگشت به وبلاگ
              </Link>
              {post.tags.map(tag => (
                <span key={tag} className="text-xs font-medium bg-emerald-950/80 text-emerald-300 px-3 py-1 rounded-full border border-emerald-700/50 backdrop-blur-md">
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-6 tracking-tight">
              {post.title}
            </h1>

            <div className="text-slate-400 text-xs md:text-sm flex items-center justify-center gap-4">
              <time dateTime={post.publishedAt.toISOString()}>
                انتشار: {new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(post.publishedAt)}
              </time>
              <span>•</span>
              <span className="text-emerald-400 font-bold">مجله فرهنگی هنرهاب</span>
              {post.specialty && (
                <>
                  <span>•</span>
                  <span>هنر {post.specialty.name}</span>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Article Body */}
        <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-20">
          <div className="bg-white rounded-3xl p-8 md:p-14 shadow-xl shadow-slate-200/50 border border-slate-100">
            {/* Featured Cover Card */}
            {post.coverImage && (
              <div className="mb-12 rounded-2xl overflow-hidden shadow-lg border border-slate-100 max-h-[480px]">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Excerpt Lead */}
            {post.excerpt && (
              <div className="p-6 bg-emerald-50/70 border-r-4 border-emerald-600 rounded-2xl mb-10 text-emerald-950 text-base md:text-lg font-medium leading-relaxed">
                {post.excerpt}
              </div>
            )}

            {/* Main Content Render */}
            <div 
              className="prose prose-lg prose-slate max-w-none prose-headings:font-black prose-headings:text-slate-900 prose-p:leading-loose prose-p:text-slate-700 prose-a:text-emerald-600 hover:prose-a:text-emerald-700 prose-img:rounded-2xl prose-img:shadow-md prose-img:mx-auto"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Related Products Carousel */}
            <RelatedProductsCarousel
              products={carouselProducts}
              title={carouselTitle}
              subtitle="برای مشاهده مشخصات، قیمت و سفارش هر اثر در تب جدید روی آن کلیک کنید."
            />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
