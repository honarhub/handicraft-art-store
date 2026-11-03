import React, { Suspense } from 'react';
import SiteHeader from '@/app/components/SiteHeader';
import SiteFooter from '@/app/components/SiteFooter';
import CustomerAuthForm from './CustomerAuthForm';

export const metadata = {
  title: 'ورود و ثبت‌نام خریداران | هنرهاب',
  description: 'ورود به حساب کاربری و باشگاه مشتریان صنایع دستی اصیل ایرانی هنرهاب',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" dir="rtl">
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-20 relative overflow-hidden">
        {/* Ambient subtle light glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 blur-[120px] rounded-full pointer-events-none -z-0" />

        <div className="relative z-10 w-full max-w-md">
          <Suspense fallback={
            <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-10 shadow-xl border border-slate-200/80 text-center animate-pulse">
              <div className="w-16 h-16 bg-slate-200 rounded-2xl mx-auto mb-4" />
              <div className="h-6 bg-slate-200 rounded-lg w-3/4 mx-auto mb-2" />
              <div className="h-4 bg-slate-100 rounded-lg w-1/2 mx-auto mb-8" />
              <div className="h-12 bg-slate-200 rounded-2xl w-full" />
            </div>
          }>
            <CustomerAuthForm />
          </Suspense>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
