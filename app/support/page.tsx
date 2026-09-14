import React from 'react';
import prisma from '@/lib/prisma';
import SupportForm from './SupportForm';

export const dynamic = 'force-dynamic';

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ productId?: string }> }) {
  const { productId } = await searchParams;
  let product = null;

  if (productId) {
    product = await prisma.product.findUnique({
      where: { id: productId },
      include: { artist: { include: { user: true } } }
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto flex justify-between items-center py-4 px-6">
          <a href="/" className="text-2xl font-black tracking-tighter text-slate-800">
            هنرآفرین <span className="text-emerald-600">.</span>
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-12 px-4">
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

          <SupportForm productId={productId} />
        </div>
      </main>
    </div>
  );
}
