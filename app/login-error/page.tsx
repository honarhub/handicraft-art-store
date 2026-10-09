'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'CredentialsSignin':
        return {
          title: 'اطلاعات ورود نامعتبر است',
          desc: 'ایمیل یا رمز عبور وارد شده اشتباه است یا دسترسی حساب شما برای این بخش تایید نشده است.',
        };
      case 'OAuthSignin':
      case 'OAuthCallback':
        return {
          title: 'خطا در ارتباط با گوگل',
          desc: 'ارتباط با سرویس ورود گوگل برقرار نشد. لطفاً وضعیت اینترنت و تحریم‌شکن/فیلترشکن خود را بررسی و مجدداً تلاش کنید.',
        };
      case 'OAuthAccountNotLinked':
        return {
          title: 'حساب‌های کاربری متصل نیستند',
          desc: 'این ایمیل قبلاً با روش دیگری (مثلاً ایمیل و رمز عبور) ثبت‌نام شده است. لطفاً با همان روش قبلی وارد شوید.',
        };
      case 'AccessDenied':
        return {
          title: 'دسترسی غیرمجاز',
          desc: 'حساب کاربری شما اجازه ورود به این بخش از سیستم را ندارد.',
        };
      case 'Configuration':
        return {
          title: 'خطای پیکربندی سرور',
          desc: 'تنظیمات احراز هویت در سرور با مشکل مواجه شده است. لطفاً با مدیر سیستم تماس بگیرید.',
        };
      default:
        return {
          title: 'خطا در ورود به حساب',
          desc: 'متأسفانه در فرآیند احراز هویت مشکلی رخ داد. لطفاً مجدداً تلاش نمایید.',
        };
    }
  };

  const { title, desc } = getErrorMessage(error);

  return (
    <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-100 max-w-md w-full text-center">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-6 shadow-sm">
        ⚠️
      </div>
      <h1 className="text-2xl font-black text-slate-800 mb-3">{title}</h1>
      <p className="text-slate-600 text-sm leading-relaxed mb-8">{desc}</p>

      <div className="space-y-3">
        <Link
          href="/artist-panel/login"
          className="block w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 transition-all text-sm"
        >
          ورود به پنل هنرمندان
        </Link>
        <Link
          href="/admin/login"
          className="block w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all text-sm"
        >
          ورود به پنل ادمین
        </Link>
        <Link
          href="/"
          className="block w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          کد خطا: <span className="font-mono text-slate-500">{error}</span>
        </p>
      </div>
    </div>
  );
}

export default function LoginErrorPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <Suspense fallback={<div className="bg-white p-8 rounded-3xl text-slate-400">در حال بارگذاری...</div>}>
        <LoginErrorContent />
      </Suspense>
    </div>
  );
}
