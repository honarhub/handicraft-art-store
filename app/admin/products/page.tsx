'use client';

import React, { useState, useEffect } from 'react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortPrice, setSortPrice] = useState<'none' | 'asc' | 'desc'>('none');

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

  const handleUpdateStatus = async (id: string, status: string) => {
    let feedback = '';
    if (status === 'REJECTED') {
      const reason = window.prompt('دلیل رد این محصول چیست؟ (برای نمایش به هنرمند)');
      if (reason === null) return; // User cancelled
      feedback = reason;
    }

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateStatus', status, adminFeedback: feedback })
      });
      if (!res.ok) throw new Error('خطا در بروزرسانی');
      
      setProducts(products.map(p => p.id === id ? { ...p, status } : p));
    } catch (err) {
      alert('خطا در اعمال تغییرات');
    }
  };

  // Filter and Sort Logic
  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || (p.artistName && p.artistName.toLowerCase().includes(q));
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortPrice === 'none') return 0;
    if (sortPrice === 'asc') return a.price - b.price;
    return b.price - a.price; // desc
  });

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

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/2 relative">
          <input 
            type="text" 
            placeholder="جستجو در عنوان اثر یا نام صاحب اثر..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:border-purple-500 outline-none text-sm"
          />
          <svg className="absolute left-3 top-2.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        
        <div className="w-full md:w-auto flex items-center gap-2">
          <span className="text-sm font-bold text-slate-600">مرتب‌سازی قیمت:</span>
          <select 
            value={sortPrice} 
            onChange={(e) => setSortPrice(e.target.value as any)}
            className="border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500"
          >
            <option value="none">بدون مرتب‌سازی</option>
            <option value="desc">بیشترین به کمترین</option>
            <option value="asc">کمترین به بیشترین</option>
          </select>
        </div>
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
                <th className="px-6 py-4 text-center">موجودی</th>
                <th className="px-6 py-4 text-center">وضعیت انتشار</th>
                <th className="px-6 py-4 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 font-medium">در حال بارگذاری...</td>
                </tr>
              ) : sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 font-medium">محصولی برای نمایش وجود ندارد.</td>
                </tr>
              ) : sortedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <img src={product.imageUrl} alt={product.title} className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200" />
                  </td>
                  <td className="px-6 py-4">
                    <a href={`/product/${product.id}`} target="_blank" rel="noopener noreferrer" className="font-bold text-slate-800 hover:text-emerald-600 transition-colors flex items-center gap-2">
                      {product.title}
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                  </td>
                  <td className="px-6 py-4 text-purple-700 font-medium">{product.artistName}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {product.price > 0 ? product.price.toLocaleString() : 'توافقی / نامشخص'}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-700">
                    {product.stockQuantity || 1}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {product.status === 'PENDING' && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">در انتظار تایید</span>}
                    {product.status === 'APPROVED' && <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-bold">تایید شده</span>}
                    {product.status === 'REJECTED' && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">رد شده</span>}
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex justify-end items-center gap-2">
                      {product.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleUpdateStatus(product.id, 'APPROVED')} title="تایید محصول" className="text-emerald-600 hover:bg-emerald-50 w-8 h-8 flex items-center justify-center rounded-lg transition-colors border border-transparent hover:border-emerald-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </button>
                          <button onClick={() => handleUpdateStatus(product.id, 'REJECTED')} title="رد محصول" className="text-red-600 hover:bg-red-50 w-8 h-8 flex items-center justify-center rounded-lg transition-colors border border-transparent hover:border-red-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </>
                      )}
                      <a href={`/admin/products/${product.id}/edit`} title="ویرایش" className="text-blue-600 hover:bg-blue-50 w-8 h-8 flex items-center justify-center rounded-lg transition-colors border border-transparent hover:border-blue-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </a>
                    </div>
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
