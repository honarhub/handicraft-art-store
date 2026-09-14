import React from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import CartIcon from '../../components/CartIcon';
import ProductGallery from './ProductGallery';
import AddToCartButton from './AddToCartButton';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id },
    include: { artist: { include: { user: true } }, specialties: true, pricingTiers: true }
  });

  if (!product || product.status !== 'APPROVED' || product.deletedAt || !product.artist.isActive || product.artist.isDeleted) {
    notFound();
  }

  const allMedia = product.mediaUrls && product.mediaUrls.length > 0 ? product.mediaUrls : (product.imageUrl ? [product.imageUrl] : []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6 md:px-12">
          <a href="/" className="text-2xl font-black tracking-tighter text-slate-800">
            هنرآفرین <span className="text-emerald-600">.</span>
          </a>
          <CartIcon />
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-6 md:px-12">
        <div className="flex flex-col lg:flex-row gap-12 bg-white rounded-3xl p-6 md:p-12 shadow-sm border border-slate-200">
          
          {/* Image Gallery */}
          <div className="lg:w-1/2">
            <div className="sticky top-12">
              <ProductGallery mediaUrls={allMedia} title={product.title} />
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full mb-6 w-fit border border-emerald-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              ارسال مستقیم از کارگاه هنرمند
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 leading-tight">{product.title}</h1>
            
            <a href={`/artist/${product.artist.displayId}`} className="flex items-center gap-3 mb-8 pb-8 border-b border-slate-100 group w-fit transition-all">
              <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border-2 border-slate-200 group-hover:border-emerald-500 transition-colors">
                {product.artist.user.image && <img src={product.artist.user.image} alt="Artist" className="w-full h-full object-cover" />}
              </div>
              <div>
                <div className="text-sm text-slate-500 font-medium mb-0.5">صاحب اثر</div>
                <div className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{product.artist.user.name}</div>
              </div>
            </a>

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

            <div className="mt-auto pt-6 flex flex-col gap-4">
               <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <div className="text-slate-600 font-medium">قیمت اثر:</div>
                 <div className="text-3xl font-black text-emerald-600">
                   {(product.pricingTiers[0]?.price || 0).toLocaleString('fa-IR')} <span className="text-base font-bold text-emerald-800/60">تومان</span>
                 </div>
               </div>
               
               <AddToCartButton product={{
                 id: product.id,
                 title: product.title,
                 price: product.pricingTiers[0]?.price || 0,
                 imageUrl: product.imageUrl,
                 artistName: product.artist.user.name || 'نامشخص',
                 stockQuantity: product.stockQuantity
               }} />
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}
