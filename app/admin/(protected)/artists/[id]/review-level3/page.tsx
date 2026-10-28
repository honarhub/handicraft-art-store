'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isValidIranianNationalId, isValidIranianSheba } from '@/lib/sms';

// Admin Level Medal Icon with specific colors: 0: Red, 1: Yellow, 2: Blue, 3: Green
function ReviewLevelMedalIcon({ level }: { level: number }) {
  const currentLvl = level || 0;
  const persianNums: Record<number, string> = { 0: '۰', 1: '۱', 2: '۲', 3: '۳' };
  const numText = persianNums[currentLvl] || String(currentLvl);

  const configs: Record<number, {
    ribbonPrimary: string;
    ribbonSecondary: string;
    gradientId: string;
    stroke: string;
    textFill: string;
    stops: [string, string, string];
  }> = {
    0: {
      ribbonPrimary: '#EF4444',
      ribbonSecondary: '#B91C1C',
      gradientId: 'lvl3MedalRed',
      stroke: '#991B1B',
      textFill: '#FFFFFF',
      stops: ['#FCA5A5', '#EF4444', '#B91C1C']
    },
    1: {
      ribbonPrimary: '#F59E0B',
      ribbonSecondary: '#D97706',
      gradientId: 'lvl3MedalYellow',
      stroke: '#B45309',
      textFill: '#78350F',
      stops: ['#FDE047', '#FBBF24', '#D97706']
    },
    2: {
      ribbonPrimary: '#3B82F6',
      ribbonSecondary: '#1D4ED8',
      gradientId: 'lvl3MedalBlue',
      stroke: '#1E40AF',
      textFill: '#FFFFFF',
      stops: ['#93C5FD', '#3B82F6', '#1D4ED8']
    },
    3: {
      ribbonPrimary: '#10B981',
      ribbonSecondary: '#047857',
      gradientId: 'lvl3MedalGreen',
      stroke: '#065F46',
      textFill: '#FFFFFF',
      stops: ['#6EE7B7', '#10B981', '#047857']
    }
  };

  const cfg = configs[currentLvl] || configs[2];

  return (
    <span className="inline-flex items-center justify-center shrink-0 drop-shadow-sm" title={`سطح احراز هویت: ${numText}`}>
      <svg width="24" height="30" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2L14 10L20 2V12L14 16L8 12V2Z" fill={cfg.ribbonPrimary} />
        <path d="M8 2L14 10V16L8 12V2Z" fill={cfg.ribbonSecondary} opacity="0.8" />
        <circle cx="14" cy="21" r="11" fill={`url(#${cfg.gradientId})`} stroke={cfg.stroke} strokeWidth="1.5" />
        <circle cx="14" cy="21" r="8.5" stroke="#FFFFFF" strokeWidth="0.8" fill="none" opacity="0.5" />
        <text
          x="14"
          y="25"
          textAnchor="middle"
          fill={cfg.textFill}
          fontSize="13"
          fontWeight="900"
          className="select-none font-bold"
          style={{ fontFamily: 'inherit' }}
        >
          {numText}
        </text>
        <defs>
          <linearGradient id={cfg.gradientId} x1="5" y1="12" x2="23" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor={cfg.stops[0]} />
            <stop offset="0.5" stopColor={cfg.stops[1]} />
            <stop offset="1" stopColor={cfg.stops[2]} />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

// Split Rectangle 2-State Review Toggle
function SplitReviewToggle({
  status,
  onToggle,
  isLockedApproved = false
}: {
  status: 'approve' | 'reject';
  onToggle: (newStatus: 'approve' | 'reject') => void;
  isLockedApproved?: boolean;
}) {
  const isApproved = status === 'approve';

  if (isLockedApproved) {
    return (
      <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs">
        <span>✓</span>
        <span>قبلاً تایید و قفل شده</span>
      </div>
    );
  }

  return (
    <div 
      className="inline-flex rounded-xl border border-slate-300 overflow-hidden shadow-xs text-xs font-black select-none h-9 shrink-0"
      dir="rtl"
    >
      {/* Right half: تایید (سبز) */}
      <button
        type="button"
        onClick={() => onToggle('approve')}
        className={`px-3.5 sm:px-4 flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
          isApproved
            ? 'bg-emerald-600 text-white font-black shadow-inner'
            : 'bg-white text-emerald-700 hover:bg-emerald-50'
        }`}
      >
        <span>✓</span>
        <span>تایید</span>
      </button>

      {/* Center Divider line */}
      <div className={`w-[1px] ${isApproved ? 'bg-emerald-700' : 'bg-red-700'}`} />

      {/* Left half: عدم تایید (قرمز) */}
      <button
        type="button"
        onClick={() => onToggle('reject')}
        className={`px-3.5 sm:px-4 flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
          !isApproved
            ? 'bg-red-600 text-white font-black shadow-inner'
            : 'bg-white text-red-600 hover:bg-red-50'
        }`}
      >
        <span>✕</span>
        <span>عدم تایید</span>
      </button>
    </div>
  );
}

export default function ReviewArtistLevel3Page({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [artist, setArtist] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  // Previously approved fields that are permanently fixed
  const [previouslyApproved, setPreviouslyApproved] = useState<string[]>([]);

  // Decisions: key -> { status: 'approve' | 'reject', reason: string }
  // By default, all unapproved items start in 'reject' (عدم تایید) state as requested
  const [decisions, setDecisions] = useState<Record<string, { status: 'approve' | 'reject', reason: string }>>({
    nationalId: { status: 'reject', reason: '' },
    nationalCardImage: { status: 'reject', reason: '' },
    shebaNumber: { status: 'reject', reason: '' },
    address: { status: 'reject', reason: '' },
    postalCode: { status: 'reject', reason: '' }
  });

  const getFieldLabel = (field: string) => {
    const map: Record<string, string> = {
      nationalId: 'کد ملی ۱۰ رقمی',
      nationalCardImage: 'تصویر روی کارت ملی هوشمند',
      shebaNumber: 'شماره شبا بانکی (بدون IR)',
      address: 'آدرس دقیق کارگاه یا محل سکونت',
      postalCode: 'کد پستی ۱۰ رقمی'
    };
    return map[field] || field;
  };

  const formatPersianDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);
    } catch {
      return '—';
    }
  };

  useEffect(() => {
    fetch(`/api/artists/${id}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setArtist(data);

        // Check if there are already approved fields
        let prevApproved: string[] = [];
        let prevRejected: Record<string, string> = {};

        if (data.pendingEdits) {
          try {
            const pe = typeof data.pendingEdits === 'string' ? JSON.parse(data.pendingEdits) : data.pendingEdits;
            if (Array.isArray(pe.approvedFields)) {
              prevApproved = pe.approvedFields;
            }
            if (pe.rejectedFields && typeof pe.rejectedFields === 'object') {
              prevRejected = pe.rejectedFields;
            }
          } catch {}
        }

        if (Object.keys(prevRejected).length === 0 && data.adminFeedback) {
          try {
            const fb = JSON.parse(data.adminFeedback);
            if (typeof fb === 'object') prevRejected = fb;
          } catch {}
        }

        setPreviouslyApproved(prevApproved);

        // Setup decisions for all 5 fields:
        // If field was previously approved -> default 'approve' (and will be locked)
        // By default, all unapproved items start in 'reject' (عدم تایید) state
        const initialDecisions: Record<string, { status: 'approve' | 'reject', reason: string }> = {};
        const keys = ['nationalId', 'nationalCardImage', 'shebaNumber', 'address', 'postalCode'];
        keys.forEach(k => {
          if (prevApproved.includes(k)) {
            initialDecisions[k] = { status: 'approve', reason: '' };
          } else {
            // Default is 'reject' (عدم تایید)
            initialDecisions[k] = { status: 'reject', reason: prevRejected[k] || '' };
          }
        });

        setDecisions(initialDecisions);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const setDecisionStatus = (field: string, newStatus: 'approve' | 'reject') => {
    setDecisions(prev => ({
      ...prev,
      [field]: {
        status: newStatus,
        reason: newStatus === 'approve' ? '' : prev[field]?.reason || ''
      }
    }));
  };

  const handleReasonChange = (field: string, reason: string) => {
    setDecisions(prev => ({
      ...prev,
      [field]: { ...prev[field], reason }
    }));
  };

  const handleApproveAll = () => {
    setDecisions(prev => {
      const updated: Record<string, { status: 'approve' | 'reject', reason: string }> = {};
      Object.keys(prev).forEach(k => {
        updated[k] = { status: 'approve', reason: '' };
      });
      return updated;
    });
  };

  const handleSubmitDecisions = async () => {
    const approvedFields: string[] = [];
    const rejectedFields: Record<string, string> = {};

    for (const [field, dec] of Object.entries(decisions)) {
      if (dec.status === 'approve') {
        approvedFields.push(field);
      } else {
        if (!dec.reason.trim()) {
          alert(`لطفاً دلیل رد کردن مدرک «${getFieldLabel(field)}» را وارد کنید.`);
          return;
        }
        rejectedFields[field] = dec.reason.trim();
      }
    }

    setActionLoading(true);

    try {
      const res = await fetch(`/api/artists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'granularReviewLevel3',
          approvedFields,
          rejectedFields
        })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'خطا در ثبت بررسی');

      window.dispatchEvent(new CustomEvent('admin-counts-update'));
      
      if (resData.promotedToLevel3) {
        alert('تبریک! تمام مدارک تایید شد و هنرمند به سطح ۳ (تسویه حساب فعال) ارتقا یافت.');
      } else {
        alert('تصمیمات شما با موفقیت ثبت شد. موارد تایید شده قفل گردیدند و موارد رد شده جهت اصلاح به هنرمند اطلاع‌رسانی شدند.');
      }
      
      router.push('/admin/artists');
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت تصمیمات');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold">در حال بارگذاری اطلاعات مدارک مالی...</div>;
  }

  if (!artist) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center font-sans" dir="rtl">
        <div className="p-6 bg-slate-100 rounded-3xl border border-slate-200">
          <span className="text-3xl mb-2 block">⚠️</span>
          <h3 className="font-bold text-slate-800">هنرمند یافت نشد</h3>
          <Link href="/admin/artists" className="mt-4 inline-block bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs">
            بازگشت به لیست هنرمندان
          </Link>
        </div>
      </div>
    );
  }

  const fields = [
    {
      key: 'nationalId',
      title: 'کد ملی ۱۰ رقمی',
      value: artist.nationalId || 'ثبت نشده',
      isImage: false,
      isMono: true
    },
    {
      key: 'nationalCardImage',
      title: 'تصویر روی کارت ملی هوشمند',
      value: artist.nationalCardImage,
      isImage: true,
      isMono: false
    },
    {
      key: 'shebaNumber',
      title: 'شماره شبا بانکی',
      value: artist.shebaNumber ? `IR ${artist.shebaNumber}` : 'ثبت نشده',
      isImage: false,
      isMono: true
    },
    {
      key: 'address',
      title: 'آدرس دقیق کارگاه یا محل سکونت',
      value: artist.address || 'ثبت نشده',
      isImage: false,
      isMono: false
    },
    {
      key: 'postalCode',
      title: 'کد پستی ۱۰ رقمی',
      value: artist.postalCode || 'ثبت نشده',
      isImage: false,
      isMono: true
    }
  ];

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto font-sans" dir="rtl">
      
      {/* Top Header Card with Artist Details */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm mb-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              {artist.user?.image ? (
                <img src={artist.user.image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-slate-400">👤</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  بررسی مدارک مالی و سطح ۳: {artist.user?.name || 'هنرمند بدون نام'}
                </h2>
                {artist.brandName && (
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 font-bold">
                    {artist.brandName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                شناسه: <span className="font-mono font-bold text-slate-700">#{artist.displayId}</span> | شماره موبایل: <span className="font-mono font-bold text-slate-700">{artist.user?.phoneNumber || '—'}</span>
              </p>
            </div>
          </div>

          {/* Level 2/3 Medal Badge */}
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 shrink-0">
            <ReviewLevelMedalIcon level={artist.verificationLevel || 2} />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-bold leading-none mb-0.5">سطح فعلی:</span>
              <span className="text-xs font-black text-slate-800">
                سطح {artist.verificationLevel || 2} از ۳
              </span>
            </div>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-900 leading-relaxed flex items-start gap-3">
          <span className="text-xl">🪪</span>
          <div>
            <h4 className="font-black text-sm text-red-950 mb-0.5">
              اعتبارسنجی مدارک هویتی و حساب بانکی
            </h4>
            <p className="text-xs text-red-800">
              شما می‌توانید هر مدرک را به صورت مجزا تایید یا با ذکر دلیل مشخص رد نمایید. مواردی که تایید می‌شوند در پنل هنرمند قفل (فیکس) شده و مواردی که تایید نشده‌اند همراه با پیام شما جهت اصلاح و ارسال مجدد به هنرمند نمایش داده خواهند شد. با تایید هر ۵ مورد، هنرمند مستقیماً به سطح ۳ ارتقا می‌یابد.
            </p>
          </div>
        </div>
      </div>

      {/* Review Actions Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
          <h3 className="font-black text-base text-slate-900">
            فیلدهای احراز هویت مالی (۵ مدرک)
          </h3>
        </div>

        <button
          type="button"
          onClick={handleApproveAll}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <span>✓</span>
          <span>تایید همه مدارک</span>
        </button>
      </div>

      {/* 5 KYC Fields Review Cards */}
      <div className="space-y-4 mb-8">
        {fields.map(field => {
          const isPreviouslyLocked = previouslyApproved.includes(field.key);
          const decision = decisions[field.key] || { status: 'approve', reason: '' };
          const isApproved = decision.status === 'approve';

          return (
            <div
              key={field.key}
              className={`bg-white rounded-3xl p-5 sm:p-6 border-2 transition-all shadow-xs ${
                isApproved ? 'border-slate-200' : 'border-red-300 bg-red-50/20'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isApproved ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <h4 className="font-black text-sm text-slate-900">
                    {field.title}
                  </h4>
                </div>

                <SplitReviewToggle
                  status={decision.status}
                  isLockedApproved={isPreviouslyLocked}
                  onToggle={newStatus => setDecisionStatus(field.key, newStatus)}
                />
              </div>

              {/* Field Content Display */}
              <div className="mt-4">
                {field.isImage ? (
                  <div>
                    {field.value ? (
                      <div className="space-y-2">
                        <div
                          onClick={() => setPreviewModalImg(field.value)}
                          className="w-full max-w-md aspect-[1.6/1] rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-sm relative group cursor-pointer"
                          title="جهت بزرگنمایی کلیک کنید"
                        >
                          <img
                            src={field.value}
                            alt="تصویر کارت ملی"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                          />
                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-[1px]">
                            <span>🔍</span>
                            <span>مشاهده در اندازه بزرگ</span>
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400 block">
                          برای بررسی دقیق و خوانایی متن روی تصویر کارت ملی کلیک نمایید.
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-red-500 font-bold bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 inline-block">
                        تصویری توسط هنرمند بارگذاری نشده است
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <p className={`text-xs text-slate-800 leading-relaxed font-bold ${field.isMono ? 'font-mono text-left dir-ltr' : ''}`}>
                      {field.value}
                    </p>
                    {field.key === 'nationalId' && artist.nationalId && (
                      isValidIranianNationalId(artist.nationalId) ? (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span>✓</span>
                          <span>الگوریتم ده رقمی معتبر</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-red-800 bg-red-100 border border-red-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span>⚠️</span>
                          <span>ساختار کد ملی نامعتبر</span>
                        </span>
                      )
                    )}
                    {field.key === 'shebaNumber' && artist.shebaNumber && (
                      isValidIranianSheba(artist.shebaNumber) ? (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span>✓</span>
                          <span>شماره شبا معتبر</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-red-800 bg-red-100 border border-red-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span>⚠️</span>
                          <span>ساختار شبا نامعتبر</span>
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Rejection Reason Input (Visible only if rejected and not permanently locked) */}
              {!isPreviouslyLocked && !isApproved && (
                <div className="mt-4 pt-3 border-t border-red-200/80">
                  <label className="block text-xs font-bold text-red-700 mb-1.5">
                    علت عدم تایید این مدرک (به هنرمند نمایش داده می‌شود) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={decision.reason}
                    onChange={e => handleReasonChange(field.key, e.target.value)}
                    placeholder={`مثال: تصویر کارت ملی ناخواناست / شماره شبا به نام صاحب کد ملی نیست...`}
                    className="w-full px-3.5 py-2.5 border-2 border-red-300 rounded-xl text-xs outline-none focus:border-red-500 bg-white"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border-2 border-slate-300 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href="/admin/artists"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          ← انصراف و بازگشت به لیست
        </Link>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            disabled={actionLoading}
            onClick={handleSubmitDecisions}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm px-6 py-3 rounded-2xl transition-all shadow-md shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{actionLoading ? 'در حال ثبت تصمیمات...' : 'ثبت و ارسال تصمیمات به هنرمند'}</span>
            <span>←</span>
          </button>
        </div>
      </div>

      {/* Lightbox Modal for National Card Image */}
      {previewModalImg && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewModalImg(null)}
        >
          <div
            className="bg-white rounded-3xl p-4 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col relative shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-sm text-slate-800">
                مشاهده بزرگ تصویر کارت ملی
              </h3>
              <button
                type="button"
                onClick={() => setPreviewModalImg(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="overflow-auto flex-1 flex items-center justify-center bg-slate-100 rounded-2xl p-2">
              <img
                src={previewModalImg}
                alt="تصویر کارت ملی بزرگ"
                className="max-h-[75vh] w-auto object-contain rounded-xl shadow"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
