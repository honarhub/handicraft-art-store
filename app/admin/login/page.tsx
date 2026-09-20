'use client';

import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [status, session, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
        loginType: 'admin'
      });

      if (res?.error) {
        setErrorMsg(res.error || 'ایمیل یا رمز عبور اشتباه است.');
        setLoading(false);
      } else {
        router.push('/admin');
      }
    } catch (err) {
      setErrorMsg('مشکلی پیش آمد.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6">
            <span className="text-3xl">🛡️</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">ورود به کنترل پنل ارشد</h1>
          <p className="text-slate-400 mt-2 text-sm">فقط مدیران سیستم (Master Admins) مجاز به ورود هستند.</p>
        </div>

        <button 
          onClick={() => signIn('google', { callbackUrl: '/admin' })}
          className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-slate-700 rounded-xl shadow-sm bg-slate-900 text-sm font-bold text-white hover:bg-slate-700 transition-colors mb-6"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          ورود سریع ادمین (Gmail)
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-800 text-slate-500 font-medium">یا ورود اضطراری</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">ایمیل سازمانی</label>
            <input 
              type="email" 
              name="email"
              id="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-600"
              placeholder="admin@mydomain.com"
              dir="ltr"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">رمز عبور امنیتی</label>
            <input 
              type="password" 
              name="password"
              id="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-600"
              placeholder="••••••••"
              dir="ltr"
            />
            <div className="flex justify-end mt-2">
              <a href="/forgot-password" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                رمز عبور خود را فراموش کرده‌اید؟
              </a>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 text-red-400 text-sm font-bold p-3 rounded-xl border border-red-500/20 text-center">
              {errorMsg}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all mt-4 flex items-center justify-center gap-2"
          >
            {loading ? 'در حال بررسی هویت...' : 'ورود امن (دستی)'}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-700 text-center">
          <a href="/" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
            &larr; بازگشت به سایت اصلی
          </a>
        </div>
      </div>
    </div>
  );
}
