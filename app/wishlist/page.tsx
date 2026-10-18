'use client';

import React, { useEffect, useState } from 'react';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';

interface ProductItem {
  id: string;
  title: string;
  imageUrl: string;
  artistName: string;
  price: number;
  specialties?: string;
  stockQuantity: number;
  isPreOrderEnabled?: boolean;
}

export default function WishlistPage() {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const loadWishlist = () => {
    try {
      const saved = localStorage.getItem('honarhub_wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setWishlistIds(parsed);
          return parsed;
        }
      }
      setWishlistIds([]);
      return [];
    } catch {
      setWishlistIds([]);
      return [];
    }
  };

  useEffect(() => {
    setMounted(true);
    const ids = loadWishlist();

    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const allProds: ProductItem[] = await res.json();
          setProducts(allProds);
        }
      } catch (err) {
        console.error('Error fetching products for wishlist', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();

    const handleWishlistUpdate = () => {
      loadWishlist();
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    window.addEventListener('storage', handleWishlistUpdate);
    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdate);
      window.removeEventListener('storage', handleWishlistUpdate);
    };
  }, []);

  const handleRemoveFromWishlist = (productId: string) => {
    try {
      const nextIds = wishlistIds.filter(id => id !== productId);
      setWishlistIds(nextIds);
      localStorage.setItem('honarhub_wishlist', JSON.stringify(nextIds));
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (e) {
      console.error('Error removing from wishlist', e);
    }
  };

  const handleClearAll = () => {
    if (confirm('آیا از پاک کردن تمامی محصولات نشان‌شده اطمینان دارید؟')) {
      setWishlistIds([]);
      localStorage.setItem('honarhub_wishlist', JSON.stringify([]));
      window.dispatchEvent(new Event('wishlist-updated'));
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans" dir="rtl">
        <SiteHeader />
        <main className="flex-1 max-w-7xl mx-auto py-16 px-6 md:px-12 w-full flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const wishlistedProducts = products.filter(p => wishlistIds.includes(p.id));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans" dir="rtl">
      <SiteHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto py-12 px-6 md:px-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-rose-500 text-2xl">🔖</span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                محصولات نشان‌شده (لیست علاقه‌مندی‌ها)
              </h1>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm">
              دست‌سازه‌هایی که برای بررسی یا خرید در آینده ذخیره کرده‌اید
            </p>
          </div>

          {wishlistedProducts.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-xl transition-all w-fit cursor-pointer"
            >
              پاک‌سازی کل لیست
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="w-full py-20 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : wishlistedProducts.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center max-w-md mx-auto my-8">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center text-3xl">
              🔖
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">هنوز اثری را نشان نکرده‌اید</h2>
            <p className="text-slate-500 text-xs sm:text-sm mb-6 leading-relaxed">
              در هنگام تماشای گالری با کلیک بر روی آیکون نشان کردن (بوک‌مارک) می‌توانید آثار محبوب خود را ذخیره فرمایید.
            </p>
            <a
              href="/products"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-emerald-600/20 text-sm"
            >
              مشاهده گالری آثار هنری
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistedProducts.map((product) => {
              const isOutOfStock = product.stockQuantity <= 0;

              return (
                <div 
                  key={product.id}
                  className="bg-white rounded-3xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group relative"
                >
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveFromWishlist(product.id)}
                    className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 shadow-sm border border-slate-200 flex items-center justify-center transition-all cursor-pointer"
                    title="حذف از لیست نشان‌شده‌ها"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>

                  {/* Image */}
                  <a href={`/product/${product.id}`} className="block aspect-square w-full relative overflow-hidden bg-slate-100">
                    <img 
                      src={product.imageUrl} 
                      alt={product.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    {isOutOfStock && !product.isPreOrderEnabled && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center">
                        <span className="bg-slate-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs">ناموجود</span>
                      </div>
                    )}
                    {product.isPreOrderEnabled && (
                      <div className="absolute bottom-2.5 right-2.5 bg-purple-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                        ⏱️ امکان پیش‌سفارش
                      </div>
                    )}
                  </a>

                  {/* Details */}
                  <div className="p-4 flex flex-col flex-1">
                    <a href={`/product/${product.id}`} className="font-bold text-slate-800 hover:text-emerald-600 transition-colors line-clamp-1 mb-1">
                      {product.title}
                    </a>
                    <div className="text-xs text-slate-400 mb-3">
                      اثر: {product.artistName}
                    </div>

                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-emerald-600 font-black text-base">
                        {product.price > 0 ? (
                          <>
                            {product.price.toLocaleString('fa-IR')} <span className="text-[10px] font-bold text-emerald-800/60">تومان</span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">تماس بگیرید</span>
                        )}
                      </div>

                      <a 
                        href={`/product/${product.id}`}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs"
                      >
                        مشاهده و خرید
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
