import React from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { Metadata } from 'next';
import ProductGallery from './ProductGallery';
import ExpandableDescription from './ExpandableDescription';
import ProductPurchaseSection from './ProductPurchaseSection';
import ProductRatingBadge from './ProductRatingBadge';
import ProductActionButtons from './ProductActionButtons';
import ProductReviewsAndQA from './ProductReviewsAndQA';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';

export const dynamic = 'force-dynamic';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://honarhub.com';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        artist: { include: { user: true } },
        specialties: true,
        pricingTiers: true,
      },
    });

    if (!product || product.deletedAt) {
      return {
        title: 'محصول یافت نشد',
        description: 'این اثر هنری در دسترس نیست یا حذف شده است.',
      };
    }

    const artistName = product.artist.brandName || product.artist.user.name || 'هنرمند مستقل';
    const cleanDesc = (product.description || '').replace(/\s+/g, ' ').substring(0, 160);
    const specialtyNames = product.specialties.map((s) => s.name).join('، ');
    const allMedia = product.mediaUrls && product.mediaUrls.length > 0
      ? product.mediaUrls
      : (product.imageUrl ? [product.imageUrl] : []);

    const imageUrls = allMedia.map((url) => {
      if (url.startsWith('http')) return url;
      return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    });

    const pageTitle = `${product.title} اثر استاد ${artistName} | هنرهاب`;
    const pageDescription = cleanDesc || `خرید مستقیم دست‌سازه اصیل ${product.title} در رشته ${specialtyNames} با شناسنامه اصالت دیجیتال از استاد ${artistName} در هنرهاب.`;

    return {
      title: pageTitle,
      description: pageDescription,
      keywords: [
        product.title,
        artistName,
        ...product.specialties.map((s) => s.name),
        'صنایع دستی ایران',
        'دست‌سازه اصیل',
        'خرید مستقیم از هنرمند',
        'هنرهاب',
      ],
      alternates: {
        canonical: `${baseUrl}/product/${product.id}`,
      },
      openGraph: {
        type: 'article',
        locale: 'fa_IR',
        url: `${baseUrl}/product/${product.id}`,
        siteName: 'هنرهاب | HonarHub',
        title: pageTitle,
        description: pageDescription,
        images: imageUrls.map((url) => ({
          url,
          width: 800,
          height: 800,
          alt: product.title,
        })),
      },
      twitter: {
        card: 'summary_large_image',
        title: pageTitle,
        description: pageDescription,
        images: imageUrls.length > 0 ? [imageUrls[0]] : ['/og-image.png'],
      },
    };
  } catch (err) {
    console.error('Error generating metadata for product:', err);
    return {
      title: 'اثر هنری | هنرهاب',
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id },
    include: { 
      artist: { include: { user: true } }, 
      specialties: true, 
      pricingTiers: true,
      reviews: { select: { rating: true } }
    }
  });

  if (!product || product.deletedAt || !product.artist.isActive || product.artist.isDeleted) {
    notFound();
  }

  // If product is deactivated, pending, or artist is not yet Level 2, allow preview only for admin & owner
  if (product.status !== 'APPROVED' || (product.artist.verificationLevel || 0) < 2) {
    const session = await getServerSession(authOptions);
    const isOwner = session?.user?.id === product.artist.userId;
    const isAdmin = session?.user?.role === 'ADMIN';
    if (!isAdmin && !isOwner) {
      notFound();
    }
  }

  // Calculate average rating
  const reviewCount = product.reviews.length;
  const avgRating = reviewCount > 0 
    ? (product.reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount).toFixed(1) 
    : null;

  const allMedia = product.mediaUrls && product.mediaUrls.length > 0 ? product.mediaUrls : (product.imageUrl ? [product.imageUrl] : []);
  const basePrice = product.pricingTiers[0]?.price || 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans" dir="rtl">
      {/* Product & Breadcrumb JSON-LD Structured Data for Google Rich Snippets & AI Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            description: (product.description || '').replace(/\s+/g, ' ').substring(0, 300),
            image: allMedia.map((u) => u.startsWith('http') ? u : `${baseUrl}${u.startsWith('/') ? '' : '/'}${u}`),
            category: product.specialties.map((s) => s.name).join(', '),
            brand: {
              '@type': 'Brand',
              name: product.artist.brandName || product.artist.user.name || 'هنرهاب',
            },
            offers: {
              '@type': 'Offer',
              price: basePrice,
              priceCurrency: 'IRT',
              priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              availability: product.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              url: `${baseUrl}/product/${product.id}`,
              seller: {
                '@type': 'Person',
                name: product.artist.user.name || product.artist.brandName || 'استاد صنایع دستی',
              },
            },
            ...(avgRating && reviewCount > 0 ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: avgRating,
                reviewCount: reviewCount,
                bestRating: '5',
                worstRating: '1',
              },
            } : {}),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'هنرهاب',
                item: baseUrl,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'محصولات و دست‌سازه‌ها',
                item: `${baseUrl}/products`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: product.title,
                item: `${baseUrl}/product/${product.id}`,
              },
            ],
          }),
        }}
      />

      <SiteHeader />
      {product.status !== 'APPROVED' && (
        <div className="bg-amber-500 text-white p-3 text-center text-sm font-bold shadow-md z-40">
          ⚠️ حالت پیش‌نمایش ({product.status === 'REJECTED' ? 'غیرفعال شده توسط مدیریت' : 'در انتظار تایید مدیریت'}): این محصول برای عموم کاربران مخفی است و فقط برای شما قابل مشاهده می‌باشد.
        </div>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto py-10 px-4 sm:px-6 md:px-12">
        
        {/* Main Product Card */}
        <div className="flex flex-col lg:flex-row gap-10 bg-white rounded-3xl p-6 sm:p-8 md:p-12 shadow-sm border border-slate-200">
          
          {/* Right/Top: Image Gallery */}
          <div className="lg:w-1/2">
            <div className="sticky top-28">
              <ProductGallery mediaUrls={allMedia} title={product.title} />
            </div>
          </div>

          {/* Left/Bottom: Product Info & Purchase */}
          <div className="lg:w-1/2 flex flex-col">
            
            {/* Top Trust Badge & Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                {product.shippingMode === 'HONARHUB_WAREHOUSE' ? (
                  /* اگر ارسال از انبار مرکزی هنرهاب بود: عنوان ارسال از کارگاه حذف و عنوان ۱۰۰ درصد تضمین اصالت با رنگ سبز نمایش داده می‌شود */
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-2xs">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                    <span>۱۰۰٪ تضمین اصالت اثر توسط هنرهاب</span>
                  </div>
                ) : (
                  /* اگر ارسال مستقیم از کارگاه بود: همان جای قبلی با همان رنگ سبز و آیکون کارگاه/پست بدون عنوان ۱۰۰ درصد تضمین */
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-2xs">
                    {/* لوگو کارگاه و ارسال پستی اثر */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    <span>ارسال مستقیم از کارگاه هنرمند</span>
                  </div>
                )}

                {/* Rating Quick Badge */}
                {avgRating && (
                  <ProductRatingBadge avgRating={avgRating} reviewCount={reviewCount} />
                )}
              </div>

              {/* Wishlist and Share */}
              <ProductActionButtons productId={product.id} title={product.title} />
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight">
              {product.title}
            </h1>

            {/* Artist Mini Card */}
            <a href={`/artist/${product.artist.displayId}`} className="flex items-center gap-3.5 mb-6 pb-6 border-b border-slate-100 group w-fit transition-all">
              <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border-2 border-slate-200 group-hover:border-emerald-500 transition-colors shadow-xs">
                {product.artist.user.image ? (
                  <img src={product.artist.user.image} alt={product.artist.user.name || 'Artist'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-lg">
                    {product.artist.user.name?.[0] || 'هـ'}
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-slate-400 font-bold mb-0.5">خالق و صاحب اثر</div>
                <div className="font-bold text-slate-800 text-sm sm:text-base group-hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                  <span>{product.artist.user.name}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-emerald-600 transition-colors"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </div>
            </a>

            {/* Expandable Description */}
            <div className="mb-6">
              <h3 className="font-bold text-slate-800 mb-2 text-base">درباره این اثر</h3>
              <ExpandableDescription description={product.description} />
            </div>

            {/* Category / Specialty Tags with New-Tab Filtering */}
            {product.specialties.length > 0 && (
              <div className="mb-6">
                <div className="text-xs font-bold text-slate-400 mb-2">دسته‌بندی و سبک اثر:</div>
                <div className="flex flex-wrap gap-2">
                  {product.specialties.map(s => (
                    <a
                      key={s.id}
                      href={`/products?specialty=${encodeURIComponent(s.id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 transition-all cursor-pointer shadow-2xs"
                      title={`مشاهده سایر دست‌سازه‌های دسته‌بندی ${s.name} در تب جدید`}
                    >
                      <span>#{s.name}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-emerald-600 transition-colors"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Low Stock Warning */}
            {product.stockQuantity > 0 && product.stockQuantity <= 3 && (
              <div className="mb-4 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-xl w-fit">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>
                  تنها {product.stockQuantity.toLocaleString('fa-IR')} عدد {product.shippingMode === 'HONARHUB_WAREHOUSE' ? 'در انبار هنرهاب' : 'در کارگاه هنرمند'} باقی مانده است
                </span>
              </div>
            )}

            {/* Interactive Purchase & Pre-Order Section */}
            <div className="mt-auto pt-4">
              <ProductPurchaseSection 
                product={{
                  id: product.id,
                  title: product.title,
                  basePrice: basePrice,
                  imageUrl: product.imageUrl,
                  artistName: product.artist.user.name || 'نامشخص',
                  stockQuantity: product.stockQuantity,
                  isPreOrderEnabled: product.isPreOrderEnabled,
                  preOrderTiers: product.preOrderTiers,
                  shippingMode: product.shippingMode,
                  status: product.status
                }}
              />
            </div>
            
          </div>
        </div>

        {/* Reviews and Q&A Section */}
        <ProductReviewsAndQA 
          productId={product.id} 
          artistUserId={product.artist.userId} 
        />

      </main>

      <SiteFooter />
    </div>
  );
}
