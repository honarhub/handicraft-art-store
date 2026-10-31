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

interface ShareModalData {
  code: string;
  url: string;
  title: string;
  text: string;
}

const toPersianDigits = (num: number | string) =>
  String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

export default function ArtistReferralsPage() {
  const [codes, setCodes] = useState<ReferralCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [shareModalData, setShareModalData] = useState<ShareModalData | null>(null);
  const [copiedModalLink, setCopiedModalLink] = useState(false);

  // Send via SMS / Email modal state
  const [sendModalCode, setSendModalCode] = useState<string | null>(null);
  const [sendTarget, setSendTarget] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState('');

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
    const origin = typeof window !== 'undefined' && window.location.origin 
      ? window.location.origin 
      : '';
    return `${origin}/artist-panel/login?invite=${encodeURIComponent(code)}&tab=register`;
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
    const text = `سلام! شما از طرف من به پلتفرم تخصصی دست‌سازه‌های ایرانی «هنرهاب» دعوت شده‌اید. با کد معرف «${code}» می‌توانید ثبت‌نام خود را در لینک زیر تکمیل کنید:`;

    // Check if Web Share API is available (especially on mobile devices)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url
        });
        return;
      } catch (err: any) {
        // If user cancelled, don't fallback to modal
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: Open share modal dialog (matching product page)
    setShareModalData({ code, url, title, text });
  };

  const handleCopyModalLink = () => {
    if (!shareModalData) return;
    navigator.clipboard.writeText(shareModalData.url).then(() => {
      setCopiedModalLink(true);
      showToast('لینک مستقیم دعوت‌نامه با موفقیت در کلیپ‌بورد کپی شد.');
      setTimeout(() => setCopiedModalLink(false), 2500);
    });
  };

  const handleSendInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendModalCode || !sendTarget.trim()) return;

    setSendLoading(true);
    setSendError('');

    try {
      const res = await fetch('/api/referrals/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: sendModalCode,
          target: sendTarget.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error || 'خطا در ارسال دعوت‌نامه');
        return;
      }

      setSendModalCode(null);
      setSendTarget('');
      showToast(data.message || 'دعوت‌نامه با موفقیت ارسال شد.');
    } catch {
      setSendError('خطای غیرمنتظره در برقراری ارتباط با سرور.');
    } finally {
      setSendLoading(false);
    }
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
              دعوت از هنرمندان (کدهای دعوت اختصاصی)
            </h1>
            <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed">
              شما به عنوان هنرمند تایید شده در هنرهاب، دارای کدهای معرف اختصاصی هستید تا در اختیار همکاران و هنرمندان دیگر قرار دهید. هر کد یکبار مصرف است و پس از ثبت‌نام موفق، می‌سوزد.
            </p>
          </div>

          {/* Quick Counter Badge */}
          <div className="flex md:flex-col gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 text-center">
              <span className="text-xs text-teal-200 block mb-0.5">کدهای قابل استفاده</span>
              <span className="text-2xl font-black text-emerald-300">{toPersianDigits(activeCodes.length)} از {toPersianDigits(codes.length)}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 text-center">
              <span className="text-xs text-teal-200 block mb-0.5">استفاده شده</span>
              <span className="text-2xl font-black text-slate-300">{toPersianDigits(usedCodes.length)}</span>
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
              <span>کدهای اختصاصی شما (مجموعاً {toPersianDigits(codes.length)} سهمیه)</span>
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
                          کد #{toPersianDigits(index + 1)}
                        </span>
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-300 text-slate-700 flex items-center gap-1">
                          <span>❌</span>
                          <span>استفاده‌شده (غیرقابل استفاده مجدد)</span>
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
                        کد #{toPersianDigits(index + 1)}
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

                    {/* Direct SMS / Email Send Button */}
                    <button
                      type="button"
                      onClick={() => { setSendModalCode(item.code); setSendTarget(''); setSendError(''); }}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                      title="ارسال مستقیم دعوت‌نامه از طریق پیامک یا ایمیل"
                    >
                      <span className="text-sm">✉️</span>
                      <span>ارسال کد با پیامک یا ایمیل</span>
                    </button>

                    {/* Share Button (Web Share API for Mobile & Desktop) */}
                    <button
                      type="button"
                      onClick={() => handleShare(item.code)}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                      title="اشتراک‌گذاری دعوت‌نامه متناسب با دستگاه"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                      <span>اشتراک‌گذاری در پیام‌رسان‌ها</span>
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
            <strong>اتمام ظرفیت پس از ثبت‌نام:</strong> به محض اینکه هنرمند مدعو، فرآیند ثبت‌نام خود را با کد شما نهایی کند، این کد سهمیه یک‌بار مصرف استفاده‌شده تلقی شده و دیگر قابلیت استفاده مجدد ندارد.
          </li>
          <li>
            <strong>کنترل کیفیت پلتفرم:</strong> این سیستم جهت حفظ اصالت و کیفیت آثار هنری و جلوگیری از ثبت‌نام‌های انبوه و کنترل‌نشده طراحی شده است. لطفاً کدهای خود را تنها در اختیار هنرمندان متعهد و دارای آثار شاخص قرار دهید.
          </li>
        </ul>
      </div>

      {/* Share Modal Dialog matching Product Page */}
      {shareModalData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setShareModalData(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-700"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                <span>اشتراک‌گذاری دعوت‌نامه</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-black">
                  {shareModalData.code}
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setShareModalData(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="بستن"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              لینک دعوت‌نامه را کپی کرده یا مستقیماً در پیام‌رسان‌ها با هنرمند همکار به اشتراک بگذارید:
            </p>

            {/* Quick Messengers (Telegram, WhatsApp, Bale) */}
            <div className="grid grid-cols-3 gap-3 my-2">
              <a 
                href={`https://t.me/share/url?url=${encodeURIComponent(shareModalData.url)}&text=${encodeURIComponent(shareModalData.title + '\n' + shareModalData.text)}`}
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
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareModalData.title + '\n' + shareModalData.text + '\n' + shareModalData.url)}`}
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
                href={`https://ble.ir/share/url?url=${encodeURIComponent(shareModalData.url)}&text=${encodeURIComponent(shareModalData.title + '\n' + shareModalData.text)}`}
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
                value={shareModalData.url} 
                className="w-full text-xs text-slate-600 bg-transparent outline-none px-2 font-mono text-left" 
                dir="ltr"
              />
              <button
                type="button"
                onClick={handleCopyModalLink}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  copiedModalLink 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {copiedModalLink ? 'کپی شد ✓' : 'کپی لینک'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Invite Modal (SMS / Email) */}
      {sendModalCode && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setSendModalCode(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg font-bold">
                  ✉️
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">ارسال مستقیم دعوت‌نامه</h3>
                  <p className="text-xs text-slate-500">ارسال از طریق پیامک یا ایمیل رسمی هنرهاب</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSendModalCode(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInviteSubmit} className="space-y-4">
              {/* Selected Code Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">کد معرف ارسالی:</span>
                <span className="font-mono text-lg font-black text-emerald-800 tracking-wider">
                  {sendModalCode}
                </span>
              </div>

              {/* Target Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  شماره موبایل یا ایمیل همکار هنرمند:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={sendTarget}
                  onChange={(e) => setSendTarget(e.target.value)}
                  placeholder="0912... یا artist@example.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl font-sans text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none text-slate-800 text-left placeholder:text-right"
                  required
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  💡 با وارد کردن شماره موبایل، پیامک رسمی حاوی لینک اختصاصی ثبت‌نام با این کد ارسال می‌شود. با وارد کردن ایمیل، دعوت‌نامه با قالب اختصاصی ارسال خواهد شد.
                </p>
              </div>

              {/* Error display */}
              {sendError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
                  {sendError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSendModalCode(null)}
                  disabled={sendLoading}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={sendLoading || !sendTarget.trim()}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {sendLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>در حال ارسال...</span>
                    </>
                  ) : (
                    <span>ارسال دعوت‌نامه 🚀</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
