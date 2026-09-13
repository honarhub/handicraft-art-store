'use client';

import React, { useState, useEffect } from 'react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800">تایید و مدیریت محصولات</h2>
          <p className="text-slate-500 mt-1 text-sm">لیست تمامی محصولات ثبت شده توسط هنرمندان یا ادمین‌ها</p>
        </div>
        <a href="/admin/products/new" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>ثبت محصول جدید</span>
        </a>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">تصویر</th>
                <th className="px-6 py-4">عنوان محصول</th>
                <th className="px-6 py-4">صاحب اثر (هنرمند)</th>
                <th className="px-6 py-4">قیمت (تومان)</th>
                <th className="px-6 py-4 text-center">وضعیت انتشار</th>
                <th className="px-6 py-4 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-medium">در حال بارگذاری...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-medium">محصولی برای نمایش وجود ندارد.</td>
                </tr>
              ) : products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <img src={product.imageUrl} alt={product.title} className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200" />
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">{product.title}</td>
                  <td className="px-6 py-4 text-purple-700 font-medium">{product.artistName}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {product.price > 0 ? product.price.toLocaleString() : 'توافقی / نامشخص'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {product.status === 'PENDING' && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">در انتظار تایید</span>}
                    {product.status === 'APPROVED' && <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-bold">تایید شده</span>}
                    {product.status === 'REJECTED' && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">رد شده</span>}
                  </td>
                  <td className="px-6 py-4 text-left">
                    <button className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold">
                      بررسی و ویرایش
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
