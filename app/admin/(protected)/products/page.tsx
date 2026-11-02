'use client';

import React, { useState, useEffect } from 'react';
import AdminPromptModal from '@/app/components/AdminPromptModal';
import ProductReviewEditsModal from '@/app/components/ProductReviewEditsModal';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortPrice, setSortPrice] = useState<'none' | 'asc' | 'desc'>('none');
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, id: string}>({isOpen: false, id: ''});
  const [reviewModalProduct, setReviewModalProduct] = useState<any | null>(null);

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

  const handleToggleStatus = async (product: any) => {
    const isApproved = product.status === 'APPROVED';
    const newStatus = isApproved ? 'REJECTED' : 'APPROVED';
    
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'updateStatus', 
          status: newStatus,
          adminFeedback: isApproved ? 'غیرفعال شده توسط ادمین' : ''
        })
      });
      if (!res.ok) throw new Error('خطا در تغییر وضعیت');
      
      setProducts(products.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
      window.dispatchEvent(new CustomEvent('admin-counts-update'));
    } catch (err) {
      alert('خطا در تغییر وضعیت محصول');
    }
  };

  const handleUpdateStatus = async (id: string, status: string, feedback: string = '') => {
    if (status === 'REJECTED' && !feedback) {
      setModalConfig({ isOpen: true, id });
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateStatus', status, adminFeedback: feedback })
      });
      if (!res.ok) throw new Error('خطا در بروزرسانی');
      
      setProducts(products.map(p => p.id === id ? { ...p, status } : p));
      window.dispatchEvent(new CustomEvent('admin-counts-update'));
    } catch (err) {
      alert('خطا در اعمال تغییرات');
    }
  };

  const submitReject = (reason: string) => {
    const id = modalConfig.id;
    setModalConfig({ isOpen: false, id: '' });
    handleUpdateStatus(id, 'REJECTED', reason);
  };

  const handleApprovePendingEdits = async (id: string, feedback: string = '') => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approvePendingEdits', adminFeedback: feedback })
      });
      if (!res.ok) throw new Error('خطا');
      alert('تغییرات پیشنهادی هنرمند با موفقیت تایید و اعمال شد.');
      const refreshed = await fetch('/api/products', { cache: 'no-store' }).then(r => r.json());
      setProducts(refreshed);
      setReviewModalProduct(null);
      window.dispatchEvent(new CustomEvent('admin-counts-update'));
    } catch (e) {
      alert('خطا در تایید تغییرات');
    }
  };

  const handleRejectPendingEdits = async (id: string, feedback: string = '') => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rejectPendingEdits', adminFeedback: feedback })
      });
      if (!res.ok) throw new Error('خطا');
      alert('تغییرات پیشنهادی رد شد.');
      const refreshed = await fetch('/api/products', { cache: 'no-store' }).then(r => r.json());
      setProducts(refreshed);
      setReviewModalProduct(null);
      window.dispatchEvent(new CustomEvent('admin-counts-update'));
    } catch (e) {
      alert('خطا در رد تغییرات');
    }
  };

  const handleApproveProductOrEdits = async (id: string, feedback: string = '') => {
    const product = products.find(p => p.id === id);
    if (product?.hasPendingEdits) {
      await handleApprovePendingEdits(id, feedback);
    } else {
      await handleUpdateStatus(id, 'APPROVED', feedback);
      setReviewModalProduct(null);
    }
  };

  const handleRejectProductOrEdits = async (id: string, feedback: string = '') => {
    const product = products.find(p => p.id === id);
    if (product?.hasPendingEdits) {
      await handleRejectPendingEdits(id, feedback);
    } else {
      await handleUpdateStatus(id, 'REJECTED', feedback);
      setReviewModalProduct(null);
    }
  };

  // Filter and Sort Logic
  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) 
      || (p.artistName && p.artistName.toLowerCase().includes(q))
      || (p.displayId && p.displayId.toString() === q)
      || (p.id.toLowerCase().includes(q));
  });

  const isPending = (p: any) => Boolean(p.hasPendingEdits || p.status === 'PENDING');

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aPending = isPending(a);
    const bPending = isPending(b);

    // اولویت قطعی با محصولاتی است که در انتظار تایید هستند تا حتما بالای لیست قرار گیرند
    if (aPending && !bPending) return -1;
    if (!aPending && bPending) return 1;

    if (sortPrice === 'none') return 0;
    if (sortPrice === 'asc') return a.price - b.price;
    return b.price - a.price; // desc
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <AdminPromptModal 
        isOpen={modalConfig.isOpen}
        title="دلیل رد کردن محصول"
        placeholder="لطفا دلیل رد این محصول را برای هنرمند توضیح دهید..."
        onConfirm={submitReject}
        onCancel={() => setModalConfig({ isOpen: false, id: '' })}
      />

      <ProductReviewEditsModal 
        isOpen={Boolean(reviewModalProduct)}
        product={reviewModalProduct}
        onClose={() => setReviewModalProduct(null)}
        onApprove={handleApproveProductOrEdits}
        onReject={handleRejectProductOrEdits}
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">تایید و مدیریت محصولات</h2>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">لیست تمامی محصولات ثبت شده توسط هنرمندان یا ادمین‌ها</p>
        </div>
        <a 
          href="/admin/products/new" 
          className="w-full sm:w-auto justify-center bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>ثبت محصول جدید</span>
        </a>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/2 relative">
          <input 
            type="text" 
            placeholder="جستجو در عنوان، نام هنرمند، کد عددی یا هش..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-purple-500 outline-none text-sm font-medium"
          />
          <svg className="absolute left-3 top-3 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        
        <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-2">
          <span className="text-xs sm:text-sm font-bold text-slate-700 shrink-0">مرتب‌سازی قیمت:</span>
          <select 
            value={sortPrice} 
            onChange={(e) => setSortPrice(e.target.value as any)}
            className="border border-slate-300 bg-white text-slate-900 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="none">بدون مرتب‌سازی</option>
            <option value="desc">بیشترین به کمترین</option>
            <option value="asc">کمترین به بیشترین</option>
          </select>
        </div>
      </div>

      {/* Mobile Card Layout (< md) */}
      <div className="block md:hidden space-y-3 mb-6">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-500 font-medium border border-slate-200">
            در حال بارگذاری...
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-500 font-medium border border-slate-200">
            محصولی برای نمایش وجود ندارد.
          </div>
        ) : (
          sortedProducts.map((product) => {
            const isWaiting = isPending(product);
            return (
              <div 
                key={product.id}
                className={`bg-white rounded-2xl p-4 border shadow-xs transition-all space-y-3.5 ${
                  isWaiting 
                    ? 'border-amber-400 bg-amber-50/30 ring-1 ring-amber-300' 
                    : 'border-slate-200'
                }`}
              >
                {/* Top Row: Thumbnail + Info */}
                <div className="flex items-start gap-3">
                  <img 
                    src={product.imageUrl} 
                    alt={product.title} 
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        #{product.displayId}
                      </span>
                      <span className="text-xs font-black text-emerald-700">
                        {product.price > 0 ? `${product.price.toLocaleString('fa-IR')} تومان` : 'توافقی'}
                      </span>
                    </div>

                    <a 
                      href={`/product/${product.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-bold text-slate-900 hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5 text-sm line-clamp-1"
                    >
                      <span className="truncate">{product.title}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </a>

                    <div className="text-xs font-bold text-purple-700 mt-1 truncate">
                      🎨 هنرمند: {product.artistName}
                    </div>
                  </div>
                </div>

                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                  {/* Shipping mode */}
                  {product.shippingMode === 'HONARHUB_WAREHOUSE' ? (
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg font-bold">
                      📦 انبار هنرهاب
                    </span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                      🎨 کارگاه هنرمند
                    </span>
                  )}

                  {/* Stock Quantity */}
                  <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-lg">
                    موجودی: {product.stockQuantity || 0}
                  </span>

                  {/* Pre-order */}
                  {product.isPreOrderEnabled ? (
                    <span className="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-lg font-bold">
                      ✓ پیش‌سفارش
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg font-medium">
                      بدون پیش‌سفارش
                    </span>
                  )}
                </div>

                {/* Publish Toggle Row */}
                <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      dir="ltr"
                      onClick={() => handleToggleStatus(product)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${product.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      title={product.status === 'APPROVED' ? 'غیرفعال کردن اثر در سایت' : 'فعال کردن و انتشار اثر در سایت'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          product.status === 'APPROVED' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-bold text-slate-800">
                      {product.status === 'APPROVED' ? 'منتشر شده' : 'غیرفعال'}
                    </span>
                  </div>

                  {isWaiting && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      در انتظار بررسی
                    </span>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  {isWaiting && (
                    <button 
                      type="button"
                      onClick={() => setReviewModalProduct(product)} 
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>{product.hasPendingEdits ? 'بررسی تغییرات' : 'بررسی و تایید'}</span>
                    </button>
                  )}

                  <a 
                    href={`/admin/products/${product.id}/edit`} 
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <span>ویرایش اثر</span>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table Layout (>= md) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">کد محصول</th>
                <th className="px-6 py-4">تصویر</th>
                <th className="px-6 py-4">عنوان محصول</th>
                <th className="px-6 py-4">صاحب اثر (هنرمند)</th>
                <th className="px-6 py-4">قیمت (تومان)</th>
                <th className="px-6 py-4 text-center">نحوه ارسال</th>
                <th className="px-6 py-4 text-center">پیش‌سفارش</th>
                <th className="px-6 py-4 text-center">موجودی</th>
                <th className="px-6 py-4 text-center">وضعیت انتشار</th>
                <th className="px-6 py-4 text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-500 font-medium">در حال بارگذاری...</td>
                </tr>
              ) : sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-500 font-medium">محصولی برای نمایش وجود ندارد.</td>
                </tr>
              ) : sortedProducts.map((product) => {
                const isWaiting = isPending(product);
                return (
                  <tr 
                    key={product.id} 
                    className={`transition-colors ${
                      isWaiting 
                        ? 'bg-amber-50/40 hover:bg-amber-100/60 border-r-4 border-r-amber-500' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-black text-slate-800 text-lg">#{product.displayId}</span>
                      <span className="text-xs text-slate-400 font-mono tracking-tighter" title={product.id}>{product.id.substring(0,8)}...</span>
                    </div>
                  </td>
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
                  <td className="px-6 py-4 text-center">
                    {product.shippingMode === 'HONARHUB_WAREHOUSE' ? (
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                        📦 انبار هنرهاب
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                        🎨 کارگاه هنرمند
                      </span>
                    )}
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
                    {product.stockQuantity || 0}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <button 
                        type="button"
                        dir="ltr"
                        onClick={() => handleToggleStatus(product)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${product.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        title={product.status === 'APPROVED' ? 'غیرفعال کردن اثر در سایت' : 'فعال کردن و انتشار اثر در سایت'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            product.status === 'APPROVED' ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      {product.status === 'APPROVED' ? (
                        <span className="text-[11px] font-bold text-emerald-700">فعال (منتشر شده)</span>
                      ) : (product.hasPendingEdits || product.status === 'PENDING') ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          در انتظار تایید
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-500">غیرفعال</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex justify-end items-center gap-2">
                      {(product.hasPendingEdits || product.status === 'PENDING') && (
                        <button 
                          onClick={() => setReviewModalProduct(product)} 
                          title={product.hasPendingEdits ? "بررسی تغییرات پیشنهادی اثر" : "بررسی و تایید محصول جدید"} 
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors border shadow-2xs cursor-pointer ${
                            product.hasPendingEdits
                              ? 'text-amber-800 bg-amber-100 hover:bg-amber-200 border-amber-300'
                              : 'text-purple-700 bg-purple-100 hover:bg-purple-200 border-purple-300'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      )}
                      <a href={`/admin/products/${product.id}/edit`} title="ویرایش" className="text-blue-600 hover:bg-blue-50 w-8 h-8 flex items-center justify-center rounded-lg transition-colors border border-transparent hover:border-blue-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
