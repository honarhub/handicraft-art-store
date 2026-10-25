'use client';

import React, { useState } from 'react';

export interface FeedbackHistoryItem {
  id?: string;
  message: string;
  status?: string;
  createdAt?: string;
  read?: boolean;
}

interface ArtistProductFeedbackButtonProps {
  productId: string;
  productTitle: string;
  adminFeedback?: string | null;
  adminFeedbackHistory?: any;
  adminFeedbackRead?: boolean;
  status: string;
  onRead?: () => void;
}

export default function ArtistProductFeedbackButton({
  productId,
  productTitle,
  adminFeedback,
  adminFeedbackHistory,
  adminFeedbackRead = false,
  status,
  onRead
}: ArtistProductFeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRead, setIsRead] = useState<boolean>(Boolean(adminFeedbackRead));

  // Sync local state when prop updates
  React.useEffect(() => {
    setIsRead(Boolean(adminFeedbackRead));
  }, [adminFeedbackRead]);

  // Extract up to 3 recent feedback history items
  let historyItems: FeedbackHistoryItem[] = [];
  if (Array.isArray(adminFeedbackHistory)) {
    historyItems = adminFeedbackHistory;
  } else if (typeof adminFeedbackHistory === 'string') {
    try {
      const parsed = JSON.parse(adminFeedbackHistory);
      if (Array.isArray(parsed)) historyItems = parsed;
    } catch {}
  }

  // Fallback to single item if history array is not populated
  if (historyItems.length === 0 && adminFeedback && adminFeedback.trim()) {
    historyItems = [{
      message: adminFeedback,
      status: status,
      read: adminFeedbackRead
    }];
  }

  // If no admin message exists, render dash
  if (historyItems.length === 0 && (!adminFeedback || !adminFeedback.trim())) {
    return <span className="text-slate-300 font-bold select-none">-</span>;
  }

  // Unread status indicator
  const hasUnread = !isRead && (
    Boolean(adminFeedback?.trim()) || historyItems.some(item => !item.read)
  );

  const handleOpen = async () => {
    setIsOpen(true);
    if (!isRead) {
      setIsRead(true);
      // Dispatch real-time event to immediately clear badge across panels
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('artist-counts-update'));
      }
      if (onRead) onRead();

      try {
        await fetch(`/api/products/${productId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'markFeedbackRead' })
        });
      } catch (err) {
        console.error('Failed to mark feedback as read', err);
      }
    }
  };

  const formatJalaliDate = (dateStr?: string) => {
    if (!dateStr) return 'ثبت شده در آخرین بررسی';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (itemStatus?: string) => {
    switch (itemStatus) {
      case 'APPROVED':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            تایید شده
          </span>
        );
      case 'REJECTED':
        return (
          <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            نیازمند اصلاح / رد شده
          </span>
        );
      default:
        return (
          <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            در انتظار تایید
          </span>
        );
    }
  };

  return (
    <>
      {/* دکمه نوتیفیکیشن / آیکون در سطر جدول */}
      <button
        type="button"
        onClick={handleOpen}
        title={hasUnread ? 'پیام جدید از ادمین (کلیک جهت مشاهده)' : 'مشاهده تاریخچه پیام‌های ادمین'}
        className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all cursor-pointer ${
          hasUnread
            ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 shadow-sm ring-2 ring-amber-400/30'
            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 hover:text-slate-800'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>

        {/* بج نوتیفیکیشن در صورت وجود پیام خوانده‌نشده */}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5" dir="ltr">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-white text-[8px] text-white font-black items-center justify-center">
              !
            </span>
          </span>
        )}
      </button>

      {/* مودال پاپ‌آپ تاریخچه پیام‌های ادمین */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* سربرگ مودال */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center text-xl shrink-0">
                  💬
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-base">پیام‌ها و بازخوردهای ادمین</h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium line-clamp-1">
                    اثر: {productTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* بدنه مودال: تایم‌لاین حداکثر ۳ پیام آخر */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
                <span>سوابق آخرین بررسی‌های ادمین (تا ۳ مورد اخیر):</span>
                <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  {historyItems.length} پیام ثبت شده
                </span>
              </div>

              <div className="relative pr-4 border-r-2 border-teal-100 space-y-6 mr-2">
                {historyItems.slice(0, 3).map((item, index) => (
                  <div key={item.id || index} className="relative group">
                    {/* نقطه تایم‌لاین */}
                    <div className="absolute -right-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-teal-500 border-2 border-white ring-2 ring-teal-100 group-first:bg-teal-600"></div>

                    {/* هدر آیتم: وضعیت + تاریخ */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
                        {index === 0 && (
                          <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded font-bold">
                            آخرین پاسخ
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {formatJalaliDate(item.createdAt)}
                      </span>
                    </div>

                    {/* کادر متن پیام */}
                    <div className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed border ${
                      item.status === 'REJECTED'
                        ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                        : item.status === 'APPROVED'
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <p className="whitespace-pre-wrap">{item.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* فوتر مودال */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                متوجه شدم و بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
