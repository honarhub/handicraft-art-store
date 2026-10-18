'use client';

import React, { useState, useEffect } from 'react';

interface ProductActionButtonsProps {
  productId: string;
  title: string;
}

export default function ProductActionButtons({ productId, title }: ProductActionButtonsProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize wishlist state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('honarhub_wishlist');
      if (saved) {
        const list: string[] = JSON.parse(saved);
        if (Array.isArray(list) && list.includes(productId)) {
          setIsWishlisted(true);
        }
      }
    } catch (e) {
      console.error('Error reading wishlist', e);
    }
  }, [productId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const toggleWishlist = () => {
    try {
      const saved = localStorage.getItem('honarhub_wishlist');
      let list: string[] = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(list)) list = [];

      if (isWishlisted) {
        list = list.filter(id => id !== productId);
        setIsWishlisted(false);
        showToast('محصول از لیست نشان‌شده‌ها (علاقه‌مندی‌ها) حذف شد.');
      } else {
        list.push(productId);
        setIsWishlisted(true);
        showToast('محصول با موفقیت به لیست نشان‌شده‌ها (علاقه‌مندی‌ها) اضافه شد.');
      }
      localStorage.setItem('honarhub_wishlist', JSON.stringify(list));
      window.dispatchEvent(new Event('wishlist-updated'));
    } catch (e) {
      console.error('Error saving wishlist', e);
    }
  };

  const handleShare = async () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    
    // Check if Web Share API is available (especially on mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `دست‌سازه ${title} در هنرهاب`,
          text: `مشاهده و خرید اثر هنری دست‌ساز «${title}» در پلتفرم هنرهاب:`,
          url: currentUrl
        });
        return;
      } catch (err: any) {
        // If user cancelled, don't fallback to modal
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: Open share modal
    setShowShareModal(true);
  };

  const handleCopyLink = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      showToast('لینک محصول با موفقیت در کلیپ‌بورد کپی شد.');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center gap-2">
        {/* Wishlist / Bookmark Button */}
        <button
          type="button"
          onClick={toggleWishlist}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
            isWishlisted
              ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-xs scale-105'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
          }`}
          title={isWishlisted ? 'حذف از نشان‌شده‌ها' : 'نشان کردن و ذخیره برای بعد'}
          aria-label="ذخیره در علاقه‌مندی‌ها"
        >
          {isWishlisted ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
          )}
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="w-9 h-9 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
          title="اشتراک‌گذاری اثر"
          aria-label="اشتراک‌گذاری محصول"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        </button>
      </div>

      {/* Share Modal Dialog */}
      {showShareModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                <span>📤 اشتراک‌گذاری این اثر</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              لینک صفحه این اثر را کپی کرده یا مستقیماً در پیام‌رسان‌ها به اشتراک بگذارید:
            </p>

            {/* Quick Messengers */}
            <div className="grid grid-cols-4 gap-2.5 my-1">
              <a 
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-600 transition-colors"
                title="تلگرام"
              >
                <span className="text-xl">✈️</span>
                <span className="text-[10px] font-bold">تلگرام</span>
              </a>

              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title + '\n' + shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 transition-colors"
                title="واتس‌اپ"
              >
                <span className="text-xl">💬</span>
                <span className="text-[10px] font-bold">واتس‌اپ</span>
              </a>

              <a 
                href={`https://eitaa.com/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 transition-colors"
                title="ایتا"
              >
                <span className="text-xl">🟠</span>
                <span className="text-[10px] font-bold">ایتا</span>
              </a>

              <a 
                href={`https://ble.ir/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition-colors"
                title="بله"
              >
                <span className="text-xl">🔷</span>
                <span className="text-[10px] font-bold">بله</span>
              </a>
            </div>

            {/* Copy Link Input */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5">
              <input 
                type="text" 
                readOnly 
                value={shareUrl} 
                className="w-full text-xs text-slate-600 bg-transparent outline-none px-2 font-mono text-left" 
                dir="ltr"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {copied ? 'کپی شد ✓' : 'کپی لینک'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
