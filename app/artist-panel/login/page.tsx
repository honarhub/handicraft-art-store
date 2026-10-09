'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ArtistLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle URL errors (e.g. from redirect)
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'not_artist') {
      setErrorMsg('حساب کاربری شما دسترسی هنرمند ندارد. لطفاً ابتدا ثبت‌نام کنید یا با حساب هنرمندی وارد شوید.');
    } else if (error === 'no_profile') {
      setErrorMsg('پروفایل هنرمند برای این حساب یافت نشد. لطفاً ابتدا ثبت‌نام خود را تکمیل کنید.');
    } else if (error === 'deleted') {
      setErrorMsg('حساب هنرمندی شما غیرفعال یا حذف شده است. لطفاً با پشتیبانی تماس بگیرید.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role === 'ADMIN') {
        router.push('/admin');
      } else if (session?.user?.role === 'ARTIST') {
        router.push('/artist-panel/dashboard');
      }
      // If role is 'USER', we do NOT redirect to avoid infinite loops.
      // Instead, we render the user-friendly role-mismatch UI below.
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
        loginType: 'artist'
      });

      if (res?.error) {
        setErrorMsg(res.error || 'ایمیل یا رمز عبور اشتباه است.');
        setLoading(false);
      } else {
        router.push('/artist-panel/dashboard');
      }
    } catch (err) {
      setErrorMsg('مشکلی پیش آمد.');
      setLoading(false);
    }
  };

  const [upgrading, setUpgrading] = useState(false);

  const handleUpgradeToArtist = async () => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/artist/upgrade', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/artist-panel/dashboard';
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'خطا در ارتقای حساب کاربری');
        setUpgrading(false);
      }
    } catch {
      setErrorMsg('خطا در برقراری ارتباط با سرور');
      setUpgrading(false);
    }
  };

  // If already authenticated as a non-artist regular user, show role guidance
  if (status === 'authenticated' && session?.user?.role !== 'ARTIST' && session?.user?.role !== 'ADMIN') {
    return (
      <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4">
          🎨
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">فعال‌سازی پنل هنرمند</h3>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          شما با حساب (<strong className="text-slate-800">{session.user.email || session.user.name}</strong>) وارد شده‌اید. می‌توانید با یک کلیک دسترسی هنرمند را برای این حساب فعال کنید.
        </p>

        {errorMsg && (
          <div className="mb-4 bg-red-50 text-red-600 text-sm font-bold p-3 rounded-xl border border-red-100 text-center">
            {errorMsg}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleUpgradeToArtist}
            disabled={upgrading}
            className="block w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all text-center disabled:opacity-50"
          >
            {upgrading ? 'در حال فعال‌سازی...' : '✨ فعال‌سازی پنل هنرمند و ورود'}
          </button>

          <button
            onClick={() => signOut({ callbackUrl: '/artist-panel/login' })}
            className="block w-full py-3 px-4 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-center"
          >
            خروج و ورود با حسابی دیگر
          </button>

          <Link
            href="/"
            className="block text-xs text-slate-400 hover:text-slate-600 pt-2 transition-colors"
          >
            بازگشت به صفحه اصلی سایت
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
      
      <button 
        onClick={() => signIn('google', { callbackUrl: '/artist-panel/dashboard' })}
        className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-slate-300 rounded-xl shadow-sm bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors mb-6"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        ورود با گوگل
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-slate-500 font-medium">یا با ایمیل</span>
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleLogin}>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">ایمیل</label>
          <input 
            type="email" 
            required 
            name="email" 
            id="email" 
            autoComplete="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm transition-colors" 
            dir="ltr" 
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">رمز عبور</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 outline-none text-left"
              dir="ltr"
              required
              autoComplete="current-password"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              )}
            </button>
          </div>
          <div className="flex justify-end mt-2">
            <Link href="/forgot-password" className="text-xs text-slate-500 hover:text-teal-600 font-bold transition-colors">
              رمز عبور خود را فراموش کرده‌اید؟
            </Link>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 text-sm font-bold p-3 rounded-xl border border-red-100 text-center">
            {errorMsg}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors disabled:opacity-50 mt-2"
        >
          {loading ? 'در حال ورود...' : 'ورود به حساب'}
        </button>
      </form>
    </div>
  );
}

export default function ArtistLoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans" dir="rtl">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/" className="text-3xl font-black tracking-tighter text-slate-800">
            هنرهاب <span className="text-teal-600">.</span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold text-slate-900">ورود به پنل هنرمندان</h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          هنوز ثبت‌نام نکرده‌اید؟ <Link href="/artist-panel/register" className="font-medium text-teal-600 hover:text-teal-500">ثبت‌نام کنید</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="bg-white p-8 rounded-3xl text-center text-slate-400">در حال بارگذاری...</div>}>
          <ArtistLoginContent />
        </Suspense>
      </div>
    </div>
  );
}
