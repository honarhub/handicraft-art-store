'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface UserProfileData {
  id: string;
  name: string;
  email: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
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
  const [phoneNumber, setPhoneNumber] = useState(initialUser.phoneNumber || '');
  const [isEmailVerified, setIsEmailVerified] = useState(initialUser.emailVerified || Boolean(initialUser.email));

  // Email verification OTP states
  const [showEmailOtpInput, setShowEmailOtpInput] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [emailOtpSuccess, setEmailOtpSuccess] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Send Email OTP (Only for users who didn't register with email and want to verify a new email)
  const handleSendEmailOtp = async () => {
    setErrorMsg('');
    setEmailOtpSuccess('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('لطفاً یک آدرس ایمیل معتبر وارد نمایید.');
      return;
    }

    setEmailOtpLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          type: 'EMAIL_OTP',
          purpose: 'customer'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ارسال کد تایید به ایمیل');
      }
      setShowEmailOtpInput(true);
      setEmailOtpSuccess('کد تایید ۵ رقمی به ایمیل شما ارسال شد. لطفاً صندوق ورودی (یا اسپم) خود را بررسی کنید.');
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ارسال کد به ایمیل');
    } finally {
      setEmailOtpLoading(false);
    }
  };

  // Handle Verify Email OTP
  const handleVerifyEmailOtp = async () => {
    setErrorMsg('');
    setEmailOtpSuccess('');
    if (!emailOtpCode || emailOtpCode.trim().length !== 5) {
      setErrorMsg('لطفاً کد تایید ۵ رقمی را کامل وارد نمایید.');
      return;
    }

    setEmailOtpLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          code: emailOtpCode.trim(),
          type: 'EMAIL_OTP'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'کد تایید وارد شده نامعتبر یا منقضی شده است.');
      }

      // Automatically persist email to profile
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });

      setIsEmailVerified(true);
      setShowEmailOtpInput(false);
      setUser(prev => ({ ...prev, email: cleanEmail, emailVerified: true }));
      setSuccessMsg('ایمیل شما با موفقیت تایید و ثبت شد.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در تایید کد ایمیل');
    } finally {
      setEmailOtpLoading(false);
    }
  };

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
        name: name.trim()
      };

      // If user did not have a phone number, allow submitting phone number
      if (!user.phoneNumber && phoneNumber.trim()) {
        payload.phoneNumber = phoneNumber.trim();
      }

      // Only update email if not yet verified
      if (!isEmailVerified && email.trim()) {
        payload.email = email.trim().toLowerCase();
      }

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
        phoneNumber: data.user.phoneNumber || prev.phoneNumber,
        emailVerified: data.user.emailVerified || prev.emailVerified,
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
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-stone-900 to-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-stone-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-700/30 border border-emerald-500/30 flex items-center justify-center text-2xl sm:text-3xl text-emerald-300 font-bold shadow-inner">
              {user.name ? user.name[0] : 'هـ'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{user.name || 'هنردوست گرامی'}</h1>
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
                    هنردوست
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-stone-300">
                {user.phoneNumber ? (
                  <>
                    شماره موبایل تأیید شده:{' '}
                    <span className="font-mono text-emerald-200 tracking-wider">
                      {toPersianDigits(user.phoneNumber)}
                    </span>
                  </>
                ) : user.email ? (
                  <>
                    حساب متصل با ایمیل:{' '}
                    <span className="font-mono text-emerald-200 tracking-wider dir-ltr inline-block">
                      {user.email}
                    </span>
                  </>
                ) : (
                  <span>عضو باشگاه هنردوستان</span>
                )}
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs font-medium transition"
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
          <span className="shrink-0">⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {emailOtpSuccess && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-sm flex items-center gap-3">
          <span className="shrink-0">📩</span>
          <span>{emailOtpSuccess}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <span className="shrink-0">✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleUpdateProfile} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900">اطلاعات حساب کاربری</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            مشخصات فردی شما جهت ارسال سفارش‌ها و صدور شناسنامه هنری به کار می‌رود.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              نام و نام خانوادگی <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: سارا محمدی"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-sm transition"
            />
          </div>

          {/* Mobile Phone Field (Editable if not set, or locked if already verified) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700">
                شماره موبایل {user.phoneNumber ? '' : <span className="text-slate-400 font-normal">(اختیاری)</span>}
              </label>
              {user.phoneNumber ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span>✓</span> تایید شده
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  قابل ثبت یا تکمیل هنگام خرید
                </span>
              )}
            </div>

            {user.phoneNumber ? (
              <div 
                className="relative group cursor-not-allowed"
                title="تغییر شماره موبایل نیاز به تیکت پشتیبانی دارد"
              >
                <input
                  type="text"
                  value={toPersianDigits(user.phoneNumber)}
                  disabled
                  title="تغییر شماره موبایل نیاز به تیکت پشتیبانی دارد"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-mono text-sm tracking-wider cursor-not-allowed select-none"
                />
                <div className="pointer-events-none absolute bottom-full mb-1 right-0 hidden group-hover:flex items-center gap-1 bg-slate-900 text-slate-100 text-[11px] px-2.5 py-1 rounded-lg shadow-lg z-20 whitespace-nowrap">
                  <span>🔒</span>
                  <span>تغییر شماره موبایل نیاز به تیکت پشتیبانی دارد</span>
                </div>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="tel"
                  dir="ltr"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="09123456789 (اختیاری)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-sm transition font-mono text-left placeholder:text-left placeholder:text-slate-400"
                />
              </div>
            )}

            <p className="text-[11px] text-slate-400 mt-1">
              {user.phoneNumber
                ? 'شماره موبایل حساب شما تایید شده و تغییر آن از طریق پشتیبانی صورت می‌پذیرد.'
                : 'می‌توانید شماره موبایل خود را اکنون ثبت فرمایید؛ در غیر این صورت در زمان ثبت نهایی سفارش از شما دریافت خواهد شد.'}
            </p>
          </div>

          {/* Email (Optional, Left-aligned hint, OTP-verified & Non-changeable after verification) */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700">
                آدرس ایمیل <span className="text-slate-400 font-normal">(اختیاری)</span>
              </label>
              {(user.emailVerified || isEmailVerified) && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span>✓</span> تایید شده
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  dir="ltr"
                  disabled={Boolean(user.emailVerified || isEmailVerified)}
                  className={`w-full px-4 py-3 rounded-xl border text-sm transition font-mono text-left placeholder:text-left ${
                    (user.emailVerified || isEmailVerified)
                      ? 'border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed select-none'
                      : 'border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 placeholder:text-slate-400'
                  }`}
                />
              </div>

              {/* Email OTP Verification Section (Only shown if email is NOT yet verified) */}
              {!(user.emailVerified || isEmailVerified) && (
                <div className="shrink-0">
                  {!showEmailOtpInput ? (
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={emailOtpLoading || !email.trim() || !email.includes('@')}
                      className="w-full sm:w-auto px-4 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      {emailOtpLoading ? 'در حال ارسال کد...' : 'ارسال کد تایید ایمیل'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        dir="ltr"
                        maxLength={5}
                        value={emailOtpCode}
                        onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        placeholder="کد ۵ رقمی"
                        className="w-28 px-3 py-2.5 rounded-xl border border-emerald-400 text-center font-mono font-bold text-sm tracking-widest outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyEmailOtp}
                        disabled={emailOtpLoading || emailOtpCode.length !== 5}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                      >
                        {emailOtpLoading ? '...' : 'تایید'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 mt-1">
              {(user.emailVerified || isEmailVerified)
                ? 'ایمیل شما تایید شده و غیرقابل تغییر است. جهت تغییر نیاز به تیکت پشتیبانی است.'
                : 'جهت دریافت رسید خرید و شناسنامه دیجیتال آثار در ایمیل.'}
            </p>
          </div>
        </div>

        {/* Security & Password Toggle */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">امنیت و رمز عبور</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {user.hasPassword
                  ? 'برای حساب شما رمز عبور فعال است. می‌توانید در صورت تمایل آن را تغییر دهید.'
                  : 'برای ورود سریع‌تر بدون انتظار برای پیامک، می‌توانید رمز عبور تعیین کنید.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer"
            >
              {showPasswordSection
                ? 'انصراف'
                : user.hasPassword
                ? 'تغییر رمز عبور'
                : 'تعیین رمز عبور'}
            </button>
          </div>

          {showPasswordSection && (
            <div className="mt-5 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              {user.hasPassword && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    رمز عبور فعلی <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      dir="ltr"
                      className="w-full px-4 py-2.5 pl-11 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                      title={showCurrentPassword ? 'مخفی‌سازی رمز عبور' : 'نمایش رمز عبور'}
                    >
                      {showCurrentPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    رمز عبور جدید <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="حداقل ۶ کاراکتر"
                      dir="ltr"
                      className="w-full px-4 py-2.5 pl-11 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                      title={showNewPassword ? 'مخفی‌سازی رمز عبور' : 'نمایش رمز عبور'}
                    >
                      {showNewPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    تکرار رمز عبور جدید <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="تکرار رمز عبور جدید"
                      dir="ltr"
                      className="w-full px-4 py-2.5 pl-11 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                      title={showConfirmPassword ? 'مخفی‌سازی رمز عبور' : 'نمایش رمز عبور'}
                    >
                      {showConfirmPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white font-bold text-sm transition shadow-md shadow-emerald-700/15 flex items-center gap-2 cursor-pointer"
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
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-700">عضویت در باشگاه هنردوستان هنرهاب</p>
            <p className="text-[11px] text-slate-400">شناسه یکتای کاربری: {user.id}</p>
          </div>
        </div>
        <p className="text-slate-400 text-left font-mono" dir="ltr">
          Protected by End-to-End Encryption
        </p>
      </div>
    </div>
  );
}
