'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('لینک بازیابی نامعتبر است. توکن در آدرس یافت نشد.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (password !== confirmPassword) {
      setError('رمز عبور و تکرار آن مطابقت ندارند.');
      return;
    }
    
    if (password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطایی رخ داد.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/artist-panel/login');
        }, 3000);
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl max-w-md w-full border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔒</div>
          <h1 className="text-2xl font-black text-slate-800">انتخاب رمز عبور جدید</h1>
          <p className="text-slate-500 mt-2 text-sm">رمز عبور جدید خود را وارد کنید.</p>
        </div>

        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl text-center">
            <h3 className="font-bold text-lg mb-2">رمز عبور با موفقیت تغییر کرد</h3>
            <p className="text-sm mb-4">در حال انتقال به صفحه ورود...</p>
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">رمز عبور جدید</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 outline-none text-left"
                dir="ltr"
                required
                disabled={!token}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">تکرار رمز عبور جدید</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 outline-none text-left"
                dir="ltr"
                required
                disabled={!token}
                autoComplete="new-password"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !token || !password || !confirmPassword}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? 'در حال ثبت...' : 'ذخیره رمز عبور جدید'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
