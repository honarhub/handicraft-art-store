'use client';

import React, { useState, useEffect } from 'react';
import { formatPersianDateTime } from '@/lib/date';

interface StockReq {
  id: string;
  contact: string;
  isNotified: boolean;
  createdAt: string;
  product: {
    id: string;
    title: string;
    stockQuantity: number;
    artist: { user: { name: string | null } };
  };
}

export default function AdminStockRequestsPage() {
  const [requests, setRequests] = useState<StockReq[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    try {
      const res = await fetch('/api/stock-request', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleToggleNotified = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/stock-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isNotified: !currentStatus })
      });
      if (res.ok) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, isNotified: !currentStatus } : r));
        // بروزرسانی برخط تعداد در سایدبار
        window.dispatchEvent(new CustomEvent('admin-counts-update'));
      }
    } catch {
      alert('خطا در تغییر وضعیت');
    }
  };

  // مرتب‌سازی: درخواست‌های در انتظار رسیدگی حتما بالاتر بیایند
  const sortedRequests = [...requests].sort((a, b) => {
    if (!a.isNotified && b.isNotified) return -1;
    if (a.isNotified && !b.isNotified) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">درخواست‌های موجودی کالا</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">لیست کاربران منتظر برای موجود شدن محصولات ناموجود</p>
        </div>
      </div>

      {/* Mobile Cards Layout (< md) */}
      <div className="block md:hidden space-y-3.5 mb-6">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-500 font-medium border border-slate-200">
            در حال بارگذاری...
          </div>
        ) : sortedRequests.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-500 font-medium border border-slate-200">
            درخواستی یافت نشد
          </div>
        ) : (
          sortedRequests.map(req => {
            const isPending = !req.isNotified;
            return (
              <div 
                key={req.id}
                className={`bg-white rounded-2xl p-4 border shadow-xs space-y-3 transition-all ${
                  isPending 
                    ? 'border-amber-300 bg-amber-50/25 ring-1 ring-amber-200' 
                    : 'border-slate-200'
                }`}
              >
                {/* Header: Status + Date */}
                <div className="flex items-center justify-between gap-2">
                  {isPending ? (
                    <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      در انتظار رسیدگی
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold">
                      ✓ اطلاع‌رسانی شد
                    </span>
                  )}
                  <span className="text-xs text-slate-500 font-mono" dir="rtl">
                    {formatPersianDateTime(req.createdAt)}
                  </span>
                </div>

                {/* Customer Contact & Current Stock */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">مشتری:</span>
                    <a 
                      href={req.contact.includes('@') ? `mailto:${req.contact}` : `tel:${req.contact}`}
                      className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200"
                      dir="ltr"
                    >
                      {req.contact}
                    </a>
                  </div>

                  {req.product.stockQuantity > 0 ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                      موجود شد ({req.product.stockQuantity})
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md">
                      ناموجود (۰)
                    </span>
                  )}
                </div>

                {/* Product Title & Artist */}
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <div className="text-xs text-slate-500">اثر درخواستی:</div>
                  <a 
                    href={`/admin/products/${req.product.id}/edit`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="font-bold text-slate-900 hover:text-emerald-700 text-sm block"
                  >
                    {req.product.title}
                  </a>
                  <div className="text-xs text-purple-700 font-medium">
                    🎨 خالق اثر: {req.product.artist?.user?.name || 'بدون نام'}
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleToggleNotified(req.id, req.isNotified)}
                    className={`text-xs px-3 py-2 rounded-xl font-bold transition-all w-full text-center ${
                      isPending
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {isPending ? 'علامت‌گذاری به عنوان اطلاع‌رسانی شده' : 'بازگرداندن به در انتظار'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">وضعیت پیگیری</th>
              <th className="px-6 py-4">مشتری</th>
              <th className="px-6 py-4">محصول</th>
              <th className="px-6 py-4">هنرمند</th>
              <th className="px-6 py-4">موجودی فعلی</th>
              <th className="px-6 py-4">تاریخ ثبت</th>
              <th className="px-6 py-4 text-left">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">در حال بارگذاری...</td>
              </tr>
            ) : sortedRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">درخواستی یافت نشد</td>
              </tr>
            ) : (
              sortedRequests.map(req => (
                <tr key={req.id} className={`transition-colors ${!req.isNotified ? 'bg-amber-50/40 hover:bg-amber-100/60 border-r-4 border-r-amber-500' : 'hover:bg-slate-50'}`}>
                  <td className="px-6 py-4">
                    {!req.isNotified ? (
                      <span className="bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                        در انتظار رسیدگی
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                        اطلاع‌رسانی شد
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700 font-mono" dir="ltr">{req.contact}</td>
                  <td className="px-6 py-4">
                    <a href={`/admin/products/${req.product.id}/edit`} target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline">
                      {req.product.title}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{req.product.artist?.user?.name || 'بدون نام'}</td>
                  <td className="px-6 py-4">
                    {req.product.stockQuantity > 0 ? (
                      <span className="text-emerald-600 font-bold">موجود شد ({req.product.stockQuantity})</span>
                    ) : (
                      <span className="text-red-500 font-bold">ناموجود (۰)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs" dir="rtl">
                    {formatPersianDateTime(req.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleToggleNotified(req.id, req.isNotified)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                        !req.isNotified
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {!req.isNotified ? 'علامت‌گذاری به عنوان اطلاع‌رسانی شده' : 'بازگرداندن به در انتظار'}
                    </button>
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
