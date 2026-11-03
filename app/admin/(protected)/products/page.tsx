'use client';

import React, { useState, useEffect } from 'react';
import AdminPromptModal from '@/app/components/AdminPromptModal';
import ProductReviewEditsModal from '@/app/components/ProductReviewEditsModal';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search, Sort and Archive states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortPrice, setSortPrice] = useState<'none' | 'asc' | 'desc'>('none');
  const [showArchived, setShowArchived] = useState(false);
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, id: string}>({isOpen: false, id: ''});
  const [reviewModalProduct, setReviewModalProduct] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/products?includeArchived=true', { cache: 'no-store' })
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

  const DEFAULT_REJECTION_FEEDBACK = 'این اثر با قوانین و استانداردهای کیفی گالری هنرهاب مطابقت ندارد. لطفاً اطلاعات و تصاویر را بازبینی فرمایید.';

  const handleToggleStatus = async (product: any) => {
    const isApproved = product.status === 'APPROVED';
    if (isApproved) {
      // اگر محصول فعال است و قرار است غیرفعال/رد شود، دلیل رد را از ادمین می‌خواهیم
      setModalConfig({ isOpen: true, id: product.id });
      return;
    }
    // در صورت فعال‌سازی مجدد محصول:
    await handleUpdateStatus(product.id, 'APPROVED', '');
  };

  const handleUpdateStatus = async (id: string, status: string, feedback: string = '') => {
    let finalFeedback = feedback?.trim() || '';
    if (status === 'REJECTED' && !finalFeedback) {
      finalFeedback = DEFAULT_REJECTION_FEEDBACK;
    }

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateStatus', status, adminFeedback: finalFeedback })
      });
      if (!res.ok) throw new Error('خطا در بروزرسانی');
      
      setProducts(products.map(p => p.id === id ? { ...p, status, adminFeedback: finalFeedback } : p));
      window.dispatchEvent(new CustomEvent('admin-counts-update'));
    } catch (err) {
      alert('خطا در اعمال تغییرات');
    }
  };

  const submitReject = (reason: string) => {
    const id = modalConfig.id;
    setModalConfig({ isOpen: false, id: '' });
    const finalReason = reason && reason.trim() ? reason.trim() : DEFAULT_REJECTION_FEEDBACK;
    handleUpdateStatus(id, 'REJECTED', finalReason);
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
    const finalFeedback = feedback?.trim() || DEFAULT_REJECTION_FEEDBACK;
    const product = products.find(p => p.id === id);
    if (product?.hasPendingEdits) {
      await handleRejectPendingEdits(id, finalFeedback);
    } else {
      await handleUpdateStatus(id, 'REJECTED', finalFeedback);
      setReviewModalProduct(null);
    }
  };

  const handleSoftDelete = async (id: string, title?: string) => {
    const confirm = window.confirm(`آیا از حذف / بایگانی محصول «${title || ''}» اطمینان دارید؟`);
    if (confirm) {
      try {
        const res = await fetch(`/api/products/${id}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('خطا در حذف محصول');

        setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'ARCHIVED', deletedAt: new Date().toISOString() } : p));
        window.dispatchEvent(new CustomEvent('admin-counts-update'));
      } catch (error) {
        alert('عملیات با خطا مواجه شد');
      }
    }
  };

  const handleRestoreProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restoreProduct' })
      });
      if (!res.ok) throw new Error('خطا در بازیابی محصول');

      setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'PENDING', deletedAt: null } : p));
      window.dispatchEvent(new CustomEvent('admin-counts-update'));
      alert('محصول با موفقیت از بایگانی خارج شد و به وضعیت در انتظار تایید منتقل گردید.');
    } catch (error) {
      alert('عملیات با خطا مواجه شد');
    }
  };

  // Filter and Sort Logic
  const filteredProducts = products.filter(p => {
    const isArchived = Boolean(p.deletedAt || p.status === 'ARCHIVED');
    if (showArchived && !isArchived) return false;
    if (!showArchived && isArchived) return false;

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
        
        <div className="w-full md:w-auto flex flex-wrap items-center justify-between md:justify-start gap-3">
          <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-medium cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
            <input 
              type="checkbox" 
              checked={showArchived} 
              onChange={e => setShowArchived(e.target.checked)} 
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer" 
            />
            نمایش بایگانی شده‌ها
          </label>

          <div className="flex items-center gap-2">
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
            const isArchived = Boolean(product.deletedAt || product.status === 'ARCHIVED');
            return (
              <div 
                key={product.id}
                className={`bg-white rounded-2xl p-4 border shadow-xs transition-all space-y-3.5 ${
                  isArchived
                    ? 'border-slate-300 bg-slate-50/50 opacity-80'
                    : isWaiting 
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

                  {isArchived && (
                    <span className="bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg">
                      بایگانی شده
                    </span>
                  )}
                </div>

                {/* Publish Toggle Row */}
                <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
                  {isArchived ? (
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                      وضعیت: بایگانی شده
                    </span>
                  ) : (
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
                  )}

                  {isWaiting && !isArchived && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      در انتظار بررسی
                    </span>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  {isArchived ? (
                    <button 
                      type="button" 
                      onClick={() => handleRestoreProduct(product.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-purple-200 cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                      <span>بازیابی اثر</span>
                    </button>
                  ) : (
                    <>
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

                      <button 
                        type="button"
                        onClick={() => handleSoftDelete(product.id, product.title)}
                        title="حذف و بایگانی محصول"
                        className="p-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-200 cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </>
                  )}
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
                const isArchived = Boolean(product.deletedAt || product.status === 'ARCHIVED');
                return (
                  <tr 
                    key={product.id} 
                    className={`transition-colors ${
                      isArchived
                        ? 'bg-slate-50/70 opacity-75'
                        : isWaiting 
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
                    {isArchived ? (
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                        بایگانی شده
                      </span>
                    ) : (
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
                    )}
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex justify-end items-center gap-2">
                      {isArchived ? (
                        <button 
                          onClick={() => handleRestoreProduct(product.id)} 
                          title="بازیابی اثر از بایگانی" 
                          className="text-purple-600 hover:bg-purple-50 w-8 h-8 flex items-center justify-center rounded-lg transition-colors border border-transparent hover:border-purple-200 cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                        </button>
                      ) : (
                        <>
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
                          <button 
                            onClick={() => handleSoftDelete(product.id, product.title)} 
                            title="حذف و بایگانی محصول" 
                            className="text-red-500 hover:bg-red-50 w-8 h-8 flex items-center justify-center rounded-lg transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </>
                      )}
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
