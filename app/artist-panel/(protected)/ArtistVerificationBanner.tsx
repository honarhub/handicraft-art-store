'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Props {
  verificationLevel: number;
  isApproved: boolean;
  brandName?: string | null;
  hasPendingEdits?: boolean;
}

export default function ArtistVerificationBanner({
  verificationLevel,
  isApproved,
  brandName,
  hasPendingEdits = false
}: Props) {
  const [level, setLevel] = useState<number>(verificationLevel);
  const [approved, setApproved] = useState<boolean>(isApproved);
  const [pending, setPending] = useState<boolean>(hasPendingEdits);
  const [currentBrandName, setCurrentBrandName] = useState<string | null>(brandName || null);

  useEffect(() => {
    setLevel(verificationLevel);
    setApproved(isApproved);
    setPending(hasPendingEdits);
    if (brandName) setCurrentBrandName(brandName);
  }, [verificationLevel, isApproved, hasPendingEdits, brandName]);

  // Event & Focus-based syncing (Zero background periodic polling)
  useEffect(() => {
    const handleStatusUpdate = (e: any) => {
      if (e.detail) {
        if (typeof e.detail.hasPendingEdits === 'boolean') {
          setPending(e.detail.hasPendingEdits);
        }
        if (typeof e.detail.verificationLevel === 'number') {
          setLevel(e.detail.verificationLevel);
        }
        if (typeof e.detail.isApproved === 'boolean') {
          setApproved(e.detail.isApproved);
        }
        if (e.detail.brandName) {
          setCurrentBrandName(e.detail.brandName);
        }
      }
    };

    window.addEventListener('artist-status-updated', handleStatusUpdate);

    // Fetch once when component mounts or when user focuses/switches to this tab
    const checkLiveStatus = async () => {
      try {
        const res = await fetch('/api/artist/counts', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.hasPendingEdits === 'boolean') {
            setPending(data.hasPendingEdits);
          }
          if (typeof data.verificationLevel === 'number') {
            setLevel(data.verificationLevel);
          }
          if (typeof data.isApproved === 'boolean') {
            setApproved(data.isApproved);
          }
          if (data.brandName) {
            setCurrentBrandName(data.brandName);
          }

          // Broadcast to other components in page (e.g. profile page)
          window.dispatchEvent(new CustomEvent('artist-status-updated', { detail: data }));
        }
      } catch {
        // silent on network error
      }
    };

    // Check once on mount and on tab focus (NO interval polling)
    checkLiveStatus();
    window.addEventListener('focus', checkLiveStatus);

    return () => {
      window.removeEventListener('artist-status-updated', handleStatusUpdate);
      window.removeEventListener('focus', checkLiveStatus);
    };
  }, []);

  // When admin gives final approval (Level >= 2 and not pending), the top banner is NOT displayed.
  // Remaining verification steps are handled inside the dedicated verification tab.
  if (approved && level >= 2 && !pending) {
    return null;
  }

  // --- CASE A: Pending Admin Review ---
  if (pending) {
    return (
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-amber-950 text-white rounded-3xl p-5 sm:p-6 mb-8 border border-amber-900/40 shadow-xl relative overflow-hidden transition-all" dir="rtl">
        <div className="absolute top-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-black bg-amber-400 text-slate-950 px-3 py-1 rounded-full shadow-sm">
                <span>⭐</span>
                <span>سطح {level}</span>
              </span>

              <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>در انتظار بررسی و تایید ادمین</span>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-white">
              {currentBrandName || 'فروشگاه هنری شما'}
            </h3>

            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
              اطلاعات پروفایل شما با موفقیت ارسال شد و در صف بررسی ناظر قرار دارد. لطفاً تا بررسی ادمین منتظر بمانید.
            </p>

            {/* Gauge showing 70% in yellow */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-medium text-slate-300">
                <span>وضعیت پیشرفت مدارک</span>
                <span className="font-mono text-amber-400 font-bold text-sm">۷۰٪</span>
              </div>
              <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden flex">
                <div className="bg-amber-400 animate-pulse h-2.5 w-[70%] rounded-full shadow-sm"></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 justify-center flex-shrink-0">
            <Link
              href="/artist-panel/profile"
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-2xl transition-all border border-slate-700 text-xs sm:text-sm"
            >
              <span>مشاهده اطلاعات ارسالی</span>
              <span>←</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- CASE B: Level 1 (Completed Onboarding, Profile not yet submitted or rejected) ---
  return (
    <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-5 sm:p-6 mb-8 border border-teal-900/40 shadow-xl relative overflow-hidden transition-all" dir="rtl">
      <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-black bg-emerald-500 text-slate-950 px-3 py-1 rounded-full uppercase tracking-wider">
              <span>⭐</span>
              <span>احراز هویت: سطح ۱ از ۳</span>
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-white">
            {currentBrandName || 'فروشگاه هنری شما'}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            در حال حاضر می‌توانید محصولات خود را ثبت نمایید ولی برای نمایش عمومی نیاز هست پروفایل خود را تکمیل نمایید
          </p>

          {/* Progress Bar 35% */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>درصد تکمیل مدارک</span>
              <span className="font-mono text-emerald-400 font-bold">۳۵٪</span>
            </div>
            <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden">
              <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500 w-[35%]"></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 justify-center flex-shrink-0">
          <Link
            href="/artist-panel/profile"
            className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-500/25 text-xs sm:text-sm whitespace-nowrap"
          >
            <span>تکمیل پروفایل و ارتقای احراز هویت</span>
            <span>←</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
