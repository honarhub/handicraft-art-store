'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import WaveDotsLoader from '@/app/components/WaveDotsLoader';

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle URL errors (e.g. from OAuth failure)
  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'OAuthCallback' || err === 'OAuthSignin') {
      setErrorMsg('خطا در ارتباط با سرویس گوگل (OAuthCallback). لطفاً مطمئن شوید دقیقاً از دامنه http://localhost:3000 وارد شده‌اید و کوکی‌های مرورگر مسدود نیستند، یا از طریق فرم زیر وارد شوید.');
    } else if (err === 'AccessDenied') {
      setErrorMsg('دسترسی غیرمجاز: حساب شما دارای نقش مدیر سیستم (ADMIN) نمی‌باشد.');
    } else if (err) {
      setErrorMsg('خطا در احراز هویت: ' + err);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role === 'ADMIN') {
        router.push('/admin');
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
        email: email.trim().toLowerCase(),
        password,
        loginType: 'admin'
      });

      if (res?.error) {
        setErrorMsg(res.error || 'ایمیل یا رمز عبور اشتباه است.');
        setLoading(false);
      } else {
        router.push('/admin');
      }
    } catch {
      setErrorMsg('مشکلی پیش آمد.');
      setLoading(false);
    }
  };

  // If already logged in as a non-admin account, display informative banner
  if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden" dir="rtl">
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-red-600/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-800 text-center relative z-10">
          <div className="w-16 h-16 bg-red-500/15 text-red-400 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-6 border border-red-500/30 shadow-lg shadow-red-500/10">
            🛑
          </div>
          <h2 className="text-2xl font-black text-white mb-2">عدم دسترسی به پنل مدیریت</h2>
          <p className="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed">
            شما با حساب (<strong className="text-white font-mono">{session.user.email || session.user.name}</strong>) با نقش (<span className="text-amber-400 font-bold">{session.user.role || 'USER'}</span>) وارد شده‌اید، اما دسترسی مدیر ارشد (ADMIN) ندارید.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all text-xs cursor-pointer"
            >
              خروج و ورود با حساب مدیر ارشد
            </button>
            <Link
              href="/"
              className="block w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors text-xs"
            >
              بازگشت به سایت اصلی هنرهاب
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-200 relative overflow-hidden" dir="rtl">
      {/* Styles ensuring high-contrast white text and consistent background while typing or autofilling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-login-input {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          background-color: #1e293b !important;
          caret-color: #60a5fa !important;
        }
        .admin-login-input:-webkit-autofill,
        .admin-login-input:-webkit-autofill:hover,
        .admin-login-input:-webkit-autofill:focus,
        .admin-login-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #1e293b inset !important;
          -webkit-text-fill-color: #ffffff !important;
          color: #ffffff !important;
          caret-color: #60a5fa !important;
        }
      ` }} />

      {/* Ambient background glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/15 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/15 blur-[150px] rounded-full pointer-events-none" />

      {/* Header with HonarHub Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 mb-6">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center text-3xl font-black tracking-tight group" dir="rtl">
          <span className="text-white transition-colors group-hover:text-blue-400">هنر</span>
          <span className="bg-[#FF9900] text-black px-2.5 py-0.5 rounded-lg mr-1.5 text-2xl font-black shadow-lg shadow-amber-500/20 transition-transform group-hover:scale-105">هاب</span>
        </Link>

        {/* Executive Badge */}
        <div className="mt-3.5 flex justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            مرکز راهبری و کنترل ارشد سیستم (Master Admin)
          </div>
        </div>

        <h1 className="mt-3 text-xl sm:text-2xl font-black text-white tracking-tight">
          ورود به پنل مدیریت
        </h1>
        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
          دسترسی یکپارچه به سفارش‌ها، هنرمندان، امور مالی و تنظیمات پلتفرم
        </p>
      </div>

      {/* Main Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-slate-900/85 backdrop-blur-xl rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/60 border border-slate-800">
          
          {/* Error Banner */}
          {errorMsg && (
            <div className="bg-red-500/10 text-red-300 text-xs leading-relaxed p-4 rounded-2xl border border-red-500/30 mb-6 text-right space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-red-400">
                <span>⚠️</span>
                <span>پیام سیستم</span>
              </div>
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Google SSO Button */}
          <button 
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/admin' })}
            className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-slate-700 hover:border-slate-600 rounded-xl shadow-sm bg-slate-950/70 text-xs font-bold text-white hover:bg-slate-800 transition-all cursor-pointer group"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" className="shrink-0 transition-transform group-hover:scale-110">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>ورود سریع با حساب گوگل (Google SSO)</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-slate-900 text-slate-500 font-medium">یا ورود با نام کاربری و رمز</span>
            </div>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleLogin} className="space-y-4.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                ایمیل مدیر ارشد
              </label>
              <div className="relative">
                <input 
                  type="email" 
                  name="email" 
                  id="email" 
                  autoComplete="email" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', backgroundColor: '#1e293b' }}
                  className="admin-login-input w-full bg-slate-800 border border-slate-600 text-white px-4 py-2.5 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all placeholder-slate-400 font-mono text-xs" 
                  placeholder="admin@honarhub.ir" 
                  dir="ltr" 
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  رمز عبور امنیتی
                </label>
                <Link 
                  href="/forgot-password?from=admin" 
                  className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                >
                  فراموشی رمز؟
                </Link>
              </div>

              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password" 
                  id="password" 
                  autoComplete="current-password" 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', backgroundColor: '#1e293b' }}
                  className="admin-login-input w-full bg-slate-800 border border-slate-600 text-white px-4 py-2.5 pl-11 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all placeholder-slate-400 text-center font-mono tracking-widest text-sm" 
                  placeholder="••••••••" 
                  dir="ltr" 
                />
                
                {/* Standard SVG Eye Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer transition-colors"
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

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/25 transition-all mt-4 flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              {loading ? <WaveDotsLoader /> : <span>ورود به پنل مدیریت</span>}
            </button>
          </form>
          
          {/* Quick Footer Links */}
          <div className="mt-7 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1.5">
              <span>&larr;</span>
              <span>سایت اصلی هنرهاب</span>
            </Link>
            <Link href="/artist-panel/login" className="hover:text-emerald-400 transition-colors">
              ورود هنرمندان
            </Link>
          </div>
        </div>

        {/* Security watermark footer */}
        <div className="mt-6 text-center text-[11px] text-slate-500">
          سامانه امن راهبری صنایع دستی و آثار فاخر اصیل ایرانی هنرهاب
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <WaveDotsLoader />
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}
