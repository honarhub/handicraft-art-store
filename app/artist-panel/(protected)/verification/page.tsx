'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function MedalStarBadge({ level, active }: { level: number; active: boolean }) {
  if (active) {
    return (
      <span
        title={`مدال سطح ${level}: کسب شده`}
        className="inline-flex items-center justify-center drop-shadow-md"
      >
        <svg width="28" height="34" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 2L12 8L17 2V9L12 13L7 9V2Z" fill="#F59E0B" />
          <path d="M7 2L12 8V13L7 9V2Z" fill="#D97706" opacity="0.7" />
          <circle cx="12" cy="18" r="8" fill="url(#goldGradientPage)" stroke="#B45309" strokeWidth="1.5" />
          <path d="M12 13.5L13.2 16.2L16.2 16.5L13.9 18.5L14.6 21.4L12 19.8L9.4 21.4L10.1 18.5L7.8 16.5L10.8 16.2L12 13.5Z" fill="#78350F" />
          <defs>
            <linearGradient id="goldGradientPage" x1="6" y1="12" x2="18" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="0.5" stopColor="#FBBF24" />
              <stop offset="1" stopColor="#D97706" />
            </linearGradient>
          </defs>
        </svg>
      </span>
    );
  }

  return (
    <span
      title={`مدال سطح ${level}: قفل`}
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
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [shebaNumber, setShebaNumber] = useState('');
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycSuccess, setKycSuccess] = useState('');
  const [kycError, setKycError] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/artist/profile', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setArtist(data);

      if (data.nationalId) setNationalId(data.nationalId);
      if (data.nationalCardImage) setNationalCardImage(data.nationalCardImage);
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

  const handleSubmitLevel3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycError('');
    setKycSuccess('');

    if (!nationalId.trim() || nationalId.length !== 10) {
      setKycError('کد ملی باید ۱۰ رقم باشد.');
      return;
    }
    if (!nationalCardImage) {
      setKycError('تصویر کارت ملی الزامی است.');
      return;
    }
    if (!shebaNumber.trim() || shebaNumber.length !== 24) {
      setKycError('شماره شبا باید ۲۴ رقم بدون IR باشد.');
      return;
    }
    if (!address.trim()) {
      setKycError('آدرس محل سکونت یا کارگاه الزامی است.');
      return;
    }
    if (!postalCode.trim() || postalCode.length !== 10) {
      setKycError('کد پستی ۱۰ رقمی الزامی است.');
      return;
    }

    setKycSubmitting(true);
    try {
      const res = await fetch('/api/artist/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 3,
          nationalId: nationalId.trim(),
          nationalCardImage,
          shebaNumber: shebaNumber.trim(),
          address: address.trim(),
          postalCode: postalCode.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ثبت مدارک');

      setKycSuccess('مدارک هویتی و مالی شما با موفقیت ثبت شد و در صف تایید نهایی قرار گرفت.');
      window.dispatchEvent(new CustomEvent('artist-status-updated', { detail: { verificationLevel: 3 } }));
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

  const level = artist?.verificationLevel || 1;
  const isApproved = Boolean(artist?.isApproved);
  const hasPendingEdits = Boolean(artist?.pendingEdits);

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
          <span className="text-xs font-mono font-black text-amber-400">
            سطح {level} از ۳
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
          level >= 2 && !hasPendingEdits
            ? 'border-emerald-300'
            : hasPendingEdits
            ? 'border-amber-300'
            : 'border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg ${
                level >= 2 && !hasPendingEdits
                  ? 'bg-emerald-100 text-emerald-800'
                  : hasPendingEdits
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

            {level >= 2 && !hasPendingEdits ? (
              <span className="bg-emerald-500 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                <span>✓</span>
                <span>تایید شده (فعال در ویترین)</span>
              </span>
            ) : hasPendingEdits ? (
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
            {level >= 2 && !hasPendingEdits
              ? 'پروفایل شما توسط ناظر پلتفرم بررسی و تایید شده است و فروشگاه و محصولات شما در دید عموم خریداران قرار دارد.'
              : hasPendingEdits
              ? 'اطلاعات پروفایل شما ارسال شده و در حال بررسی است. پس از تایید، محصولات شما در ویترین عمومی فعال خواهند شد.'
              : 'برای اینکه محصولات و صفحه شما به خریداران در سایت نمایش داده شود، تکمیل و تایید پروفایل این مرحله الزامی است.'}
          </p>
        </div>

        {/* --- LEVEL 3 CARD --- */}
        <div className={`bg-white rounded-3xl p-6 sm:p-7 border-2 shadow-sm transition-all relative ${
          level >= 3
            ? 'border-emerald-300'
            : level >= 2
            ? 'border-teal-300'
            : 'border-slate-200 opacity-80'
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg ${
                level >= 3
                  ? 'bg-emerald-100 text-emerald-800'
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
            ) : level >= 2 && artist?.nationalId ? (
              <span className="bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse shadow-xs">
                <span>⏳</span>
                <span>در انتظار بررسی و تایید ادمین</span>
              </span>
            ) : level >= 2 ? (
              <span className="bg-teal-100 text-teal-800 font-bold text-xs px-3 py-1 rounded-full border border-teal-200">
                آماده تکمیل و ثبت مدارک
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
            <form onSubmit={handleSubmitLevel3} noValidate className="mt-6 space-y-5">
              {kycSuccess && (
                <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-200">
                  {kycSuccess}
                </div>
              )}
              {kycError && (
                <div className="p-4 bg-red-50 text-red-700 text-xs font-bold rounded-2xl border border-red-200">
                  {kycError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    کد ملی ۱۰ رقمی <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={nationalId}
                    onChange={e => setNationalId(e.target.value.replace(/\D/g, ''))}
                    placeholder="۰۰۱۲۳۴۵۶۷۸"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    شماره شبا (۲۴ رقم بدون IR) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={24}
                      value={shebaNumber}
                      onChange={e => setShebaNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="980120000000000000000000"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono pl-10 outline-none focus:border-teal-500 text-left"
                      dir="ltr"
                    />
                    <span className="absolute left-3 top-2.5 font-mono font-bold text-slate-400 text-xs">
                      IR
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تصویر روی کارت ملی هوشمند <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <label className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors">
                    <span>انتخاب تصویر کارت ملی</span>
                    <input type="file" accept="image/*" onChange={handleCardImageUpload} className="hidden" />
                  </label>
                  {nationalCardImage && (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <span>✓</span>
                      <span>تصویر بارگذاری شد</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    آدرس دقیق کارگاه یا محل سکونت <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="استان، شهر، خیابان..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    کد پستی ۱۰ رقمی <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="۱۲۳۴۵۶۷۸۹۰"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-teal-500 text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={kycSubmitting}
                className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-teal-500/20 disabled:opacity-50"
              >
                {kycSubmitting ? 'در حال ثبت مدارک...' : 'ثبت و ارسال مدارک مالی برای تایید'}
              </button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
}
