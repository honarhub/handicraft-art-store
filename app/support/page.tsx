import React from 'react';
import prisma from '@/lib/prisma';
import SupportForm from './SupportForm';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';

export const dynamic = 'force-dynamic';

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ productId?: string, message?: string, name?: string }> }) {
  const { productId, message, name } = await searchParams;
  let product = null;

  if (productId) {
    product = await prisma.product.findUnique({
      where: { id: productId },
      include: { artist: { include: { user: true } } }
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans" dir="rtl">
      <SiteHeader />

      <main className="flex-1 w-full max-w-3xl mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <h1 className="text-3xl font-black text-slate-800 mb-2">ارتباط با پشتیبانی</h1>
          <p className="text-slate-500 mb-8">نظرات، پیشنهادات یا مشکلات خود را برای ما ارسال کنید. کارشناسان ما در سریع‌ترین زمان ممکن رسیدگی خواهند کرد.</p>

          {product && (
            <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
                <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-600 mb-1">مرتبط با اثر:</div>
                <h3 className="font-bold text-slate-800">{product.title}</h3>
                <p className="text-sm text-slate-500">هنرمند: {product.artist.user.name}</p>
              </div>
            </div>
          )}

          <SupportForm productId={productId} initialMessage={message} initialName={name} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
