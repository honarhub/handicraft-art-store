'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ArtistProductFeedbackButton from './ArtistProductFeedbackButton';

interface ArtistProductsTableProps {
  initialProducts: any[];
}

export default function ArtistProductsTable({ initialProducts }: ArtistProductsTableProps) {
  const [products, setProducts] = useState<any[]>(initialProducts);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/artist/products', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data);
        }
      }
    } catch {
      // Ignore network glitch
    }
  }, []);

  useEffect(() => {
    window.addEventListener('focus', fetchProducts);

    return () => {
      window.removeEventListener('focus', fetchProducts);
    };
  }, [fetchProducts]);

  const handleFeedbackRead = (productId: string) => {
    // Optimistically update feedback read status locally without page reload
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          adminFeedbackRead: true
        };
      }
      return p;
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">کد اثر</th>
              <th className="px-6 py-4">تصویر</th>
              <th className="px-6 py-4">عنوان اثر</th>
              <th className="px-6 py-4">قیمت (تومان)</th>
              <th className="px-6 py-4 text-center">پیش‌سفارش</th>
              <th className="px-6 py-4 text-center">موجودی</th>
              <th className="px-6 py-4 text-center">وضعیت انتشار</th>
              <th className="px-6 py-4 text-center">پیام ادمین</th>
              <th className="px-6 py-4 text-left">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-500 font-medium">
                  شما هنوز هیچ اثری ثبت نکرده‌اید.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-black text-slate-800 text-lg">#{product.displayId}</span>
                      <span className="text-xs text-slate-400 font-mono tracking-tighter" title={product.id}>
                        {product.id.substring(0, 8)}...
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <img 
                      src={product.imageUrl} 
                      alt={product.title} 
                      className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200" 
                    />
                  </td>
                  <td className="px-6 py-4">
                    <a 
                      href={`/product/${product.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-bold text-slate-800 hover:text-teal-600 transition-colors inline-flex items-center gap-1.5 group"
                      title="مشاهده صفحه محصول در سایت"
                    >
                      <span>{product.title}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-teal-600 transition-colors">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </a>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {product.pricingTiers && product.pricingTiers[0]?.price > 0 
                      ? product.pricingTiers[0].price.toLocaleString() 
                      : 'توافقی / نامشخص'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {product.isPreOrderEnabled ? (
                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-bold">
                        ✓ فعال
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">ندارد</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-700">
                    {product.stockQuantity ?? 0}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {(product.pendingEdits || product.status === 'PENDING') ? (
                      <span className="bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                        در انتظار تایید ادمین
                      </span>
                    ) : product.status === 'APPROVED' ? (
                      <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold">
                        تایید شده
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-bold">
                        رد شده
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ArtistProductFeedbackButton
                      productId={product.id}
                      productTitle={product.title}
                      adminFeedback={product.adminFeedback}
                      adminFeedbackHistory={product.adminFeedbackHistory}
                      adminFeedbackRead={product.adminFeedbackRead}
                      status={product.status}
                      onRead={() => handleFeedbackRead(product.id)}
                    />
                  </td>
                  <td className="px-6 py-4 text-left">
                    <Link 
                      href={`/artist-panel/products/${product.id}/edit`} 
                      title="ویرایش" 
                      className="inline-flex text-blue-600 hover:bg-blue-50 w-8 h-8 items-center justify-center rounded-lg transition-colors border border-transparent hover:border-blue-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
