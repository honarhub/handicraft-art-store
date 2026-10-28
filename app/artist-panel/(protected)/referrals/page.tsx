'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ReferralCodeItem {
  id: string;
  code: string;
  isUsed: boolean;
  usedAt?: string | null;
  createdAt: string;
  usedBy?: {
    id: string;
    name?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    artistProfile?: {
      displayId: number;
      brandName?: string | null;
    } | null;
  } | null;
}

export default function ArtistReferralsPage() {
  const [codes, setCodes] = useState<ReferralCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch('/api/artist/referrals', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در دریافت کدهای معرف');
      }
      setCodes(data.codes || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در برقراری ارتباط');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((current) => (current === msg ? null : current));
    }, 2000);
  };

  const getRegisterUrl = (code: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/artist-panel/login?tab=register&ref=${encodeURIComponent(code)}`;
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast(`کد معرف «${code}» در کلیپ‌بورد کپی شد.`);
    } catch {
      showToast('خطا در کپی کردن کد.');
    }
  };

  const handleCopyLink = async (code: string) => {
    const url = getRegisterUrl(code);
    try {
      await navigator.clipboard.writeText(url);
      showToast('لینک مستقیم ثبت‌نام در کلیپ‌بورد کپی شد.');
    } catch {
      showToast('خطا در کپی کردن لینک.');
    }
  };

  const handleShare = async (code: string) => {
    const url = getRegisterUrl(code);
    const title = 'دعوت‌نامه اختصاصی عضویت در خانواده هنرهاب';
    const text = `سلام! شما از طرف من به پلتفرم تخصصی دست‌سازه‌های ایرانی «هنرهاب» دعوت شده‌اید. می‌توانید با کد معرف ${code} ثبت‌نام کنید:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: copy link
    handleCopyLink(code);
  };

  const activeCodes = codes.filter((c) => !c.isUsed);
  const usedCodes = codes.filter((c) => c.isUsed);

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans pb-16" dir="rtl">
      {/* 2-Second Floating Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-slate-700 text-sm font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="text-emerald-400 text-lg">✓</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute -left-12 -top-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-black border border-teal-400/30">
              <span>🤝</span>
              <span>باشگاه دعوت هنرمندان برگزیده</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              معرفی از هنرمندان (کدهای دعوت اختصاصی)
            </h1>
            <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed">
              شما به عنوان هنرمند تایید شده در هنرهاب، دارای <strong className="text-amber-300 font-black">۵ کد معرف اختصاصی</strong> هستید تا در اختیار همکاران و هنرمندان دیگر قرار دهید. هر کد یکبار مصرف است و پس از ثبت‌نام موفق، می‌سوزد.
            </p>
          </div>

          {/* Quick Counter Badge */}
          <div className="flex md:flex-col gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 text-center">
              <span className="text-xs text-teal-200 block mb-0.5">کدهای قابل استفاده</span>
              <span className="text-2xl font-black text-emerald-300">{activeCodes.length} از ۵</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 text-center">
              <span className="text-xs text-teal-200 block mb-0.5">استفاده شده</span>
              <span className="text-2xl font-black text-slate-300">{usedCodes.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={fetchCodes}
            className="text-xs text-red-900 underline font-black hover:opacity-80"
          >
            تلاش مجدد
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-600">در حال آماده‌سازی کدهای معرف شما...</p>
        </div>
      )}

      {/* Referral Cards Grid */}
      {!loading && codes.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span>🎟️</span>
              <span>کدهای اختصاصی شما (مجموعاً ۵ سهمیه)</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              برای اشتراک‌گذاری روی هر کد کلیک کنید
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {codes.map((item, index) => {
              if (item.isUsed) {
                // Used Code Card: Grayed out with line-through
                return (
                  <div
                    key={item.id || index}
                    className="bg-slate-100/90 border-2 border-slate-300 rounded-3xl p-6 shadow-sm relative overflow-hidden transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-200 text-slate-600">
                          کد #{index + 1}
                        </span>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-300 text-slate-700 flex items-center gap-1">
                          <span>❌</span>
                          <span>استفاده شده (سوخته)</span>
                        </span>
                      </div>

                      {/* Strikethrough Code */}
                      <div className="py-4 text-center border-y border-dashed border-slate-300 my-2">
                        <span className="font-mono text-2xl sm:text-3xl font-black text-slate-400 line-through tracking-widest select-none">
                          {item.code}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 text-xs text-slate-500 space-y-1">
                      {item.usedBy && (
                        <p className="font-medium text-slate-700">
                          عضو شده: <strong className="font-black text-slate-800">{item.usedBy.name || item.usedBy.artistProfile?.brandName || 'هنرمند همکار'}</strong>
                        </p>
                      )}
                      {item.usedAt && (
                        <p className="text-[11px] text-slate-400">
                          تاریخ استفاده: {new Date(item.usedAt).toLocaleDateString('fa-IR')}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 italic">
                        این کد سهمیه یکبار مصرف بود و دیگر قابل استفاده مجدد نیست.
                      </p>
                    </div>
                  </div>
                );
              }

              // Active Code Card: Vibrant Deep Green
              return (
                <div
                  key={item.id || index}
                  className="bg-emerald-50/90 border-2 border-emerald-500 rounded-3xl p-6 shadow-md hover:shadow-lg transition-all relative overflow-hidden flex flex-col justify-between group"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-200/80 text-emerald-900">
                        کد #{index + 1}
                      </span>
                      <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-600 text-white shadow-sm flex items-center gap-1 animate-pulse">
                        <span>✓</span>
                        <span>قابل استفاده</span>
                      </span>
                    </div>

                    {/* Bold Green Code Display */}
                    <div className="py-4 text-center border-y border-dashed border-emerald-300 my-2 bg-white/70 rounded-2xl">
                      <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-800 tracking-widest select-all block">
                        {item.code}
                      </span>
                      <span className="text-[11px] text-emerald-600 mt-1 block font-medium">
                        یکبار مصرف برای ثبت‌نام ۱ هنرمند
                      </span>
                    </div>
                  </div>

                  {/* Actions: Copy & Share */}
                  <div className="mt-5 space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyCode(item.code)}
                        className="flex-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-400 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        title="کپی کردن فقط کد معرف"
                      >
                        <span className="text-base">📋</span>
                        <span>کپی کد</span>
                      </button>

                      <button
                        onClick={() => handleCopyLink(item.code)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-emerald-600/20"
                        title="کپی کردن لینک مستقیم ثبت‌نام با این کد"
                      >
                        <span className="text-base">🔗</span>
                        <span>کپی لینک</span>
                      </button>
                    </div>

                    {/* Share Button (Web Share API for Mobile & Desktop) */}
                    <button
                      onClick={() => handleShare(item.code)}
                      className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-900/20"
                    >
                      <span className="text-base">📢</span>
                      <span>اشتراک‌گذاری دعوت‌نامه با دوستان</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Guide Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
          <span>💡</span>
          <span>راهنمای استفاده از کدهای دعوت هنرمندان</span>
        </h3>
        <ul className="text-xs sm:text-sm text-slate-600 space-y-2.5 leading-relaxed list-disc list-inside">
          <li>
            <strong>لینک مستقیم ثبت‌نام:</strong> با فشردن دکمه «کپی لینک» یا «اشتراک‌گذاری»، لینکی تولید می‌شود که به صورت خودکار کد معرف شما را در فرم ثبت‌نام هنرمند قرار می‌دهد و نیازی به تایپ دستی کد توسط کاربر نیست.
          </li>
          <li>
            <strong>سوختن خودکار کد:</strong> به محض اینکه هنرمند مدعو، فرآیند ثبت‌نام خود را با کد شما نهایی کند، کد مربوطه به وضعیت خاکستری (استفاده‌شده) تبدیل شده و سهمیه جدیدی صادر نمی‌شود.
          </li>
          <li>
            <strong>کنترل کیفیت پلتفرم:</strong> این سیستم جهت حفظ کیفیت آثار هنری و جلوگیری از ثبت‌نام‌های فله‌ای طراحی شده است. لطفاً کدهای خود را تنها در اختیار هنرمندان متعهد و دارای آثار شاخص قرار دهید.
          </li>
        </ul>
      </div>
    </div>
  );
}
