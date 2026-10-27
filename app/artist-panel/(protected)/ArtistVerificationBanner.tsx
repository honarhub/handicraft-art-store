'use client';

import React from 'react';
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
  // If approved and fully verified at level 3 without pending edits, don't show the banner
  if (isApproved && verificationLevel >= 3 && !hasPendingEdits) {
    return null;
  }

  // --- CASE A: Level 2 Approved Artists ---
  if (isApproved && verificationLevel >= 2 && !hasPendingEdits) {
    return (
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 mb-8 border border-emerald-900/40 shadow-xl relative overflow-hidden" dir="rtl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-black bg-amber-400 text-slate-950 px-3 py-1 rounded-full shadow-sm">
                <span>⭐</span>
                <span>سطح ۲</span>
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                <span>✓</span>
                <span>فروشگاه شما تایید شده و فعال است</span>
              </span>
            </div>
            
            <h3 className="text-sm sm:text-base font-black text-white">
              {brandName ? `استودیو و گالری ${brandName}` : 'فروشگاه هنری شما'}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              برای واریز مبالغ فروش نیاز به احراز هویت سطح ۳ است که نیاز به ثبت اطلاعات هویتی و مالی (شماره ملی، تصویر کارت ملی و شماره شبا) می‌باشد.
            </p>
          </div>

          <Link
            href="/artist-panel/onboarding"
            className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-500/25 text-xs sm:text-sm shrink-0 whitespace-nowrap"
          >
            <span>ارتقا به سطح ۳ (احراز مالی)</span>
            <span>←</span>
          </Link>
        </div>
      </div>
    );
  }

  // --- CASE B: Pending Admin Review ---
  if (hasPendingEdits) {
    return (
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-amber-950 text-white rounded-3xl p-5 sm:p-6 mb-8 border border-amber-900/40 shadow-xl relative overflow-hidden" dir="rtl">
        <div className="absolute top-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-black bg-amber-400 text-slate-950 px-3 py-1 rounded-full shadow-sm">
                <span>⭐</span>
                <span>سطح {verificationLevel}</span>
              </span>

              <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>در انتظار بررسی و تایید ادمین</span>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-white">
              {brandName ? `استودیو و گالری ${brandName}` : 'فروشگاه هنری شما'}
            </h3>

            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
              اطلاعات پروفایل شما با موفقیت ارسال شد و در صف بررسی ناظر قرار دارد. لطفاً تا بررسی ادمین منتظر بمانید.
            </p>

            {/* Split Progress Bar: 0-35% green (Level 1), 35-70% amber pulse (Level 2 pending) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-medium text-slate-300">
                <span>وضعیت پیشرفت مدارک</span>
                <span className="font-mono text-amber-400">۳۵٪ تایید شده + ۳۵٪ در حال بررسی ادمین</span>
              </div>
              <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden flex">
                <div className="bg-emerald-500 h-2.5 w-[35%]"></div>
                <div className="bg-amber-400 animate-pulse h-2.5 w-[35%]"></div>
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

  // --- CASE C: Level 1 (Completed Onboarding, Profile not yet submitted) ---
  return (
    <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-5 sm:p-6 mb-8 border border-teal-900/40 shadow-xl relative overflow-hidden" dir="rtl">
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
            {brandName ? `استودیو و گالری ${brandName}` : 'فروشگاه هنری شما'}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            در حال حاضر می‌توانید محصولات خود را ثبت نمایید ولی برای نمایش عمومی نیاز هست پروفایل خود را تکمیل نمایید
          </p>

          {/* Progress Bar 35% */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>درصد تکمیل مدارک</span>
              <span className="font-mono text-emerald-400">۳۵٪</span>
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
