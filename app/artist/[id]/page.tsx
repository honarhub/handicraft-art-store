import React from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import GeoPattern from 'geopattern';

export default async function ArtistProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // دریافت اطلاعات واقعی از دیتابیس
  const dbArtist = await prisma.artistProfile.findFirst({
    where: { id: id, isDeleted: false, isActive: true },
    include: { user: true, products: true }
  });
  
  if (!dbArtist) notFound();

  // تولید پترن ریاضی و کاملا یونیک بر اساس شناسه هنرمند (هم طرح و هم رنگ اختصاصی)
  const pattern = GeoPattern.generate(id);
  const patternDataUrl = pattern.toDataUrl();

  // تبدیل نامطمئنی‌های دیتابیس به مقادیر پیش‌فرض
  const artist = {
    user: { 
      name: dbArtist.user.name || 'بدون نام', 
      image: dbArtist.user.image || ('https://placehold.co/400x400/emerald/white?text=' + (dbArtist.user.name ? dbArtist.user.name[0] : 'U')) 
    },
    specialties: dbArtist.specialties || 'نامشخص',
    bio: dbArtist.bio || 'توضیحاتی برای این هنرمند ثبت نشده است.',
    portfolioUrl: dbArtist.portfolioUrl || null,
    products: dbArtist.products || []
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" dir="rtl">
      {/* هدر اختصاصی پروفایل */}
      <header className="pt-24 pb-12 px-4 relative overflow-hidden" style={{ backgroundImage: patternDataUrl }}>
        <div className="absolute inset-0 bg-black/40"></div> {/* یک هاله تاریک برای خوانایی متن */}
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white shrink-0">
            <img src={artist.user.image || ''} alt={artist.user.name || ''} className="w-full h-full object-cover" />
          </div>
          <div className="text-center md:text-right text-white">
            <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">{artist.user.name}</h1>
            <p className="text-emerald-200 text-lg md:text-xl font-medium mb-4">{artist.specialties}</p>
            {artist.portfolioUrl && (
              <a href={artist.portfolioUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-medium transition-colors">
                🔗 مشاهده پورتفولیو شخصی
              </a>
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

        {/* گالری آثار */}
        <section>
          <h2 className="text-2xl font-black text-gray-800 mb-8 px-2">گالری آثار هنرمند</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artist.products.map(product => (
              <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
                  <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-800 text-lg mb-2">{product.title}</h3>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-emerald-700 font-bold">بزودی...</span>
                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">مشاهده</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
