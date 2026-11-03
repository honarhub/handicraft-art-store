'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface UserProfileData {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string;
  image: string | null;
  role: string;
  hasPassword: boolean;
  isArtist: boolean;
  isAdmin: boolean;
  createdAt: string;
}

const toPersianDigits = (num: number | string) =>
  String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

export default function ProfileManager({ initialUser }: { initialUser: UserProfileData }) {
  const [user, setUser] = useState<UserProfileData>(initialUser);
  const [name, setName] = useState(initialUser.name || '');
  const [email, setEmail] = useState(initialUser.email || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('لطفاً نام و نام خانوادگی خود را وارد نمایید');
      return;
    }

    if (showPasswordSection) {
      if (!newPassword) {
        setErrorMsg('لطفاً رمز عبور جدید را وارد کنید');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('رمز عبور باید حداقل ۶ کاراکتر باشد');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('رمز عبور جدید با تکرار آن یکسان نیست');
        return;
      }
      if (user.hasPassword && !currentPassword) {
        setErrorMsg('لطفاً رمز عبور فعلی خود را وارد کنید');
        return;
      }
    }

    setLoading(true);

    try {
      const payload: any = {
        name: name.trim(),
        email: email.trim() || null
      };

      if (showPasswordSection && newPassword) {
        payload.newPassword = newPassword;
        if (user.hasPassword) {
          payload.currentPassword = currentPassword;
        }
      }

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در به‌روزرسانی اطلاعات حساب');
      }

      setUser(prev => ({
        ...prev,
        name: data.user.name,
        email: data.user.email,
        hasPassword: Boolean(newPassword || prev.hasPassword)
      }));

      // Reset password inputs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);

      setSuccessMsg('اطلاعات حساب کاربری شما با موفقیت ذخیره شد.');
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-stone-900 to-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-amber-900/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/30 border border-amber-500/30 flex items-center justify-center text-2xl sm:text-3xl text-amber-300 font-bold shadow-inner">
              {user.name ? user.name[0] : 'ک'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{user.name || 'مجموعه‌دار گرامی'}</h1>
                {user.isAdmin && (
                  <span className="text-[11px] font-medium bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-0.5 rounded-full">
                    مدیریت ارشد
                  </span>
                )}
                {user.isArtist && (
                  <span className="text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                    هنرمند رسمی
                  </span>
                )}
                {!user.isAdmin && !user.isArtist && (
                  <span className="text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    خریدار و حامی هنر
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-stone-300">
                شماره موبایل تأیید شده:{' '}
                <span className="font-mono text-amber-200 tracking-wider">
                  {toPersianDigits(user.phoneNumber)}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Switch Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t border-white/10 md:border-0">
            {user.isArtist && (
              <Link
                href="/artist-panel/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs font-medium transition"
              >
                <span>ورود به استودیوی هنرمند</span>
                <svg className="w-3.5 h-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
            {user.isAdmin && (
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-200 text-xs font-medium transition"
              >
                <span>پنل مدیریت ارشد</span>
                <svg className="w-3.5 h-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleUpdateProfile} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm space-y-6">
        <div className="border-b border-stone-100 pb-4">
          <h2 className="text-lg font-bold text-stone-900">اطلاعات حساب کاربری</h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            مشخصات شخصی شما در فاکتور سفارش‌ها و ارسال بسته‌های هنری استفاده می‌شود.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              نام و نام خانوادگی <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: عباس رنجبر"
              required
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-700/20 focus:border-amber-700 text-sm transition"
            />
          </div>

          {/* Mobile (Read-Only) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              شماره موبایل (احراز هویت شده)
            </label>
            <div className="relative">
              <input
                type="text"
                value={toPersianDigits(user.phoneNumber)}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-600 font-mono text-sm tracking-wider cursor-not-allowed"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                تأیید شده
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              جهت تغییر شماره تلفن، لطفاً با پشتیبانی آنلاین هنرهاب در تماس باشید.
            </p>
          </div>

          {/* Email */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              آدرس ایمیل (اختیاری)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              dir="ltr"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-700/20 focus:border-amber-700 text-sm transition font-mono placeholder:font-sans placeholder:text-right"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              جهت دریافت رسید خرید و شناسنامه دیجیتال آثار در ایمیل.
            </p>
          </div>
        </div>

        {/* Security & Password Toggle */}
        <div className="pt-4 border-t border-stone-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-800">امنیت و رمز عبور</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {user.hasPassword
                  ? 'برای حساب شما رمز عبور فعال است. می‌توانید در صورت تمایل آن را تغییر دهید.'
                  : 'برای ورود سریع‌تر بدون انتظار برای پیامک، می‌توانید رمز عبور تعیین کنید.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="px-3.5 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-700 hover:border-stone-300 hover:bg-stone-50 transition"
            >
              {showPasswordSection
                ? 'انصراف'
                : user.hasPassword
                ? 'تغییر رمز عبور'
                : 'تعیین رمز عبور'}
            </button>
          </div>

          {showPasswordSection && (
            <div className="mt-5 p-5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-4">
              {user.hasPassword && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    رمز عبور فعلی <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-700/20 focus:border-amber-700 text-sm"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    رمز عبور جدید <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="حداقل ۶ کاراکتر"
                    dir="ltr"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-700/20 focus:border-amber-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    تکرار رمز عبور جدید <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="تکرار رمز عبور جدید"
                    dir="ltr"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-700/20 focus:border-amber-700 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white font-medium text-sm transition shadow-md shadow-amber-900/10 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>در حال ذخیره...</span>
              </>
            ) : (
              <span>ذخیره تغییرات</span>
            )}
          </button>
        </div>
      </form>

      {/* Account Info Box */}
      <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-stone-500">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-stone-700">عضویت در باشگاه مجموعه‌داران هنرهاب</p>
            <p className="text-[11px] text-stone-400">شناسه یکتای کاربری: {user.id}</p>
          </div>
        </div>
        <p className="text-stone-400 text-left" dir="ltr">
          Protected by End-to-End Encryption
        </p>
      </div>
    </div>
  );
}
