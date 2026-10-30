'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Props {
  artistId?: string;
  verificationLevel: number;
  isApproved: boolean;
  brandName?: string | null;
  hasPendingEdits?: boolean;
  adminFeedback?: string | null;
}

export default function ArtistVerificationBanner({
  artistId,
  verificationLevel,
  isApproved,
  brandName,
  hasPendingEdits = false,
  adminFeedback
}: Props) {
  const [level, setLevel] = useState<number>(verificationLevel);
  const [approved, setApproved] = useState<boolean>(isApproved);
  const [pending, setPending] = useState<boolean>(hasPendingEdits);
  const [currentBrandName, setCurrentBrandName] = useState<string | null>(brandName || null);
  const [celebrationDismissed, setCelebrationDismissed] = useState<boolean>(true);
  const [generalAlertMsg, setGeneralAlertMsg] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState<boolean>(false);

  const prevPendingRef = React.useRef(hasPendingEdits);
  const prevLevelRef = React.useRef(verificationLevel);
  const prevFeedbackRef = React.useRef(adminFeedback);

  const extractGeneralMsg = (feedback: any) => {
    if (!feedback) return null;
    try {
      const parsed = typeof feedback === 'string' ? JSON.parse(feedback) : feedback;
      if (parsed?._generalMessage && typeof parsed._generalMessage === 'string' && parsed._generalMessage.trim().length > 0) {
        return parsed._generalMessage.trim();
      }
    } catch {}
    return null;
  };

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem(`level2_celebration_dismissed_${artistId || 'default'}`);
      setCelebrationDismissed(isDismissed === 'true');
    } catch {
      setCelebrationDismissed(false);
    }
  }, [artistId]);

  useEffect(() => {
    const msg = extractGeneralMsg(adminFeedback);
    setGeneralAlertMsg(msg);
    if (msg) {
      try {
        const isDismissed = localStorage.getItem(`alert_dismissed_${artistId || 'default'}_${encodeURIComponent(msg)}`);
        setAlertDismissed(isDismissed === 'true');
      } catch {
        setAlertDismissed(false);
      }
    }
  }, [adminFeedback, artistId]);

  const handleDismissCelebration = () => {
    setCelebrationDismissed(true);
    try {
      localStorage.setItem(`level2_celebration_dismissed_${artistId || 'default'}`, 'true');
    } catch {}
  };

  const handleDismissAlert = () => {
    setAlertDismissed(true);
    if (generalAlertMsg) {
      try {
        localStorage.setItem(`alert_dismissed_${artistId || 'default'}_${encodeURIComponent(generalAlertMsg)}`, 'true');
      } catch {}
    }
  };

  const renderGeneralAlert = () => {
    if (!generalAlertMsg || alertDismissed) return null;

    return (
      <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 mb-6 text-amber-200 shadow-lg relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in" dir="rtl">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0 mt-0.5">⚠️</span>
          <div>
            <h4 className="font-black text-amber-300 text-sm sm:text-base mb-1">
              پیام و هشدار ناظر پلتفرم:
            </h4>
            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed whitespace-pre-wrap">
              {generalAlertMsg}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismissAlert}
          className="self-end sm:self-center px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
        >
          متوجه شدم ✕
        </button>
      </div>
    );
  };

  useEffect(() => {
    setLevel(verificationLevel);
    setApproved(isApproved);
    setPending(hasPendingEdits);
    prevPendingRef.current = hasPendingEdits;
    prevLevelRef.current = verificationLevel;
    prevFeedbackRef.current = adminFeedback;
    if (brandName) setCurrentBrandName(brandName);
  }, [verificationLevel, isApproved, hasPendingEdits, brandName, adminFeedback]);

  // Event & Focus-based syncing (Zero background periodic polling)
  useEffect(() => {
    const handleStatusUpdate = (e: any) => {
      if (e.detail) {
        if (typeof e.detail.hasPendingEdits === 'boolean') {
          setPending(e.detail.hasPendingEdits);
          prevPendingRef.current = e.detail.hasPendingEdits;
        }
        if (typeof e.detail.verificationLevel === 'number') {
          setLevel(e.detail.verificationLevel);
          prevLevelRef.current = e.detail.verificationLevel;
        }
        if (typeof e.detail.isApproved === 'boolean') {
          setApproved(e.detail.isApproved);
        }
        if (e.detail.brandName) {
          setCurrentBrandName(e.detail.brandName);
        }
        if (e.detail.adminFeedback !== undefined) {
          prevFeedbackRef.current = e.detail.adminFeedback;
          const msg = extractGeneralMsg(e.detail.adminFeedback);
          setGeneralAlertMsg(msg);
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
          const hasEditsChanged = typeof data.hasPendingEdits === 'boolean' && data.hasPendingEdits !== prevPendingRef.current;
          const hasLevelChanged = typeof data.verificationLevel === 'number' && data.verificationLevel !== prevLevelRef.current;
          const hasFeedbackChanged = data.adminFeedback !== undefined && data.adminFeedback !== prevFeedbackRef.current;

          if (typeof data.hasPendingEdits === 'boolean') {
            setPending(data.hasPendingEdits);
            prevPendingRef.current = data.hasPendingEdits;
          }
          if (typeof data.verificationLevel === 'number') {
            setLevel(data.verificationLevel);
            prevLevelRef.current = data.verificationLevel;
          }
          if (data.adminFeedback !== undefined) {
            prevFeedbackRef.current = data.adminFeedback;
          }
          if (typeof data.isApproved === 'boolean') {
            setApproved(data.isApproved);
          }
          if (data.brandName) {
            setCurrentBrandName(data.brandName);
          }
          if (data.adminFeedback !== undefined) {
            const msg = extractGeneralMsg(data.adminFeedback);
            setGeneralAlertMsg(msg);
          }

          // Broadcast only if status actually changed on server
          if (hasEditsChanged || hasLevelChanged || hasFeedbackChanged) {
            window.dispatchEvent(new CustomEvent('artist-status-updated', { detail: data }));
          }
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

  // --- CASE C: Level 2+ Approved Celebration & Notification Banner ---
  if (approved && level >= 2 && !pending) {
    if (celebrationDismissed) {
      return renderGeneralAlert();
    }

    return (
      <>
        {renderGeneralAlert()}
        <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-5 sm:p-6 mb-8 border-2 border-blue-500/40 shadow-2xl relative overflow-hidden transition-all animate-in fade-in" dir="rtl">
        <div className="absolute top-0 left-0 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-black bg-blue-500 text-white px-3.5 py-1 rounded-full shadow-sm">
                <span>⭐</span>
                <span>احراز هویت: سطح {level} از ۳ (تایید شده)</span>
              </span>

              <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>فعال و منتشر در ویترین عمومی</span>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>🎉 تبریک! هویت و شناسنامه هنری شما تایید شد</span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              پروفایل اختصاصی فروشگاه و آثار شما توسط ناظر پلتفرم تایید گردید و اکنون در ویترین عمومی هنرهاب برای خریداران سراسر کشور فعال و در دسترس است.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 justify-start md:justify-end flex-shrink-0">
            {artistId && (
              <a
                href={`/artist/${artistId}`}
                target="_blank"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black px-5 py-3 rounded-2xl transition-all shadow-md shadow-blue-600/30 text-xs sm:text-sm whitespace-nowrap"
              >
                <span>مشاهده صفحه عمومی من</span>
              </a>
            )}

            <Link
              href="/artist-panel/verification"
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-3 rounded-2xl transition-all border border-slate-700 text-xs sm:text-sm whitespace-nowrap"
            >
              <span>سطوح احراز هویت</span>
              <span>←</span>
            </Link>

            <button
              type="button"
              onClick={handleDismissCelebration}
              className="px-3.5 py-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors text-xs font-bold flex items-center gap-1 border border-slate-700/60"
              title="بستن این پیام"
            >
              <span>✕</span>
              <span>متوجه شدم</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

  // --- CASE A: Pending Admin Review ---
  if (pending) {
    return (
      <>
        {renderGeneralAlert()}
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
      </>
    );
  }

  // --- CASE B: Level 1 (Completed Onboarding, Profile not yet submitted or rejected) ---
  return (
    <>
      {renderGeneralAlert()}
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
    </>
  );
}
