'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isValidIranianNationalId, isValidIranianSheba, hasProfilePendingEdits } from '@/lib/sms';

const toPersianDigits = (num: number | string) =>
  String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

const PAGE_MEDAL_THEMES: Record<number, {
  ribbon1: string;
  ribbon2: string;
  stroke: string;
  starFill: string;
  gradientId: string;
  stops: { offset?: number; color: string }[];
}> = {
  1: {
    ribbon1: '#F59E0B',
    ribbon2: '#D97706',
    stroke: '#B45309',
    starFill: '#78350F',
    gradientId: 'pageMedalYellowGradient',
    stops: [
      { color: '#FDE047' },
      { offset: 0.5, color: '#FBBF24' },
      { offset: 1.0, color: '#D97706' },
    ],
  },
  2: {
    ribbon1: '#3B82F6',
    ribbon2: '#2563EB',
    stroke: '#1D4ED8',
    starFill: '#1E3A8A',
    gradientId: 'pageMedalBlueGradient',
    stops: [
      { color: '#93C5FD' },
      { offset: 0.5, color: '#60A5FA' },
      { offset: 1.0, color: '#2563EB' },
    ],
  },
  3: {
    ribbon1: '#10B981',
    ribbon2: '#059669',
    stroke: '#047857',
    starFill: '#064E3B',
    gradientId: 'pageMedalGreenGradient',
    stops: [
      { color: '#6EE7B7' },
      { offset: 0.5, color: '#34D399' },
      { offset: 1.0, color: '#059669' },
    ],
  },
};

function MedalStarBadge({ level, active }: { level: number; active: boolean }) {
  const theme = PAGE_MEDAL_THEMES[level] || PAGE_MEDAL_THEMES[1];
  const persianLevel = toPersianDigits(level);

  if (active) {
    return (
      <span
        title={`مدال سطح ${persianLevel}: کسب شده`}
        className="inline-flex items-center justify-center drop-shadow-md"
      >
        <svg width="28" height="34" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 2L12 8L17 2V9L12 13L7 9V2Z" fill={theme.ribbon1} />
          <path d="M7 2L12 8V13L7 9V2Z" fill={theme.ribbon2} opacity="0.7" />
          <circle cx="12" cy="18" r="8" fill={`url(#${theme.gradientId})`} stroke={theme.stroke} strokeWidth="1.5" />
          <path d="M12 13.5L13.2 16.2L16.2 16.5L13.9 18.5L14.6 21.4L12 19.8L9.4 21.4L10.1 18.5L7.8 16.5L10.8 16.2L12 13.5Z" fill={theme.starFill} />
          <defs>
            <linearGradient id={theme.gradientId} x1="6" y1="12" x2="18" y2="24" gradientUnits="userSpaceOnUse">
              {theme.stops.map((s, idx) => (
                <stop key={idx} offset={s.offset} stopColor={s.color} />
              ))}
            </linearGradient>
          </defs>
        </svg>
      </span>
    );
  }

  return (
    <span
      title={`مدال سطح ${persianLevel}: قفل`}
      className="inline-flex items-center justify-center opacity-30 grayscale"
    >
      <svg width="28" height="34" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 2L12 8L17 2V9L12 13L7 9V2Z" fill="#6B7280" />
        <circle cx="12" cy="18" r="8" fill="#374151" stroke="#6B7280" strokeWidth="1.5" />
        <path d="M12 13.5L13.2 16.2L16.2 16.5L13.9 18.5L14.6 21.4L12 19.8L9.4 21.4L10.1 18.5L7.8 16.5L10.8 16.2L12 13.5Z" fill="#1F2937" />
      </svg>
    </span>
  );
}

export default function ArtistVerificationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [artist, setArtist] = useState<any>(null);

  // Level 3 Form States
  const [nationalId, setNationalId] = useState('');
  const [nationalCardImage, setNationalCardImage] = useState<string | null>(null);
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [shebaNumber, setShebaNumber] = useState('');
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycSuccess, setKycSuccess] = useState('');
  const [kycError, setKycError] = useState('');

  const PERSIAN_MONTHS = [
    { value: '01', label: 'فروردین' },
    { value: '02', label: 'اردیبهشت' },
    { value: '03', label: 'خرداد' },
    { value: '04', label: 'تیر' },
    { value: '05', label: 'مرداد' },
    { value: '06', label: 'شهریور' },
    { value: '07', label: 'مهر' },
    { value: '08', label: 'آبان' },
    { value: '09', label: 'آذر' },
    { value: '10', label: 'دی' },
    { value: '11', label: 'بهمن' },
    { value: '12', label: 'اسفند' }
  ];

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/artist/profile', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setArtist(data);

      if (data.nationalId) setNationalId(data.nationalId);
      if (data.nationalCardImage) setNationalCardImage(data.nationalCardImage);
      if (data.birthDate) {
        const parts = data.birthDate.split('/');
        if (parts.length === 3) {
          setBirthYear(parts[0]);
          setBirthMonth(parts[1].padStart(2, '0'));
          setBirthDay(parts[2].padStart(2, '0'));
        }
      }
      if (data.address) setAddress(data.address);
      if (data.postalCode) setPostalCode(data.postalCode);
      if (data.shebaNumber) setShebaNumber(data.shebaNumber);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleCardImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setNationalCardImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Derive Level 3 Granular Approval/Rejection states
  const level = artist?.verificationLevel || 1;
  const isApproved = Boolean(artist?.isApproved);
  const hasProfileEdits = hasProfilePendingEdits(artist?.pendingEdits);

  const kycFieldKeys = ['nationalId', 'nationalCardImage', 'birthDate', 'shebaNumber', 'address', 'postalCode'];
  let approvedFields: string[] = [];
  let rejectedFields: Record<string, string> = {};
  let level3Status: 'NOT_SUBMITTED' | 'PENDING' | 'NEEDS_REVISION' | 'APPROVED' = 'NOT_SUBMITTED';

  if (level >= 3) {
    level3Status = 'APPROVED';
    approvedFields = kycFieldKeys;
  } else if (level >= 2) {
    let hasKycEdits = false;
    if (artist?.pendingEdits) {
      try {
        const pe = typeof artist.pendingEdits === 'string' ? JSON.parse(artist.pendingEdits) : artist.pendingEdits;
        if (pe?.type === 'LEVEL_3_KYC' || pe?.approvedFields || pe?.rejectedFields) {
          hasKycEdits = true;
          if (Array.isArray(pe.approvedFields)) approvedFields = pe.approvedFields;
          if (pe.rejectedFields && typeof pe.rejectedFields === 'object') {
            Object.entries(pe.rejectedFields).forEach(([k, v]) => {
              if (kycFieldKeys.includes(k) && typeof v === 'string') {
                rejectedFields[k] = v;
              }
            });
          }
          if (pe.status === 'PENDING') level3Status = 'PENDING';
          if (pe.status === 'NEEDS_REVISION' && Object.keys(rejectedFields).length > 0) {
            level3Status = 'NEEDS_REVISION';
          }
        }
      } catch {}
    }

    // Only inspect adminFeedback for Level 3 if KYC was actually submitted and rejected for KYC fields
    if (Object.keys(rejectedFields).length === 0 && artist?.adminFeedback && (artist?.nationalId || hasKycEdits)) {
      try {
        const fb = typeof artist.adminFeedback === 'string' ? JSON.parse(artist.adminFeedback) : artist.adminFeedback;
        if (typeof fb === 'object' && fb !== null) {
          const kycRejections: Record<string, string> = {};
          Object.entries(fb).forEach(([k, v]) => {
            if (kycFieldKeys.includes(k) && typeof v === 'string') {
              kycRejections[k] = v;
            }
          });
          if (Object.keys(kycRejections).length > 0) {
            rejectedFields = kycRejections;
            level3Status = 'NEEDS_REVISION';
          }
        }
      } catch {}
    }

    if (level3Status === 'NOT_SUBMITTED' && (artist?.nationalId || hasKycEdits)) {
      level3Status = 'PENDING';
    }
  }

  const isNationalIdApproved = approvedFields.includes('nationalId');
  const isCardApproved = approvedFields.includes('nationalCardImage');
  const isBirthDateApproved = approvedFields.includes('birthDate');
  const isShebaApproved = approvedFields.includes('shebaNumber');
  const isAddressApproved = approvedFields.includes('address');
  const isPostalCodeApproved = approvedFields.includes('postalCode');

  const isNationalIdRejected = Boolean(rejectedFields.nationalId);
  const isCardRejected = Boolean(rejectedFields.nationalCardImage);
  const isBirthDateRejected = Boolean(rejectedFields.birthDate);
  const isShebaRejected = Boolean(rejectedFields.shebaNumber);
  const isAddressRejected = Boolean(rejectedFields.address);
  const isPostalCodeRejected = Boolean(rejectedFields.postalCode);

  const handleSubmitLevel3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycError('');
    setKycSuccess('');

    // Validate only fields that are NOT already approved
    if (!isNationalIdApproved) {
      if (!nationalId.trim()) {
        setKycError('کد ملی ۱۰ رقمی الزامی است.');
        return;
      }
      if (!isValidIranianNationalId(nationalId)) {
        setKycError('کدملی نادرست است.');
        return;
      }
    }
    if (!isCardApproved && !nationalCardImage) {
      setKycError('تصویر روی کارت ملی الزامی است.');
      return;
    }
    if (!isBirthDateApproved) {
      if (!birthDay || !birthMonth || !birthYear) {
        setKycError('تاریخ کامل تولد (روز، ماه و سال) الزامی است.');
        return;
      }
    }
    if (!isShebaApproved) {
      if (!shebaNumber.trim()) {
        setKycError('شماره شبا ۲۴ رقمی الزامی است.');
        return;
      }
      if (!isValidIranianSheba(shebaNumber)) {
        setKycError('شماره شبا نادرست است.');
        return;
      }
    }
    if (!isAddressApproved && !address.trim()) {
      setKycError('آدرس محل سکونت یا کارگاه الزامی است.');
      return;
    }
    if (!isPostalCodeApproved && (!postalCode.trim() || postalCode.length !== 10)) {
      setKycError('کد پستی ۱۰ رقمی الزامی است.');
      return;
    }

    const formattedBirthDate = (birthYear && birthMonth && birthDay)
      ? `${birthYear}/${birthMonth.padStart(2, '0')}/${birthDay.padStart(2, '0')}`
      : (artist?.birthDate || '');

    setKycSubmitting(true);
    try {
      const res = await fetch('/api/artist/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 3,
          level: 3,
          nationalId: nationalId.trim(),
          nationalCardImage,
          birthDate: formattedBirthDate,
          shebaNumber: shebaNumber.replace(/^IR/i, '').trim(),
          address: address.trim(),
          postalCode: postalCode.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ثبت مدارک');

      setKycSuccess('مدارک هویتی و مالی شما با موفقیت ثبت شد و در صف تایید ناظر پلتفرم قرار گرفت.');
      window.dispatchEvent(new CustomEvent('artist-status-updated', { detail: { verificationLevel: 2 } }));
      window.dispatchEvent(new CustomEvent('admin-counts-update'));
      fetchProfile();
    } catch (err: any) {
      setKycError(err.message || 'مشکلی در ثبت مدارک رخ داد.');
    } finally {
      setKycSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold">در حال بارگذاری سطوح احراز هویت...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans pb-12" dir="rtl">
      
      {/* Header with 3 Medal Badges */}
      <div className="bg-gradient-to-l from-teal-900 via-slate-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full mb-3 inline-block">
            چارچوب اعتبارسنجی ۳ مرحله‌ای
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            سطوح احراز هویت فروشگاه هنری
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1.5 leading-relaxed max-w-xl">
            برای حفظ اصالت آثار و اعتماد خریداران، فعالیت در هنرهاب در ۳ سطح امنیتی تعریف شده است.
          </p>
        </div>

        {/* 3 Medals */}
        <div className="flex flex-col items-center gap-2 bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-2xl shadow-inner shrink-0">
          <span className="text-[11px] font-bold text-slate-300">مدال‌های کسب‌شده:</span>
          <div className="flex items-center gap-3">
            <MedalStarBadge level={1} active={level >= 1} />
            <MedalStarBadge level={2} active={level >= 2} />
            <MedalStarBadge level={3} active={level >= 3} />
          </div>
          <span className={`text-xs font-black ${level >= 3 ? 'text-emerald-400' : level >= 2 ? 'text-blue-400' : 'text-amber-400'}`}>
            سطح {toPersianDigits(level)} از ۳
          </span>
        </div>
      </div>

      {/* 3 Tier Overview Cards */}
      <div className="space-y-6">

        {/* --- LEVEL 1 CARD --- */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-emerald-300 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg">
                ۱
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  سطح ۱: اطلاعات اولیه و استودیو
                </h3>
                <p className="text-xs text-slate-500">
                  نام و نام خانوادگی، نام برند و استان/شهرستان محل فعالیت
                </p>
              </div>
            </div>

            <span className="bg-emerald-500 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
              <span>✓</span>
              <span>تکمیل و تایید شده</span>
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl">
            <div><span className="text-slate-400 block mb-1">نام هنرمند:</span> <span className="font-bold text-slate-800">{artist?.user?.name || '-'}</span></div>
            <div><span className="text-slate-400 block mb-1">نام برند / استودیو:</span> <span className="font-bold text-slate-800">{artist?.brandName || 'بدون برند'}</span></div>
            <div><span className="text-slate-400 block mb-1">محل کارگاه:</span> <span className="font-bold text-slate-800">{artist?.province || '-'} - {artist?.city || '-'}</span></div>
          </div>
        </div>

        {/* --- LEVEL 2 CARD --- */}
        <div className={`bg-white rounded-3xl p-6 sm:p-7 border-2 shadow-sm transition-all relative ${
          level >= 2 && !hasProfileEdits
            ? 'border-emerald-300'
            : hasProfileEdits
            ? 'border-amber-300'
            : 'border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg ${
                level >= 2 && !hasProfileEdits
                  ? 'bg-emerald-100 text-emerald-800'
                  : hasProfileEdits
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                ۲
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  سطح ۲: هویت و شناسنامه هنری (ویترین عمومی)
                </h3>
                <p className="text-xs text-slate-500">
                  عکس پروفایل، بیوگرافی و معرفی سوابق، تخصص‌ها و لینک‌های شبکه‌های اجتماعی
                </p>
              </div>
            </div>

            {level >= 2 && !hasProfileEdits ? (
              <span className="bg-emerald-500 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                <span>✓</span>
                <span>تایید شده (فعال در ویترین)</span>
              </span>
            ) : hasProfileEdits ? (
              <span className="bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse shadow-xs">
                <span>⏳</span>
                <span>در انتظار بررسی و تایید ادمین</span>
              </span>
            ) : (
              <Link
                href="/artist-panel/profile"
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm"
              >
                تکمیل پروفایل و ارسال برای تایید ←
              </Link>
            )}
          </div>

          <p className="text-xs text-slate-600 mt-4 leading-relaxed">
            {level >= 2 && !hasProfileEdits
              ? 'پروفایل شما توسط ناظر پلتفرم بررسی و تایید شده است و فروشگاه و محصولات شما در دید عموم خریداران قرار دارد.'
              : hasProfileEdits
              ? 'اطلاعات پروفایل شما ارسال شده و در حال بررسی است. پس از تایید، محصولات شما در ویترین عمومی فعال خواهند شد.'
              : 'برای اینکه محصولات و صفحه شما به خریداران در سایت نمایش داده شود، تکمیل و تایید پروفایل این مرحله الزامی است.'}
          </p>
        </div>

        {/* --- LEVEL 3 CARD --- */}
        <div className={`bg-white rounded-3xl p-6 sm:p-7 border-2 shadow-sm transition-all relative ${
          level >= 3
            ? 'border-emerald-300'
            : level3Status === 'NEEDS_REVISION'
            ? 'border-amber-300'
            : level >= 2
            ? 'border-teal-300'
            : 'border-slate-200 opacity-80'
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg ${
                level >= 3
                  ? 'bg-emerald-100 text-emerald-800'
                  : level3Status === 'NEEDS_REVISION'
                  ? 'bg-amber-100 text-amber-800'
                  : level >= 2
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                ۳
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>سطح ۳: احراز هویت مالی و تسویه حساب</span>
                  {level < 2 && <span className="text-slate-400 text-sm">🔒</span>}
                </h3>
                <p className="text-xs text-slate-500">
                  ثبت شماره ملی، تصویر کارت ملی، شماره شبا، آدرس و کد پستی جهت واریز درآمدهای فروش
                </p>
              </div>
            </div>

            {level >= 3 ? (
              <span className="bg-emerald-500 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                <span>✓</span>
                <span>تایید شده (تسویه فعال)</span>
              </span>
            ) : level3Status === 'NEEDS_REVISION' ? (
              <span className="bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                <span>⚠️</span>
                <span>نیاز به اصلاح مدارک</span>
              </span>
            ) : level3Status === 'PENDING' ? (
              <span className="bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse shadow-xs">
                <span>⏳</span>
                <span>در انتظار بررسی و تایید ادمین</span>
              </span>
            ) : level >= 2 ? (
              <span className="bg-amber-100 text-amber-800 font-bold text-xs px-3 py-1 rounded-full border border-amber-300 shadow-2xs">
                در انتظار ارسال مدارک
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-500 font-bold text-xs px-3 py-1 rounded-full">
                🔒 نیازمند تایید سطح ۲
              </span>
            )}
          </div>

          {/* Locked State if Level < 2 */}
          {level < 2 && (
            <div className="mt-5 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
              <span className="text-2xl block">🔒</span>
              <h4 className="font-bold text-slate-800 text-sm">این مرحله هنوز قفل است</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                جهت دسترسی به فرم احراز هویت مالی، ابتدا باید پروفایل سطح ۲ شما توسط ناظر پلتفرم تایید گردد.
              </p>
              <Link
                href="/artist-panel/profile"
                className="inline-block mt-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
              >
                رفتن به صفحه پروفایل
              </Link>
            </div>
          )}

          {/* Active KYC Form if Level >= 2 */}
          {level >= 2 && (
            <form onSubmit={handleSubmitLevel3} noValidate className="mt-6 space-y-6">
              
              {/* Notification Banners */}
              {kycSuccess && (
                <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-200 flex items-center gap-2">
                  <span>✓</span>
                  <span>{kycSuccess}</span>
                </div>
              )}
              {kycError && (
                <div className="p-4 bg-red-50 text-red-700 text-xs font-bold rounded-2xl border border-red-200 flex items-center gap-2">
                  <span>✕</span>
                  <span>{kycError}</span>
                </div>
              )}

              {/* Status Alert Banner: Needs Revision */}
              {level3Status === 'NEEDS_REVISION' && !kycSuccess && (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs text-amber-900 leading-relaxed flex items-start gap-3">
                  <span className="text-xl shrink-0">⚠️</span>
                  <div>
                    <h4 className="font-black text-sm text-amber-950 mb-0.5">
                      برخی از مدارک توسط ادمین تایید نشده است
                    </h4>
                    <p className="text-amber-800">
                      مدارکی که تایید شده‌اند به رنگ سبز نشان داده شده و قطعی می‌باشند. لطفاً مواردی که با برچسب قرمز مشخص شده‌اند را طبق پیام بازخورد ادمین اصلاح نموده و در انتهای فرم دکمه ارسال مجدد را بزنید.
                    </p>
                  </div>
                </div>
              )}

              {/* Status Alert Banner: Pending */}
              {level3Status === 'PENDING' && !kycSuccess && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 leading-relaxed flex items-start gap-3">
                  <span className="text-xl shrink-0">⏳</span>
                  <div>
                    <h4 className="font-black text-sm text-blue-950 mb-0.5">
                      مدارک هویتی و مالی شما در انتظار بررسی ادمین است
                    </h4>
                    <p className="text-blue-800">
                      اطلاعات ارسالی شما در نوبت اعتبارسنجی ناظر پلتفرم قرار دارد. پس از بررسی، نتیجه از طریق پیامک و در همین بخش به شما اطلاع داده خواهد شد.
                    </p>
                  </div>
                </div>
              )}

              {/* 1. National Card Image (Rectangular Trimmed Preview Frame - Not Circle) */}
              <div className="space-y-2 border-b border-slate-100 pb-6">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    تصویر روی کارت ملی هوشمند <span className="text-red-500">*</span>
                  </label>
                  {isCardApproved && (
                    <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <span>✓</span>
                      <span>تایید شده</span>
                    </span>
                  )}
                  {isCardRejected && (
                    <span className="text-[11px] font-black text-red-800 bg-red-100 border border-red-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <span>✕</span>
                      <span>رد شده - نیاز به تصویر جدید</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Trimmed Rectangular Preview Frame */}
                  <div className={`relative w-full max-w-xs sm:w-64 aspect-[1.6/1] rounded-2xl overflow-hidden border-2 bg-slate-100 flex items-center justify-center shadow-xs transition-all ${
                    isCardApproved
                      ? 'border-emerald-300 ring-2 ring-emerald-100'
                      : isCardRejected
                      ? 'border-red-400 ring-2 ring-red-100'
                      : 'border-slate-200'
                  }`}>
                    {isCardApproved ? (
                      <div className="flex flex-col items-center justify-center text-center p-4 gap-2 bg-emerald-50/70 w-full h-full">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center text-xl font-black shadow-xs">
                          ✓
                        </div>
                        <span className="text-xs font-black text-emerald-950">
                          تصویر کارت ملی تایید شده است
                        </span>
                        <span className="text-[10px] text-emerald-700/80">
                          جهت حفظ حریم خصوصی، تصویر مدارک نمایش داده نمی‌شود
                        </span>
                      </div>
                    ) : nationalCardImage ? (
                      <img
                        src={nationalCardImage}
                        alt="پیش‌نمایش کارت ملی"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 p-3 text-center">
                        <span className="text-3xl">🪪</span>
                        <span className="text-[11px] font-bold">تصویر کارت ملی انتخاب نشده</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  {!isCardApproved && (
                    <div className="space-y-1.5">
                      <label className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors shadow-xs">
                        <span>📷</span>
                        <span>{nationalCardImage ? 'تغییر تصویر کارت ملی' : 'انتخاب تصویر کارت ملی'}</span>
                        <input type="file" accept="image/*" onChange={handleCardImageUpload} className="hidden" />
                      </label>
                      <p className="text-[11px] text-slate-400">
                        تصویر باید واضح، خوانا و بدون بازتاب نور شدید باشد (حداکثر ۵ مگابایت).
                      </p>
                    </div>
                  )}
                </div>

                {isCardRejected && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex items-start gap-2 mt-2">
                    <span className="text-sm">⚠️</span>
                    <span>علت عدم تایید ادمین: {rejectedFields.nationalCardImage}</span>
                  </div>
                )}
              </div>

              {/* 2. National ID and Birth Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* National ID */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      کد ملی ۱۰ رقمی <span className="text-red-500">*</span>
                    </label>
                    {isNationalIdApproved && (
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span>✓</span>
                        <span>تایید شده</span>
                      </span>
                    )}
                    {isNationalIdRejected && (
                      <span className="text-[10px] font-black text-red-800 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span>✕</span>
                        <span>نیاز به اصلاح</span>
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={10}
                    disabled={isNationalIdApproved}
                    value={nationalId}
                    onChange={e => setNationalId(e.target.value.replace(/\D/g, ''))}
                    placeholder="۰۰۱۲۳۴۵۶۷۸"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-mono outline-none transition-all ${
                      isNationalIdApproved
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-emerald-300'
                        : isNationalIdRejected
                        ? 'border-red-400 ring-2 ring-red-100 bg-white'
                        : nationalId.length === 10 && !isValidIranianNationalId(nationalId)
                        ? 'border-red-300 ring-1 ring-red-200 bg-white'
                        : 'border-slate-200 focus:border-teal-500 bg-white'
                    }`}
                  />
                  {!isNationalIdApproved && nationalId.length === 10 && !isValidIranianNationalId(nationalId) && (
                    <p className="text-[11px] text-red-500 font-bold mt-1 flex items-center gap-1">
                      <span>⚠️</span>
                      <span>کدملی نادرست است.</span>
                    </p>
                  )}
                  {!isNationalIdApproved && nationalId.length === 10 && isValidIranianNationalId(nationalId) && (
                    <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                      <span>✓</span>
                      <span>کد ملی صحیح است</span>
                    </p>
                  )}
                  {isNationalIdRejected && (
                    <div className="p-2.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 mt-1.5 flex items-start gap-1.5">
                      <span>⚠️</span>
                      <span>علت عدم تایید: {rejectedFields.nationalId}</span>
                    </div>
                  )}
                </div>

                {/* Birth Date (Day, Month, Year) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      تاریخ تولد (روز / ماه / سال) <span className="text-red-500">*</span>
                    </label>
                    {isBirthDateApproved && (
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span>✓</span>
                        <span>تایید شده</span>
                      </span>
                    )}
                    {isBirthDateRejected && (
                      <span className="text-[10px] font-black text-red-800 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span>✕</span>
                        <span>نیاز به اصلاح</span>
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {/* Day */}
                    <select
                      disabled={isBirthDateApproved}
                      value={birthDay}
                      onChange={e => setBirthDay(e.target.value)}
                      className={`w-full px-2 py-2.5 border rounded-xl text-xs outline-none transition-all ${
                        isBirthDateApproved
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-emerald-300'
                          : isBirthDateRejected
                          ? 'border-red-400 ring-2 ring-red-100 bg-white'
                          : 'border-slate-200 focus:border-teal-500 bg-white'
                      }`}
                    >
                      <option value="">روز</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                        const val = String(d).padStart(2, '0');
                        return (
                          <option key={val} value={val}>
                            {d.toLocaleString('fa-IR')}
                          </option>
                        );
                      })}
                    </select>

                    {/* Month */}
                    <select
                      disabled={isBirthDateApproved}
                      value={birthMonth}
                      onChange={e => setBirthMonth(e.target.value)}
                      className={`w-full px-2 py-2.5 border rounded-xl text-xs outline-none transition-all ${
                        isBirthDateApproved
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-emerald-300'
                          : isBirthDateRejected
                          ? 'border-red-400 ring-2 ring-red-100 bg-white'
                          : 'border-slate-200 focus:border-teal-500 bg-white'
                      }`}
                    >
                      <option value="">ماه</option>
                      {PERSIAN_MONTHS.map(m => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>

                    {/* Year */}
                    <select
                      disabled={isBirthDateApproved}
                      value={birthYear}
                      onChange={e => setBirthYear(e.target.value)}
                      className={`w-full px-2 py-2.5 border rounded-xl text-xs outline-none transition-all ${
                        isBirthDateApproved
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-emerald-300'
                          : isBirthDateRejected
                          ? 'border-red-400 ring-2 ring-red-100 bg-white'
                          : 'border-slate-200 focus:border-teal-500 bg-white'
                      }`}
                    >
                      <option value="">سال</option>
                      {Array.from({ length: 81 }, (_, i) => 1400 - i).map(y => (
                        <option key={y} value={String(y)}>
                          {y.toLocaleString('fa-IR', { useGrouping: false })}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isBirthDateRejected && (
                    <div className="p-2.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 mt-1.5 flex items-start gap-1.5">
                      <span>⚠️</span>
                      <span>علت عدم تایید: {rejectedFields.birthDate}</span>
                    </div>
                  )}
                </div>

              </div>

              {/* 3. Sheba Number */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    شماره شبا (۲۴ رقم بدون IR) <span className="text-red-500">*</span>
                  </label>
                  {isShebaApproved && (
                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>✓</span>
                      <span>تایید شده</span>
                    </span>
                  )}
                  {isShebaRejected && (
                    <span className="text-[10px] font-black text-red-800 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>✕</span>
                      <span>نیاز به اصلاح</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={24}
                    disabled={isShebaApproved}
                    value={shebaNumber}
                    onChange={e => setShebaNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="980120000000000000000000"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-mono pl-10 outline-none text-left transition-all ${
                      isShebaApproved
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-emerald-300'
                        : isShebaRejected
                        ? 'border-red-400 ring-2 ring-red-100 bg-white'
                        : 'border-slate-200 focus:border-teal-500 bg-white'
                    }`}
                    dir="ltr"
                  />
                  <span className="absolute left-3 top-2.5 font-mono font-bold text-slate-400 text-xs">
                    IR
                  </span>
                </div>
                {!isShebaApproved && shebaNumber.replace(/\D/g, '').length === 24 && !isValidIranianSheba(shebaNumber) && (
                  <p className="text-[11px] text-red-500 font-bold mt-1 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>شماره شبا نادرست است.</span>
                  </p>
                )}
                {!isShebaApproved && shebaNumber.replace(/\D/g, '').length === 24 && isValidIranianSheba(shebaNumber) && (
                  <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                    <span>✓</span>
                    <span>شماره شبا صحیح است</span>
                  </p>
                )}
                {isShebaRejected && (
                  <div className="p-2.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 mt-1.5 flex items-start gap-1.5">
                    <span>⚠️</span>
                    <span>علت عدم تایید: {rejectedFields.shebaNumber}</span>
                  </div>
                )}
              </div>

              {/* 4. Address and Postal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Address */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      آدرس دقیق کارگاه یا محل سکونت <span className="text-red-500">*</span>
                    </label>
                    {isAddressApproved && (
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span>✓</span>
                        <span>تایید شده</span>
                      </span>
                    )}
                    {isAddressRejected && (
                      <span className="text-[10px] font-black text-red-800 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span>✕</span>
                        <span>نیاز به اصلاح</span>
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    disabled={isAddressApproved}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="استان، شهر، خیابان..."
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none transition-all ${
                      isAddressApproved
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-emerald-300'
                        : isAddressRejected
                        ? 'border-red-400 ring-2 ring-red-100 bg-white'
                        : 'border-slate-200 focus:border-teal-500 bg-white'
                    }`}
                  />
                  {isAddressRejected && (
                    <div className="p-2.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 mt-1.5 flex items-start gap-1.5">
                      <span>⚠️</span>
                      <span>علت عدم تایید: {rejectedFields.address}</span>
                    </div>
                  )}
                </div>

                {/* Postal Code */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      کد پستی ۱۰ رقمی <span className="text-red-500">*</span>
                    </label>
                    {isPostalCodeApproved && (
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span>✓</span>
                        <span>تایید شده</span>
                      </span>
                    )}
                    {isPostalCodeRejected && (
                      <span className="text-[10px] font-black text-red-800 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span>✕</span>
                        <span>نیاز به اصلاح</span>
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={10}
                    disabled={isPostalCodeApproved}
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="۱۲۳۴۵۶۷۸۹۰"
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-mono outline-none text-center transition-all ${
                      isPostalCodeApproved
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-emerald-300'
                        : isPostalCodeRejected
                        ? 'border-red-400 ring-2 ring-red-100 bg-white'
                        : 'border-slate-200 focus:border-teal-500 bg-white'
                    }`}
                  />
                  {isPostalCodeRejected && (
                    <div className="p-2.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 mt-1.5 flex items-start gap-1.5">
                      <span>⚠️</span>
                      <span>علت عدم تایید: {rejectedFields.postalCode}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Submit Button */}
              {level < 3 && (
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={kycSubmitting || (approvedFields.length === 6)}
                    className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl transition-all shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>
                      {kycSubmitting
                        ? 'در حال ثبت مدارک...'
                        : level3Status === 'NEEDS_REVISION'
                        ? 'ارسال مجدد مدارک اصلاح‌شده جهت بررسی ادمین'
                        : level3Status === 'PENDING'
                        ? 'ویرایش و ارسال مجدد مدارک'
                        : 'ثبت و ارسال مدارک مالی برای تایید'}
                    </span>
                    <span>←</span>
                  </button>
                </div>
              )}
            </form>
          )}

        </div>

      </div>

    </div>
  );
}
