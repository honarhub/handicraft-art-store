import React from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import CartIcon from '../../components/CartIcon';
import ProductGallery from './ProductGallery';
import AddToCartButton from './AddToCartButton';
import StockNotifyButton from './StockNotifyButton';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id },
    include: { artist: { include: { user: true } }, specialties: true, pricingTiers: true }
  });

  if (!product || product.deletedAt || !product.artist.isActive || product.artist.isDeleted) {
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
               {product.status === 'PENDING' ? (
                 <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center flex flex-col items-center gap-4">
                   <div className="text-amber-600 bg-amber-100 p-3 rounded-full">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-amber-800 mb-1">به زودی...</h3>
                     <p className="text-sm text-amber-700">این محصول در انتظار تایید سایت می‌باشد و به زودی برای فروش فعال خواهد شد.</p>
                   </div>
                   <a href={`/support?productId=${product.id}`} className="bg-white hover:bg-amber-100 text-amber-700 font-bold px-6 py-2.5 rounded-xl border border-amber-200 transition-colors text-sm shadow-sm flex items-center gap-2 mt-2">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                     ارتباط با پشتیبانی سایت
                   </a>
                 </div>
               ) : (
                 <>
                   {product.stockQuantity > 0 ? (
                     <>
                       <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
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
                     </>
                   ) : (
                     <>
                       <div className="flex justify-between items-center bg-red-50 p-4 rounded-xl border border-red-100 mb-4">
                         <div className="text-red-600 font-black text-xl w-full text-center flex items-center justify-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> ناموجود
                         </div>
                       </div>
                       
                       <div className="flex flex-col gap-3">
                         <StockNotifyButton productId={product.id} />
                       </div>
                     </>
                   )}
                 </>
               )}
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}
