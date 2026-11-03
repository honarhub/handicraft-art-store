'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface WishlistItemData {
  id: string; // product id
  title: string;
  imageUrl: string;
  stockQuantity: number;
  artistName: string;
  price: number | null;
  specialty: string | null;
  savedAt: string;
}

const toPersianDigits = (num: number | string) =>
  String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

export default function WishlistManager({ initialItems }: { initialItems: WishlistItemData[] }) {
  const [items, setItems] = useState<WishlistItemData[]>(initialItems);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRemove = async (productId: string) => {
    setLoadingId(productId);
    try {
      // 1. Delete from DB
      const res = await fetch('/api/user/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      const data = await res.json();

      // 2. Update local state
      setItems(prev => prev.filter(i => i.id !== productId));

      // 3. Sync to localStorage
      if (data?.success && Array.isArray(data.productIds)) {
        localStorage.setItem('honarhub_wishlist', JSON.stringify(data.productIds));
      } else {
        const currentSaved = localStorage.getItem('honarhub_wishlist');
        const list: string[] = currentSaved ? JSON.parse(currentSaved) : [];
        const nextList = list.filter(id => id !== productId);
        localStorage.setItem('honarhub_wishlist', JSON.stringify(nextList));
      }

      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (err) {
      console.error('Error removing wishlist item:', err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-5 font-sans" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🔖</span>
            <span>لیست علاقه‌مندی‌ها</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            آثار دست‌ساز نشان‌شده توسط شما برای خرید یا بررسی‌های بعدی
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
          تعداد آثار: {toPersianDigits(items.length)}
        </span>
      </div>

      {/* Grid of Wishlist Cards */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Image */}
                <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 relative mb-3 border border-slate-100">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      بدون تصویر
                    </div>
                  )}

                  {/* Remove bookmark button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    disabled={loadingId === item.id}
                    className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-rose-500 flex items-center justify-center shadow-md transition-colors cursor-pointer"
                    title="حذف از نشان‌شده‌ها"
                  >
                    ✕
                  </button>
                </div>

                {/* Title & Artist */}
                <div className="space-y-1">
                  {item.specialty && (
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                      {item.specialty}
                    </span>
                  )}
                  <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-teal-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    اثر استاد: <span className="font-bold text-slate-700">{item.artistName}</span>
                  </p>
                </div>
              </div>

              {/* Price & Action */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-black text-sm text-slate-900">
                    {item.price ? `${toPersianDigits(item.price.toLocaleString())} تومان` : 'تماس'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {item.stockQuantity > 0 ? 'موجود در کارگاه' : 'ناموجود'}
                  </div>
                </div>

                <Link
                  href={`/product/${item.id}`}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                >
                  مشاهده اثر
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center text-3xl">
            🔖
          </div>
          <h3 className="font-black text-slate-800 text-base">لیست علاقه‌مندی‌های شما خالی است!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            در هنگام گشت‌وگذار در گالری هنرهاب، با زدن علامت بوکمارک روی هر اثر، آن را برای همیشه در حسابتان نگه دارید.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-sm transition-colors"
          >
            <span>کاوش در گالری صنایع دستی</span>
          </Link>
        </div>
      )}
    </div>
  );
}
