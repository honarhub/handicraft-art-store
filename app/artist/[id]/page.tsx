import React from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import GeoPattern from 'geopattern';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { Metadata } from 'next';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';
import ArtistProductsGallery from '@/app/components/ArtistProductsGallery';

export const dynamic = 'force-dynamic';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://honarhub.com';

interface ArtistPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const { id } = await params;
  const isNumericId = !isNaN(Number(id));

  try {
    const dbArtist = await prisma.artistProfile.findFirst({
      where: {
        OR: [
          { id: id },
          ...(isNumericId ? [{ displayId: Number(id) }] : [])
        ],
        isDeleted: false,
      },
      include: {
        user: true,
        specialties: true,
      },
    });

    if (!dbArtist) {
      return {
        title: 'هنرمند یافت نشد',
        description: 'پروفایل این هنرمند در دسترس نیست.',
      };
    }

    const artistName = dbArtist.brandName || dbArtist.user.name || 'هنرمند مستقل';
    const cleanBio = (dbArtist.bio || '').replace(/\s+/g, ' ').substring(0, 160);
    const specialtiesList = dbArtist.specialties.map((s) => s.name).join('، ');
    const location = [dbArtist.province, dbArtist.city].filter(Boolean).join('، ');

    const avatarUrl = dbArtist.user.image
      ? (dbArtist.user.image.startsWith('http') ? dbArtist.user.image : `${baseUrl}${dbArtist.user.image.startsWith('/') ? '' : '/'}${dbArtist.user.image}`)
      : `${baseUrl}/logo.png`;

    const pageTitle = `گالری و آثار استاد ${artistName} (${specialtiesList || 'صنایع دستی'}) | هنرهاب`;
    const pageDescription = cleanBio || `پروفایل و گالری اختصاصی استاد ${artistName} در زمینه ${specialtiesList || 'صنایع دستی'} در ${location || 'ایران'}. مشاهده سوابق و خرید بی‌واسطه دست‌سازه‌های اصیل در هنرهاب.`;

    return {
      title: pageTitle,
      description: pageDescription,
      keywords: [
        artistName,
        ...dbArtist.specialties.map((s) => s.name),
        location,
        'استاد صنایع دستی',
        'هنرمند ایرانی',
        'خرید مستقیم از کارگاه هنری',
        'هنرهاب',
      ].filter(Boolean),
      alternates: {
        canonical: `${baseUrl}/artist/${dbArtist.id}`,
      },
      openGraph: {
        type: 'profile',
        locale: 'fa_IR',
        url: `${baseUrl}/artist/${dbArtist.id}`,
        siteName: 'هنرهاب | HonarHub',
        title: pageTitle,
        description: pageDescription,
        images: [
          {
            url: avatarUrl,
            width: 500,
            height: 500,
            alt: `استاد ${artistName}`,
          },
        ],
      },
      twitter: {
        card: 'summary',
        title: pageTitle,
        description: pageDescription,
        images: [avatarUrl],
      },
    };
  } catch (err) {
    console.error('Error generating metadata for artist:', err);
    return {
      title: 'پروفایل هنرمند | هنرهاب',
    };
  }
}

export default async function ArtistProfilePage({ params }: ArtistPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  // Fetch artist profile by cuid or displayId
  const isNumericId = !isNaN(Number(id));
  const isAdmin = session?.user?.role === 'ADMIN';
  
  const dbArtist = await prisma.artistProfile.findFirst({
    where: { 
      OR: [
        { id: id },
        ...(isNumericId ? [{ displayId: Number(id) }] : [])
      ],
      isDeleted: false, 
    },
    include: { 
      user: true, 
      products: { 
        where: isAdmin ? { deletedAt: null } : { status: 'APPROVED', deletedAt: null },
        include: { pricingTiers: true, specialties: true },
        orderBy: { createdAt: 'desc' }
      }, 
      specialties: true 
    }
  });
  
  if (!dbArtist) notFound();

  const isOwner = Boolean(session?.user?.id && session.user.id === dbArtist.userId);

  // Access check: only Level 2 and above profiles are public. Levels 0 and 1 are preview only for admin & owner.
  if (!dbArtist.isActive || !dbArtist.isApproved || (dbArtist.verificationLevel || 0) < 2) {
    if (!isAdmin && !isOwner) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-4" dir="rtl">
          <div className="text-center max-w-lg w-full">
            <h1 className="text-9xl font-black text-slate-200 mb-4 tracking-tighter">403</h1>
            <h2 className="text-2xl font-black text-slate-800 mb-4">در انتظار احراز هویت و انتشار عمومی</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              این پروفایل هنرمندی در حال حاضر در مرحله تکمیل مدارک و ارتقا به سطح ۲ قرار دارد و هنوز به صورت عمومی منتشر نشده است.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="/"
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold transition-colors"
              >
                بازگشت به خانه
              </a>
              <a 
                href={`/support?message=${encodeURIComponent(`درخواست پیگیری وضعیت تایید پروفایل هنرمند\nنام هنرمند: ${dbArtist.user.name || 'بدون نام'}\nلینک پروفایل: /artist/${id}`)}&name=${encodeURIComponent(dbArtist.user.name || '')}`}
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                ارتباط با پشتیبانی
              </a>
            </div>
          </div>
        </div>
      );
    }
  }

  // تولید پترن ریاضی و کاملا یونیک بر اساس شناسه هنرمند (هم طرح و هم رنگ اختصاصی)
  const pattern = GeoPattern.generate(id);
  const patternDataUrl = pattern.toDataUrl();

  // تبدیل نامطمئنی‌های دیتابیس به مقادیر پیش‌فرض
  const artist = {
    user: { 
      name: dbArtist.user.name || 'بدون نام', 
      image: dbArtist.user.image || ('https://placehold.co/400x400/emerald/white?text=' + (dbArtist.user.name ? dbArtist.user.name[0] : 'U')) 
    },
    specialties: dbArtist.specialties && dbArtist.specialties.filter(s => s.isApproved).length > 0 
      ? dbArtist.specialties.filter(s => s.isApproved).map(s => s.name).join('، ') 
      : null,
    bio: dbArtist.bio || 'توضیحاتی برای این هنرمند ثبت نشده است.',
    portfolioUrl: dbArtist.portfolioUrl || null,
    socialLinks: (dbArtist.socialLinks as Record<string, string>) || {},
    products: dbArtist.products || []
  };

  const artistName = dbArtist.brandName || dbArtist.user.name || 'هنرمند مستقل';
  const avatar = dbArtist.user.image
    ? (dbArtist.user.image.startsWith('http') ? dbArtist.user.image : `${baseUrl}${dbArtist.user.image.startsWith('/') ? '' : '/'}${dbArtist.user.image}`)
    : `${baseUrl}/logo.png`;
  const socialList = Object.values((dbArtist.socialLinks as Record<string, string>) || {}).filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" dir="rtl">
      {/* Artist & ProfilePage JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ProfilePage',
            mainEntity: {
              '@type': 'Person',
              name: artistName,
              description: dbArtist.bio || `استاد صنایع دستی و دست‌سازه‌های اصیل ایرانی در هنرهاب`,
              image: avatar,
              jobTitle: (dbArtist.specialties || []).map((s) => s.name).join(', '),
              address: {
                '@type': 'PostalAddress',
                addressLocality: dbArtist.city || 'ایران',
                addressRegion: dbArtist.province || '',
                addressCountry: 'IR',
              },
              sameAs: socialList,
            },
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
                name: 'هنرمندان و اساتید',
                item: `${baseUrl}/products?type=artists`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: artistName,
                item: `${baseUrl}/artist/${dbArtist.id}`,
              },
            ],
          }),
        }}
      />

      <SiteHeader />
      {(!dbArtist.isActive || !dbArtist.isApproved) && (
        <div className="bg-red-500 text-white p-3 text-center text-sm font-bold shadow-md z-50">
          ⚠️ حالت پیش‌نمایش: این صفحه هنوز به تایید مدیریت نرسیده است و برای عموم مخفی است.
        </div>
      )}
      {/* هدر اختصاصی پروفایل */}
      <header className="pt-24 pb-12 px-4 relative overflow-hidden" style={{ backgroundImage: patternDataUrl }}>
        <div className="absolute inset-0 bg-black/40"></div> {/* یک هاله تاریک برای خوانایی متن */}
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white shrink-0">
            <img src={artist.user.image || ''} alt={artist.user.name || ''} className="w-full h-full object-cover" />
          </div>
          <div className="text-center md:text-right text-white">
            <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">{artist.user.name}</h1>
            {artist.specialties && (
              <p className="text-emerald-200 text-lg md:text-xl font-medium mb-4">{artist.specialties}</p>
            )}
            {artist.portfolioUrl && (
              <a href={artist.portfolioUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-medium transition-colors mb-4">
                🔗 سایت شخصی
              </a>
            )}
            
            {Object.keys(artist.socialLinks).length > 0 && (
              <div className="flex justify-center md:justify-start gap-3 items-center">
                {artist.socialLinks.instagram && (
                  <a href={artist.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-md hover:shadow-lg hover:scale-110 transition-all" title="اینستاگرام">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  </a>
                )}
                {artist.socialLinks.telegram && (
                  <a href={artist.socialLinks.telegram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#24A1DE] hover:bg-[#1f8ec4] flex items-center justify-center text-white shadow-md hover:shadow-lg hover:scale-110 transition-all" title="تلگرام">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  </a>
                )}
                {artist.socialLinks.bale && (
                  <a href={artist.socialLinks.bale} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#0aca9b] hover:bg-[#09b68b] flex items-center justify-center p-1.5 shadow-md hover:shadow-lg hover:scale-110 transition-all" title="پیام‌رسان بله">
                    <img src="/icons/bale.png" alt="بله" className="w-7 h-7 rounded-full object-contain" />
                  </a>
                )}
                {artist.socialLinks.twitter && (
                  <a href={artist.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-black hover:bg-slate-900 border border-white/30 flex items-center justify-center text-white shadow-md hover:shadow-lg hover:scale-110 transition-all" title="ایکس (توییتر)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-12 -mt-8 relative z-20">
        
        {/* بیوگرافی (بهبود یافته توسط هوش مصنوعی) */}
        <section className="bg-white rounded-3xl shadow-sm p-8 md:p-10 mb-12 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="bg-emerald-100 text-emerald-800 w-10 h-10 rounded-full flex items-center justify-center">✨</span>
            درباره هنرمند
          </h2>
          <p className="text-gray-600 leading-relaxed text-lg text-justify">
            {artist.bio}
          </p>
        </section>

        {/* Artist Artworks Gallery */}
        <section>
          <div className="flex items-center justify-between mb-6 sm:mb-8 px-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">گالری آثار هنرمند</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">مشاهده، فیلتر و سفارش مستقیم دست‌سازه‌های این هنرمند</p>
            </div>
          </div>
          <ArtistProductsGallery 
            products={artist.products} 
            artistSpecialties={dbArtist.specialties.filter(s => s.isApproved)} 
          />
        </section>
      </main>
      
      <SiteFooter />
    </div>
  );
}
