import React from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import CartIcon from '../../components/CartIcon';
import AddToCartButton from './AddToCartButton';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id },
    include: { artist: { include: { user: true } }, specialties: true, pricingTiers: true }
  });

  if (!product || product.status !== 'APPROVED' || product.deletedAt) {
    notFound();
  }

  // A basic placeholder for the product page requested by the user
  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      {/* Header Placeholder */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6 md:px-12">
          <a href="/" className="text-2xl font-black tracking-tighter text-slate-800">
            هنرآفرین <span className="text-emerald-600">.</span>
          </a>
          <CartIcon />
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-6 md:px-12">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
          
          <div className="w-full md:w-1/2 relative bg-slate-100 aspect-square md:aspect-auto">
            <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
          </div>

          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="mb-2 text-sm font-bold text-emerald-600 bg-emerald-50 w-fit px-3 py-1 rounded-full border border-emerald-100">
              ارسال مستقیم از کارگاه هنرمند
            </div>
            
            <div className="flex justify-between items-end mb-4">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{product.title}</h1>
              <div className="text-left">
                <div className="text-sm text-slate-500 mb-1">قیمت</div>
                <div className="text-2xl font-black text-emerald-600">
                  {(product.pricingTiers[0]?.price || 0).toLocaleString('fa-IR')} <span className="text-sm font-bold text-emerald-800/60">تومان</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mb-8 pb-8 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                {product.artist.user.image && <img src={product.artist.user.image} alt="Artist" className="w-full h-full object-cover" />}
              </div>
              <div>
                <div className="text-sm text-slate-500 font-medium mb-0.5">صاحب اثر</div>
                <div className="font-bold text-slate-800">{product.artist.user.name}</div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-bold text-slate-800 mb-3 text-lg">توضیحات اثر</h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
            
            {product.specialties.length > 0 && (
              <div className="mb-8 flex flex-wrap gap-2">
                {product.specialties.map(s => (
                  <span key={s.id} className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200">
                    {s.name}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto pt-6 flex gap-4 items-center">
               <AddToCartButton product={{
                 id: product.id,
                 title: product.title,
                 price: product.pricingTiers[0]?.price || 0,
                 imageUrl: product.imageUrl,
                 artistName: product.artist.user.name || 'نامشخص',
                 stockQuantity: product.stockQuantity
               }} />
               {product.stockQuantity > 0 && product.stockQuantity < 5 && (
                 <div className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                   تنها {product.stockQuantity} عدد باقیست
                 </div>
               )}
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}
