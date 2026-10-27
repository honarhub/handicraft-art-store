import React from 'react';
import Link from 'next/link';

interface Props {
  verificationLevel: number;
  isApproved: boolean;
  brandName?: string | null;
}

export default function ArtistVerificationBanner({ verificationLevel, isApproved, brandName }: Props) {
  // If approved and fully verified at level 3, don't show the banner
  if (isApproved && verificationLevel >= 3) {
    return null;
  }

  const levelPercent = verificationLevel === 0 ? 10 : verificationLevel === 1 ? 35 : verificationLevel === 2 ? 70 : 100;

  return (
    <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-5 sm:p-6 mb-8 border border-teal-900/40 shadow-xl relative overflow-hidden" dir="rtl">
      {/* Glow effect */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Left Side: Status & Progress */}
        <div className="space-y-3 max-w-xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-black bg-emerald-500 text-slate-950 px-3 py-1 rounded-full uppercase tracking-wider">
              احراز هویت: سطح {verificationLevel} از ۳
            </span>

            {!isApproved ? (
              <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>در انتظار بررسی و تایید ناظر پلتفرم</span>
              </span>
            ) : (
              <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span>✓</span>
                <span>حساب شما تایید شده و فعال است</span>
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-black text-white">
            {brandName ? `استودیو و گالری ${brandName}` : 'فروشگاه هنری شما'}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {!isApproved ? (
              'شما می‌توانید آثار خود را در پنل ثبت کنید. آثار در وضعیت پیش‌نویس قرار می‌گیرند و پس از تایید توسط ادمین، فروشگاه شما به صورت رسمی و عمومی در سایت اصلی هنرهاب فعال خواهد شد.'
            ) : (
              'برای دریافت نشان اصالت و فعال‌سازی قابلیت واریز درآمدهای فروش، لطفاً مراحل احراز هویت را کامل کنید.'
            )}
          </p>

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>درصد تکمیل مدارک</span>
              <span className="font-mono text-emerald-400">{levelPercent}%</span>
            </div>
            <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-400 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${levelPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Right Side: Action Button */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 justify-center flex-shrink-0">
          <Link
            href="/artist-panel/onboarding"
            className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3 rounded-2xl transition-all shadow-lg shadow-emerald-500/25 text-xs sm:text-sm"
          >
            <span>{verificationLevel >= 3 ? 'مشاهده مدارک ثبت‌شده' : 'تکمیل و ارتقای احراز هویت'}</span>
            <span>←</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
