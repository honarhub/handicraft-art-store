'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطایی رخ داد. لطفا دوباره تلاش کنید.');
      } else {
        setSuccess(true);
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
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔑</div>
          <h1 className="text-2xl font-black text-slate-800">بازیابی رمز عبور</h1>
          <p className="text-slate-500 mt-2 text-sm">ایمیل خود را وارد کنید تا لینک بازیابی برای شما ارسال شود.</p>
        </div>

        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl text-center">
            <h3 className="font-bold text-lg mb-2">درخواست با موفقیت ثبت شد</h3>
            <p className="text-sm leading-relaxed mb-6">
              اگر حسابی با این ایمیل در سیستم وجود داشته باشد، لینک بازیابی رمز عبور به آن ارسال خواهد شد. (در محیط تستی: لینک در کنسول سرور چاپ شده است).
            </p>
            <Link href="/" className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors">
              بازگشت به صفحه اصلی
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">آدرس ایمیل</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-left"
                dir="ltr"
                placeholder="name@example.com"
                required
                autoComplete="email"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  در حال ارسال...
                </>
              ) : (
                'ارسال لینک بازیابی'
              )}
            </button>
            
            <div className="text-center mt-6">
              <Link href="/artist-panel/login" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
                بازگشت به ورود هنرمندان
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
