'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Props {
  userId: string;
}

export default function PasswordChangeWarningBanner({ userId }: Props) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem(`dismiss_must_change_pwd_${userId}`) === 'true';
      setDismissed(isDismissed);
    } catch {
      setDismissed(false);
    }
  }, [userId]);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(`dismiss_must_change_pwd_${userId}`, 'true');
    } catch {}
  };

  return (
    <div className="bg-red-500 text-white p-3.5 sm:p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3 mb-6 animate-in fade-in" dir="rtl">
      <div className="flex items-center gap-3">
        <span className="text-xl shrink-0">⚠️</span>
        <p className="font-bold text-xs sm:text-sm leading-relaxed">
          رمز عبور شما توسط ادمین تغییر یافته است. برای امنیت حساب، لطفاً هرچه سریع‌تر رمز عبور جدیدی تنظیم کنید.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/artist-panel/security"
          className="bg-white text-red-600 px-3.5 py-1.5 rounded-xl text-xs font-black hover:bg-red-50 transition-colors whitespace-nowrap shadow-xs"
        >
          تغییر رمز عبور
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="w-7 h-7 rounded-xl hover:bg-red-600 text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
          title="بستن این هشدار"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
