'use client';

import React, { useState, useEffect } from 'react';

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
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800">درخواست‌های موجودی کالا</h2>
          <p className="text-slate-500 text-sm mt-1">لیست کاربران منتظر برای موجود شدن محصولات ناموجود</p>
        </div>
      </div>
      
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
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
                  <td className="px-6 py-4 text-slate-500 text-xs" dir="ltr">
                    {new Date(req.createdAt).toLocaleDateString('fa-IR')}
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
