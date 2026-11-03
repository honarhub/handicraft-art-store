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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-200/80">
      {/* Brand Logo & Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/60 shadow-inner mb-3">
          <Image
            src="/icon.png"
            alt="HonarHub Logo"
            width={36}
            height={36}
            className="w-9 h-9 object-contain"
          />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
          تعیین رمز عبور حساب هنرهاب
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-2 leading-relaxed">
          برای امنیت حساب و امکان ورود مستقیم در دفعات بعدی (با ذخیره در مرورگر)، لطفاً یک رمز عبور تعیین فرمایید.
        </p>
      </div>

      {/* Account Info Pill */}
      {email && (
        <div className="mb-5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between text-xs">
          <span className="text-stone-600 font-medium">حساب گوگل متصل:</span>
          <span className="font-mono text-amber-900 font-bold dir-ltr truncate max-w-[200px]">
            {email}
          </span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
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

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
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
              className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-medium cursor-pointer"
            >
              {showPassword ? 'مخفی' : 'نمایش'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">
            تکرار رمز عبور جدید <span className="text-red-500">*</span>
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="تکرار رمز عبور"
            dir="ltr"
            required
            className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10 transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-900 hover:to-amber-950 text-white font-bold text-sm shadow-md shadow-amber-900/10 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
