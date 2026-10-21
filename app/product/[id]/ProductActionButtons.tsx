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

            {/* Quick Messengers (Telegram, WhatsApp, Bale) */}
            <div className="grid grid-cols-3 gap-3 my-2">
              <a 
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-sky-50/70 hover:bg-sky-100/80 border border-sky-100 text-slate-700 hover:text-sky-700 transition-all group"
                title="اشتراک در تلگرام"
              >
                <div className="transition-transform group-hover:scale-110">
                  <svg className="w-9 h-9 drop-shadow-xs" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="24" cy="24" r="24" fill="#24A1DE"/>
                    <path d="M34.5 13.5L10.5 22.8C9.5 23.2 9.5 23.8 10.3 24.1L16.5 26L30.9 16.9C31.6 16.5 32.2 16.7 31.7 17.2L20 27.7V33C20.6 33 20.8 32.7 21.2 32.3L24.1 29.5L30.1 33.9C31.2 34.5 32 34.2 32.3 32.9L36.2 14.6C36.6 13 35.6 12.3 34.5 13.5Z" fill="white"/>
                  </svg>
                </div>
                <span className="text-xs font-bold">تلگرام</span>
              </a>

              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title + '\n' + shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-100 text-slate-700 hover:text-emerald-700 transition-all group"
                title="اشتراک در واتس‌اپ"
              >
                <div className="transition-transform group-hover:scale-110">
                  <svg className="w-9 h-9 drop-shadow-xs" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="24" cy="24" r="24" fill="#25D366"/>
                    <path d="M34.3 13.7C31.6 11 27.9 9.5 24 9.5C16 9.5 9.5 16 9.5 24C9.5 26.6 10.2 29.1 11.5 31.3L9 40.5L18.4 38C20.5 39.1 22.2 39.7 24 39.7C32 39.7 38.5 33.2 38.5 25.2C38.5 21.3 37 17.6 34.3 13.7ZM24 37.2C22.4 37.2 20.8 36.8 19.4 36L18.9 35.7L13.3 37.2L14.8 31.8L14.5 31.3C13.6 29.9 13.1 28.2 13.1 26.5C13.1 19.3 19 13.4 26.2 13.4C29.7 13.4 33 14.8 35.5 17.3C38 19.8 39.4 23.1 39.4 26.6C39.4 33.8 33.5 37.2 24 37.2ZM30.4 28.7C30 28.5 28.3 27.7 28 27.5C27.7 27.3 27.5 27.2 27.3 27.6C27.1 28 26.5 28.7 26.3 28.9C26.1 29.1 25.9 29.1 25.5 28.9C25.1 28.7 23.9 28.3 22.4 27C21.2 25.9 20.4 24.6 20.2 24.2C20 23.8 20.2 23.6 20.4 23.4C20.6 23.2 20.8 22.9 21 22.7C21.2 22.5 21.3 22.3 21.4 22.1C21.5 21.9 21.5 21.7 21.4 21.5C21.3 21.3 20.7 19.9 20.4 19.3C20.1 18.7 19.8 18.8 19.6 18.8C19.4 18.8 19.2 18.8 19 18.8C18.8 18.8 18.4 18.9 18.1 19.2C17.8 19.5 16.9 20.3 16.9 22C16.9 23.7 18.1 25.3 18.3 25.5C18.5 25.7 20.7 29.1 24.1 30.6C24.9 31 25.6 31.2 26.1 31.4C27 31.7 27.8 31.6 28.4 31.5C29.1 31.4 30.6 30.6 30.9 29.7C31.2 28.8 31.2 28.1 31.1 27.9C31 27.8 30.8 27.7 30.4 27.5Z" fill="white"/>
                  </svg>
                </div>
                <span className="text-xs font-bold">واتس‌اپ</span>
              </a>

              <a 
                href={`https://ble.ir/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-teal-50/70 hover:bg-teal-100/80 border border-teal-100 text-slate-700 hover:text-teal-700 transition-all group"
                title="اشتراک در پیام‌رسان بله"
              >
                <div className="transition-transform group-hover:scale-110">
                  <svg className="w-9 h-9 drop-shadow-xs" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="24" cy="24" r="24" fill="#00A693"/>
                    <path d="M24 12C17.37 12 12 17.37 12 24C12 26.24 12.61 28.34 13.68 30.15L12.5 35.5L17.97 34.35C19.74 35.39 21.8 36 24 36C30.63 36 36 30.63 36 24C36 17.37 30.63 12 24 12ZM21.5 17.5C23.43 17.5 25 19.07 25 21C25 22.93 23.43 24.5 21.5 24.5C19.57 24.5 18 22.93 18 21C18 19.07 19.57 17.5 21.5 17.5ZM26.5 30.5C24.57 30.5 23 28.93 23 27C23 25.07 24.57 23.5 26.5 23.5C28.43 23.5 30 25.07 30 27C30 28.93 28.43 30.5 26.5 30.5Z" fill="white"/>
                  </svg>
                </div>
                <span className="text-xs font-bold">بله</span>
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
