'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface SetPasswordFormProps {
  email?: string | null;
  name?: string | null;
}

export default function SetPasswordForm({ email, name }: SetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Mask Google ID: show first 2 and last 2 characters with asterisks in between
  const maskGoogleId = (val?: string | null) => {
    if (!val) return '';
    const trimmed = val.trim();
    if (trimmed.length <= 4) return trimmed;
    const first2 = trimmed.slice(0, 2);
    const last2 = trimmed.slice(-2);
    return `${first2}*****${last2}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || password.trim().length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    if (password !== confirmPassword) {
      setError('تکرار رمز عبور با رمز عبور وارد شده مطابقت ندارد.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: password.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'خطا در ثبت رمز عبور');
      }

      setSuccess(true);
      // Wait a moment so the browser credential manager prompts to save the password
      setTimeout(() => {
        router.push('/panel');
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'خطا در برقراری ارتباط با سرور.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 font-sans">
      {/* Brand Logo & Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/60 shadow-inner mb-3">
          <Image
            src="/icon.png"
            alt="HonarHub Logo"
            width={36}
            height={36}
            className="w-9 h-9 object-contain"
          />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          تعیین رمز عبور حساب هنرهاب
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
          برای امنیت حساب و امکان ورود مستقیم در دفعات بعدی (با ذخیره در مرورگر)، لطفاً یک رمز عبور تعیین فرمایید.
        </p>
      </div>

      {/* Masked Google Account Info Pill */}
      {email && (
        <div className="mb-5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">حساب گوگل متصل:</span>
          <span className="font-mono text-emerald-900 font-bold dir-ltr tracking-wider">
            {maskGoogleId(email)}
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <span className="shrink-0">⚠️</span>
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <span>✓</span>
          <span>رمز عبور با موفقیت ثبت شد. در حال انتقال به پنل کاربری...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hidden username field for browser credential managers */}
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={email || ''}
          readOnly
          className="sr-only"
          tabIndex={-1}
        />

        {/* Password Field */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
            رمز عبور جدید <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="حداقل ۶ کاراکتر"
              dir="ltr"
              required
              className="w-full px-4 py-3 pl-11 rounded-2xl border border-slate-300 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition text-center placeholder:text-center text-slate-900 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
              title={showPassword ? 'مخفی‌سازی رمز عبور' : 'نمایش رمز عبور'}
              aria-label={showPassword ? 'مخفی‌سازی رمز عبور' : 'نمایش رمز عبور'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
            تکرار رمز عبور جدید <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="تکرار رمز عبور"
              dir="ltr"
              required
              className="w-full px-4 py-3 pl-11 rounded-2xl border border-slate-300 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition text-center placeholder:text-center text-slate-900 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
              title={showConfirmPassword ? 'مخفی‌سازی رمز عبور' : 'نمایش رمز عبور'}
              aria-label={showConfirmPassword ? 'مخفی‌سازی رمز عبور' : 'نمایش رمز عبور'}
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md shadow-emerald-700/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <div className="inline-flex items-center gap-1.5 py-0.5">
              <span className="w-2 h-2 rounded-full bg-white opacity-60 animate-pulse [animation-delay:400ms]" />
              <span className="w-2.5 h-2.5 rounded-full bg-white opacity-80 animate-pulse [animation-delay:200ms]" />
              <span className="w-3 h-3 rounded-full bg-white animate-pulse [animation-delay:0ms]" />
              <span className="w-2.5 h-2.5 rounded-full bg-white opacity-80 animate-pulse [animation-delay:200ms]" />
              <span className="w-2 h-2 rounded-full bg-white opacity-60 animate-pulse [animation-delay:400ms]" />
            </div>
          ) : (
            <span>ثبت و ذخیره رمز عبور</span>
          )}
        </button>
      </form>
    </div>
  );
}
